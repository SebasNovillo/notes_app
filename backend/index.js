require("dotenv").config();

const mongoose = require("mongoose");
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const { authenticateToken } = require("./utilities");
const User = require("./models/user.model");
const Note = require("./models/note.model");

const app = express();

app.use(express.json());
app.use(
    cors({
        origin: "*",
    })
);

// Request Logger
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

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

function toSafeUser(user) {
    return {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        createdAt: user.createdAt,
    };
}

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

        return res.status(201).json({
            error: false,
            user: toSafeUser(user),
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

        return res.json({ error: false, user: toSafeUser(user) });

    } catch (err) {
        return res.status(500).json({ error: true, message: err.message });
    }
});

app.get("/protected", authenticateToken, (req, res) => {
    return res.json({
        error: false,
        message: "You have access ✅",
        user: req.user, // { userId: "..." }
    });
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
            return res.status(404).json({ error: true, message: "User not found" });
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
            user: toSafeUser(userInfo),
            accessToken,
        });

    } catch (err) {
        return res.status(500).json({ error: true, message: err.message });
    }
});

// Add Note
app.post("/add-note", authenticateToken, async (req, res) => {
    const { title, content, tags } = req.body;
    const { userId } = req.user;


    if (!title) {
        return res.status(400).json({ error: true, message: "Title is required" });
    }

    if (!content) {
        return res
            .status(400)
            .json({ error: true, message: "Content is required" });
    }

    try {
        const note = new Note({
            title,
            content,
            tags: tags || [],
            userId: userId,
        });

        await note.save();

        return res.json({
            error: false,
            note,
            message: "Note added succesfully",
        });
    } catch (error) {
        return res.status(500).json({
            error: true,
            message: "Internal Server Error",
        });
    }
});

// Edit Note
app.put("/edit-note/:noteId", authenticateToken, async (req, res) => {
    const noteId = req.params.noteId;
    const { title, content, tags, isPinned } = req.body;
    const { userId } = req.user;

    if (!title && !content && !tags) {
        return res
            .status(400)
            .json({ error: true, message: "No changes provided" });
    }

    try {
        const note = await Note.findOne({ _id: noteId, userId: userId });

        if (!note) {
            return res.status(404).json({ error: true, message: "Note not found" });
        }

        if (title) note.title = title;
        if (content) note.content = content;
        if (tags) note.tags = tags;
        if (isPinned !== undefined) note.isPinned = isPinned;

        await note.save();

        return res.json({
            error: false,
            note,
            message: "Note updated successfully",
        });
    } catch (error) {
        return res.status(500).json({
            error: true,
            message: "Internal Server Error",
        });
    }
});

// Get All Notes
app.get("/get-all-notes", authenticateToken, async (req, res) => {
    const { userId } = req.user;

    try {
        const notes = await Note.find({ userId: userId }).sort({ isPinned: -1 });

        return res.json({
            error: false,
            notes,
            message: "All notes retrieved successfully",
        });
    } catch (error) {
        return res.status(500).json({
            error: true,
            message: "Internal Server Error",
        });
    }
});

// Get All Tags
app.get("/get-all-tags", authenticateToken, async (req, res) => {
    const { userId } = req.user;

    try {
        const notes = await Note.find({ userId: userId });

        // Extract all tags from notes
        const allTags = notes.reduce((acc, note) => {
            return [...acc, ...note.tags];
        }, []);

        // Get unique tags
        const uniqueTags = [...new Set(allTags)];

        return res.json({
            error: false,
            tags: uniqueTags,
            message: "Tags retrieved successfully",
        });
    } catch (error) {
        return res.status(500).json({
            error: true,
            message: "Internal Server Error",
        });
    }
});

// Delete Note
app.delete("/delete-note/:noteId", authenticateToken, async (req, res) => {
    const noteId = req.params.noteId;
    const { userId } = req.user;

    try {
        const note = await Note.findOne({ _id: noteId, userId: userId });

        if (!note) {
            return res.status(404).json({ error: true, message: "Note not found" });
        }

        await Note.deleteOne({ _id: noteId, userId: userId });

        return res.json({
            error: false,
            message: "Note deleted successfully",
        });
    } catch (error) {
        return res.status(500).json({
            error: true,
            message: "Internal Server Error",
        });
    }
});

// Update IsPinned
app.put("/update-note-pinned/:noteId", authenticateToken, async (req, res) => {
    const noteId = req.params.noteId;
    const { isPinned } = req.body;
    const { userId } = req.user;

    try {
        const note = await Note.findOne({ _id: noteId, userId: userId });

        if (!note) {
            return res.status(404).json({ error: true, message: "Note not found" });
        }

        note.isPinned = isPinned;

        await note.save();

        return res.json({
            error: false,
            note,
            message: "Note pinned status updated successfully",
        });
    } catch (error) {
        return res.status(500).json({
            error: true,
            message: "Internal Server Error",
        });
    }
});

// Search Notes
app.get("/search-notes", authenticateToken, async (req, res) => {
    const { userId } = req.user;
    const { query } = req.query;

    if (!query) {
        return res
            .status(400)
            .json({ error: true, message: "Search query is required" });
    }

    try {
        const matchingNotes = await Note.find({
            userId: userId,
            $or: [
                { title: { $regex: new RegExp(query, "i") } },
                { tags: { $regex: new RegExp(query, "i") } },
            ],
        });

        return res.json({
            error: false,
            notes: matchingNotes,
            message: "Notes matching the search query retrieved successfully",
        });
    } catch (error) {
        return res.status(500).json({
            error: true,
            message: "Internal Server Error",
        });
    }
});



app.listen(8000, () => console.log("✅ Server running on port 8000"));

module.exports = app;
