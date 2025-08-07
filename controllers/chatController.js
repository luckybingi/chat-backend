const Chat = require("../models/chatModel");
const User = require("../models/userModel");
const asyncHandler = require("express-async-handler");


const accessChat = async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ message: "UserId param not sent with request" });
  }

  let chat = await Chat.findOne({
    isGroupChat: false,
    $and: [
      { users: { $elemMatch: { $eq: req.user._id } } },
      { users: { $elemMatch: { $eq: userId } } },
    ],
  }).populate("users", "-password").populate("latestMessage");

  chat = await User.populate(chat, {
    path: "latestMessage.sender",
    select: "name pic email",
  });

  if (chat) {
    return res.status(200).send(chat);
  }

  // Chat doesn't exist, create new
  try {
    const newChat = await Chat.create({
      chatName: "sender",
      isGroupChat: false,
      users: [req.user._id, userId],
    });

    const fullChat = await Chat.findById(newChat._id).populate("users", "-password");
    res.status(200).json(fullChat);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};







const allChats = async (req, res) => {
  try {
    // STEP 1: Find all chats where logged-in user is a participant
    const chats = await Chat.find({ users: { $elemMatch: { $eq: req.user._id } } })
      // STEP 2: Replace ObjectIds in users[] with actual user data (excluding password)
      .populate("users", "-password")
      // STEP 3: If group chat, populate group admin too (excluding password)
      .populate("groupAdmin", "-password")
      // STEP 4: Populate latestMessage object stored in the chat
      .populate("latestMessage")
      // STEP 5: Sort chats so newest ones come first
      .sort({ updatedAt: -1 });

    // STEP 6: Deep populate latestMessage.sender with name, pic, email
    const fullChats = await User.populate(chats, {
      path: "latestMessage.sender",
      select: "name pic email"
    });

    // STEP 7: Send result to frontend
    res.status(200).send(fullChats);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const createGroupChat = asyncHandler(async (req, res) => {
  const { name, users } = req.body;

  if (!name || !users) {
    return res.status(400).json({ message: "Please provide name and users" });
  }

  const parsedUsers = JSON.parse(users);

  if (parsedUsers.length < 2) {
    return res.status(400).json({ message: "At least 2 users are required to form a group" });
  }

  parsedUsers.push(req.user); // Add the logged-in user

  const groupChat = await Chat.create({
    chatName: name,
    users: parsedUsers,
    isGroupChat: true,
    groupAdmin: req.user._id,
  });

  const fullGroupChat = await Chat.findById(groupChat._id)
    .populate("users", "-password")
    .populate("groupAdmin", "-password");

  res.status(201).json(fullGroupChat);
});

// Rename group chat
const renameGroup = asyncHandler(async (req, res) => {
  const { chatId, chatName } = req.body;

  const updatedChat = await Chat.findByIdAndUpdate(
    chatId,
    { chatName },
    { new: true }
  )
    .populate("users", "-password")
    .populate("groupAdmin", "-password");

  if (!updatedChat) {
    res.status(404).send("Chat Not Found");
  } else {
    res.json(updatedChat);
  }
});

// 👥 Add user to group
const addToGroup = asyncHandler(async (req, res) => {
  const { chatId, userId } = req.body;

  const chat = await Chat.findById(chatId);

  if (!chat.isGroupChat) {
    return res.status(400).json({ message: "Not a group chat" });
  }

  // Optional: Only groupAdmin can add others
  if (chat.groupAdmin.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: "Only admins can add members" });
  }

  const updatedChat = await Chat.findByIdAndUpdate(
    chatId,
    { $addToSet: { users: userId } }, // Prevent duplicates
    { new: true }
  )
    .populate("users", "-password")
    .populate("groupAdmin", "-password");

  res.json(updatedChat);
});

// ❌ Remove user from group
const removeFromGroup = asyncHandler(async (req, res) => {
  const { chatId, userId } = req.body;

  const chat = await Chat.findById(chatId);

  if (!chat.isGroupChat) {
    return res.status(400).json({ message: "Not a group chat" });
  }

  // Optional: Only groupAdmin can remove others
  if (chat.groupAdmin.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: "Only admins can remove members" });
  }

  const updatedChat = await Chat.findByIdAndUpdate(
    chatId,
    { $pull: { users: userId } },
    { new: true }
  )
    .populate("users", "-password")
    .populate("groupAdmin", "-password");

  res.json(updatedChat);
});



//ai summary


const Message = require("../models/messageModel");
const axios = require("axios");

const HF_TOKEN = process.env.HF_API_TOKEN;

const generateChatSummary = asyncHandler(async (req, res) => {
  const { chatId } = req.params;
  const { start, end } = req.query;

  if (!start || !end) {
    return res.status(400).json({ message: "Start and end query params required." });
  }

  const startTime = new Date(start);
  const endTime = new Date(end);

  const msgs = await Message.find({
    chat: chatId,
    createdAt: { $gte: startTime, $lte: endTime }
  }).populate("sender", "name");

  if (!msgs.length) {
    return res.status(404).json({ message: "No messages in that range." });
  }

  const conversation = msgs.map(m => `${m.sender.name}: ${m.content}`).join("\n");

  try {
//     const prompt = `Below is a chat conversation between users.

// Your task: 
// 1. Summarize ONLY the actual facts explicitly mentioned in the conversation.
// 2. DO NOT include any information that is implied or assumed.
// 3. DO NOT repeat this instruction or say what should or shouldn’t be done — just provide the factual summary.

// CONVERSATION:
// ${conversation}
// `;

//     const hfRes = await axios.post(
//       "https://api-inference.huggingface.co/models/philschmid/bart-large-cnn-samsum",
//       { inputs: prompt },
//       {
//         headers: {
//           Authorization: `Bearer ${HF_TOKEN}`,
//           "Content-Type": "application/json",
//         },
//       }
//     );

const hfRes = await axios.post(
  "https://api-inference.huggingface.co/models/philschmid/bart-large-cnn-samsum",
  { inputs: conversation },
  {
    headers: {
      Authorization: `Bearer ${HF_TOKEN}`,
      "Content-Type": "application/json",
    },
  }
);

    
    // ✅ SAFELY extract only the model's output summary
    const summary = Array.isArray(hfRes.data) && hfRes.data[0]?.summary_text
      ? hfRes.data[0].summary_text
      : "❌ Summarization failed. No valid response.";

    res.json({ summary });
  } catch (error) {
    console.error("HF API error:", error?.response?.data || error.message);
    res.status(500).json({ message: "Hugging Face summarization failed." });
  }
});



module.exports = {
  accessChat, allChats, createGroupChat, renameGroup, addToGroup,
  removeFromGroup, generateChatSummary
};
