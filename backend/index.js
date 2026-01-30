require("dotenv").config();

const mongoose = require("mongoose");
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const { authenticateToken } = require("./utilities");
const User = require("./models/user.model");

const app = express();

app.use(express.json());
app.use(
  cors({
    origin: "*",
  })
);

// ---- Mongo connection (with logs) ----
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  });

app.get("/", (req, res) => {
  res.json({ data: "hello" });
});

// Create Account
app.post("/create-account", async (req, res) => {
  try {
    const { fullName, email, password, confirmPassword } = req.body;

    if (!fullName) {
      return res.status(400).json({ error: true, message: "Full Name is required" });
    }
    if (!email) {
      return res.status(400).json({ error: true, message: "Email is required" });
    }
    if (!password) {
      return res.status(400).json({ error: true, message: "Password is required" });
    }

    // NEW: confirm password checks
    if (!confirmPassword) {
      return res.status(400).json({ error: true, message: "Confirm Password is required" });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ error: true, message: "Passwords do not match" });
    }

    const isUser = await User.findOne({ email });
    if (isUser) {
      return res.status(409).json({ error: true, message: "User already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      fullName,
      email,
      password: hashedPassword,
    });

    await user.save();

    // Token with userId only
    const accessToken = jwt.sign(
      { userId: user._id },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "3600m" }
    );

    // Safe user response (no password)
    const safeUser = {
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      createdOn: user.createdOn,
    };

    return res.status(201).json({
      error: false,
      user: safeUser,
      accessToken,
      message: "Registration Successful",
    });
  } catch (err) {
    return res.status(500).json({ error: true, message: err.message });
  }
});


// Protected route to test JWT quickly
app.get("/get-user", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-password");
    if (!user) {
      return res.status(404).json({ error: true, message: "User not found" });
    }
    return res.json({ error: false, user });
  } catch (err) {
    return res.status(500).json({ error: true, message: err.message });
  }
});

// Login Account
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email) {
      return res.status(400).json({ error: true, message: "Email is required" });
    }

    if (!password) {
      return res.status(400).json({ error: true, message: "Password is required" });
    }

    const userInfo = await User.findOne({ email });
    if (!userInfo) {
      return res.status(400).json({ error: true, message: "User not found" });
    }

    // Compare hashed password
    const isPasswordValid = await bcrypt.compare(password, userInfo.password);
    if (!isPasswordValid) {
      return res.status(400).json({
        error: true,
        message: "Invalid credentials",
      });
    }

    // Token with userId only
    const accessToken = jwt.sign(
      { userId: userInfo._id },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "3600m" }
    );

    return res.json({
      error: false,
      message: "Login Successful",
      email: userInfo.email,
      accessToken,
    });
  } catch (err) {
    return res.status(500).json({ error: true, message: err.message });
  }
});







app.listen(8000, () => console.log("✅ Server running on port 8000"));

module.exports = app;
