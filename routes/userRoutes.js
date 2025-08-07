const express = require("express");
const { registerUser, authUser, allUsers } = require("../controllers/userController");
const { protect } = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/", registerUser); // Signup
router.post("/login", authUser); // Login

// 🔍 Search users by name or email (only if authenticated)
router.get("/", protect, allUsers);

module.exports = router;
