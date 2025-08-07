


console.log("✅ scheduledMessages.js loaded");

// scheduledMessages.js
const cron = require("node-cron");
const ScheduledMessage = require("./models/scheduledMessageModel");
const Message = require("./models/messageModel");

module.exports = function scheduleMessages(io) {

   console.log("📅 Scheduler initialized");
  // Run every minute
  
  cron.schedule("* * * * *", async () => {

    const now = new Date(); 
    console.log("⏰ Cron job triggered at", new Date().toLocaleString())
    
console.log("🕐 Server Time:", new Date().toISOString());

    try {
      // 1) Find all pending messages
      const pending = await ScheduledMessage.find({
        delivered: false,
        scheduledTime: { $lte: now },
      });

console.log(`🔎 Found ${pending.length} scheduled message(s)`);

      for (const msg of pending) {
        // 2) Atomically mark it delivered; skip if someone else beat us to it
        const updated = await ScheduledMessage.findOneAndUpdate(
          { _id: msg._id, delivered: false },
          { delivered: true },
          { new: true }
        );

        if (!updated) {
          // Either already delivered or just raced — skip it
          continue;
        }

        // 3) Create the real chat message
        const newMsg = await Message.create({
          sender: msg.sender,
          content: msg.content,
          chat: msg.chat,
        });

        // 4) Populate and emit
        await newMsg.populate("sender", "name pic");
        await newMsg.populate("chat");
        await newMsg.populate({
          path: "chat.users",
          select: "name email pic",
        });
        io.to(msg.chat.toString()).emit("message received", newMsg);

        console.log(`✅ Delivered scheduled message once: "${msg.content}"`);
      }
    } catch (err) {
      console.error("❌ Error in cron job:", err);
    }
  });
};

