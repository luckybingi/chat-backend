// const express = require("express");
// const { sendMessage,allMessages,scheduleMessage } = require("../controllers/messageController");
// const { protect } = require("../middlewares/authMiddleware");

// const router = express.Router();

// // Route to send a message
// router.post("/schedule", protect, scheduleMessage);

// router.post("/", protect, sendMessage);
// router.get("/:chatId", protect, allMessages);

// module.exports = router;


const express = require("express");
const { sendMessage, allMessages, scheduleMessage } = require("../controllers/messageController");
const { protect } = require("../middlewares/authMiddleware");

const router = express.Router();

// ✅ First register the specific route (schedule)
router.post("/schedule", protect, scheduleMessage);

// ✅ Then register sendMessage (generic post)
router.post("/", protect, sendMessage);

// ✅ Get all messages for a chat
router.get("/:chatId", protect, allMessages);

module.exports = router;
