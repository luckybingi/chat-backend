// // scheduledMessages.js
// const cron = require("node-cron");
// const ScheduledMessage = require("./models/scheduledMessageModel");
// const Message = require("./models/messageModel");

// module.exports = function scheduleMessages(io) {
//   cron.schedule("* * * * *", async () => {
//     try {
//       const now = new Date();
//       const msgs = await ScheduledMessage.find({
//         delivered: false,
//         scheduledTime: { $lte: now },
//       })
//         .populate("sender", "name pic")
//         .populate("chat");

//       for (const msg of msgs) {
//         if (!msg.chat?._id) continue;

//         const newMsg = await Message.create({
//           sender: msg.sender._id,
//           content: msg.content,
//           chat: msg.chat._id,
//         });
//         await newMsg.populate("chat users", "name email pic");

//         io.to(msg.chat._id.toString()).emit("message received", newMsg);

//         msg.delivered = true;
//         await msg.save();
//       }
//     } catch (err) {
//       console.error("Cron error (contained):", err);
//     }
//   });
// };

// const cron = require('node-cron');
// const ScheduledMessage = require('./models/scheduledMessageModel');
// const Message = require('./models/messageModel');

// module.exports = function(io) {
//   cron.schedule('* * * * *', async () => {
//     const now = new Date();

//     try {
//       const messagesToSend = await ScheduledMessage.find({
//         delivered: false,
//         scheduledTime: { $lte: now },
//       })
//         .populate("sender", "name pic")
//         .populate("chat");

//       for (const msg of messagesToSend) {
//         if (!msg.chat || !msg.chat._id) {
//           console.warn("⚠️ Skipping message due to missing chat:", msg);
//           continue;
//         }

//         const newMsg = await Message.create({
//           sender: msg.sender._id,
//           content: msg.content,
//           chat: msg.chat._id,
//         });

//         await newMsg.populate("sender", "name pic");
//         await newMsg.populate("chat");
//         await newMsg.populate({
//           path: "chat.users",
//           select: "name email pic",
//         });

//         io.to(msg.chat._id.toString()).emit("message received", newMsg);

//         msg.delivered = true;
//         await msg.save();

//         console.log("✅ Delivered scheduled message:", newMsg.content);
//       }
//     } catch (err) {
//       console.error("❌ Error in scheduled message cron:", err);
//     }
//   });
// };



// scheduledMessages.js
const cron = require("node-cron");
const ScheduledMessage = require("./models/scheduledMessageModel");
const Message = require("./models/messageModel");

module.exports = function scheduleMessages(io) {
  // Run every minute
  cron.schedule("* * * * *", async () => {
    const now = new Date();

    try {
      // 1) Find all pending messages
      const pending = await ScheduledMessage.find({
        delivered: false,
        scheduledTime: { $lte: now },
      });

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
