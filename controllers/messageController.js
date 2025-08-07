const Message = require("../models/messageModel");
const User = require("../models/userModel");
const Chat = require("../models/chatModel");
const ScheduledMessage = require("../models/scheduledMessageModel");



const sendMessage = async (req, res) => {
  const { content, chatId } = req.body;

  if (!content || !chatId) {
    console.log("Invalid data passed into request");
    return res.sendStatus(400);
  }

  
  let newMessage = {
    sender: req.user._id,
    content: content,
    chat: chatId,
  };

  try {
    let message = await Message.create(newMessage);

    // Populate sender details
    message = await message.populate("sender", "name pic email");

    // Populate chat object
    message = await message.populate("chat");

    // Populate chat.users inside the chat object
    message = await User.populate(message, {
      path: "chat.users",
      select: "name pic email",
    });

    // Update the chat's latestMessage
    await Chat.findByIdAndUpdate(chatId, {
      latestMessage: message,
    });

    res.json(message);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};



const allMessages = async (req, res) => {
  try {
    const messages = await Message.find({ chat: req.params.chatId })
      .populate("sender", "name pic email")
      .populate("chat");

    res.json(messages);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};



const scheduleMessage = async (req, res) => {
  const { content, chatId, scheduledTime } = req.body;

  if (!content || !chatId || !scheduledTime) {
    return res.status(400).send({ message: "Missing fields" });
  }

  try {
    const message = await ScheduledMessage.create({
      chat: chatId,
      sender: req.user._id,
      content,
      scheduledTime,
    });

    res.status(201).json(message);
  } catch (error) {
    res.status(500).send({ message: "Failed to schedule message" });
  }
};




module.exports = { sendMessage,allMessages,scheduleMessage };
