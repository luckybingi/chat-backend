const express = require("express");
const router = express.Router();
const {
  accessChat,
  allChats,
  createGroupChat,
  renameGroup,
  addToGroup,
  removeFromGroup, generateChatSummary
} = require("../controllers/chatController");
const { protect } = require("../middlewares/authMiddleware");

// 🔹 Create or fetch one-on-one chat
router.post("/", protect, accessChat);

// 🔹 Get all chats for the logged-in user
router.get("/", protect, allChats);

// 🔹 Create a group chat
router.post("/group", protect, createGroupChat);

// 🔹 Rename a group
router.put("/rename", protect, renameGroup);

// 🔹 Add user to group
router.put("/groupadd", protect, addToGroup);

// 🔹 Remove user from group
router.put("/groupremove", protect, removeFromGroup);

router.get("/:chatId/summary", protect, generateChatSummary);

module.exports = router;
