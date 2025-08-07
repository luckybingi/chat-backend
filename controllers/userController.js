const User = require("../models/userModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Helper function to create token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });
};


// @desc    Register new user
// @route   POST /api/user/register
const registerUser = async (req, res) => {
  const { name, email, password,pic } = req.body;

  const userExists = await User.findOne({ email });
console.log("Checking if user exists:", userExists);

  if (userExists) {
    return res.status(400).json({ message: "User already exists" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await User.create({
    name,
    email,
    password: hashedPassword,
       pic,
  });

  res.status(201).json({
    _id: user._id,
    name: user.name,
    email: user.email,
     pic: user.pic,
    token: generateToken(user._id),
  });
};


// @desc    Login user
// @route   POST /api/user/login
const authUser = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(401).json({ message: "Invalid Email or Password" });
  }

  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  res.json({
    _id: user._id,
    name: user.name,
    email: user.email,
    token: generateToken(user._id),
  });
};





// @desc    Get all users based on search query
// @route   GET /api/user?search=xyz
// @access  Protected
const allUsers = async (req, res) => {
  const keyword = req.query.search
    ? {
        $or: [
          { name: { $regex: req.query.search, $options: "i" } },
          { email: { $regex: req.query.search, $options: "i" } },
        ],
      }
    : {};

  // Exclude the current logged-in user
  const users = await User.find(keyword).find({ _id: { $ne: req.user._id } });

  res.send(users);
};





module.exports = { registerUser, authUser,allUsers };
