
// const express = require("express");
// const dotenv = require("dotenv");
// const connectDB = require("./config/db");
// const cors = require("cors");
// const http = require("http");
// const { Server } = require("socket.io");

// // Models for scheduled message delivery
// const ScheduledMessage = require("./models/scheduledMessageModel");
// const Message = require("./models/messageModel");
// const Chat = require("./models/chatModel");

// dotenv.config();
// connectDB();

// const app = express();
// app.use(cors());
// app.use(express.json());

// // Routes
// const chatRoutes = require("./routes/chatRoutes");
// const messageRoutes = require("./routes/messageRoutes");
// const userRoutes = require("./routes/userRoutes");

// app.use("/api/user", userRoutes);
// app.use("/api/chat", chatRoutes);
// app.use("/api/message", messageRoutes);

// // Test Routes
// app.get("/", (req, res) => res.send("API is running..."));
// app.get("/get", (req, res) => res.send("okkkk"));

// // Create HTTP server
// const server = http.createServer(app);

// // Initialize Socket.IO
// const io = new Server(server, {
//   pingTimeout: 60000,
//   cors: {
//     origin: "http://localhost:5173",
//     credentials: true,
//   },
// });


// // Socket.IO Event Handling
// io.on("connection", (socket) => {
//   console.log("✅ New client connected!");

//   socket.on("setup", (userData) => {
//     socket.join(userData._id);
//     socket.emit("connected");
//   });

//   socket.on("join chat", (room) => {
//     socket.join(room);
//     console.log("🟦 User joined room:", room);
//   });

//   socket.on("new message", (newMessageReceived) => {
//     const chat = newMessageReceived.chat;
//     if (!chat.users) return console.log("Chat.users not defined");

//     chat.users.forEach((user) => {
//       if (user._id === newMessageReceived.sender._id) return;
//       socket.in(user._id).emit("message received", newMessageReceived);
//     });
//   });

//   socket.on("disconnect", () => {
//     console.log("❌ User disconnected");
//   });
// });




// require("./scheduledMessages")(io);


// console.log("OPENAI KEY:", process.env.OPENAI_API_KEY);




// // Start server
// const PORT = process.env.PORT || 5000;
// server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

// Initialize app
const app = express();
app.use(cors());
app.use(express.json());

// Routes
const chatRoutes = require("./routes/chatRoutes");
const messageRoutes = require("./routes/messageRoutes");
const userRoutes = require("./routes/userRoutes");

app.use("/api/user", userRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/message", messageRoutes);

// Test Routes
app.get("/", (req, res) => res.send("API is running..."));
app.get("/get", (req, res) => res.send("okkkk"));

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  pingTimeout: 60000,
  cors: {
    origin: "*", // Allow all origins for now — update to frontend URL later
    credentials: true,
  },
});

// Socket.IO Events
io.on("connection", (socket) => {
  console.log("✅ New client connected!");

  socket.on("setup", (userData) => {
    socket.join(userData._id);
    socket.emit("connected");
  });

  socket.on("join chat", (room) => {
    socket.join(room);
    console.log("🟦 User joined room:", room);
  });

  socket.on("new message", (newMessageReceived) => {
    const chat = newMessageReceived.chat;
    if (!chat.users) return console.log("Chat.users not defined");

    chat.users.forEach((user) => {
      if (user._id === newMessageReceived.sender._id) return;
      socket.in(user._id).emit("message received", newMessageReceived);
    });
  });

  socket.on("disconnect", () => {
    console.log("❌ User disconnected");
  });
});

// Scheduled message sender
require("./scheduledMessages")(io);

// Optional: Log OpenAI key to check if it's loading correctly
// if (process.env.OPENAI_API_KEY) {
//   console.log("✅ OpenAI Key loaded");
// }

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));



