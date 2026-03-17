require("dotenv").config({ path: process.env.DOTENV_PATH || ".env.local" });
require("dotenv").config();
const mongoose = require("mongoose");
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const { authenticateToken } = require("./utilities");
const User = require("./models/user.model");
const Note = require("./models/note.model");
const Folder = require("./models/folder.model");

const app = express();
const PORT = process.env.PORT || 8000;
const allowedOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(",").map((origin) => origin.trim()).filter(Boolean)
    : ["http://localhost:5173"];
const validNoteModes = new Set(["quick", "document"]);

app.use(express.json());
app.use(
    cors({
        origin(origin, callback) {
            if (!origin || allowedOrigins.includes(origin)) {
                return callback(null, true);
            }

            return callback(new Error("Origin not allowed by CORS"));
        },
    })
);

app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => console.log("MongoDB connected"))
    .catch((err) => {
        console.error("MongoDB connection error:", err.message);
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

function escapeRegex(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

app.post("/create-account", async (req, res) => {
    try {
        const { fullName, email, password, confirmPassword } = req.body;
        const normalizedEmail = email?.trim().toLowerCase();

        if (!fullName?.trim()) {
            return res.status(400).json({ error: true, message: "Full Name is required" });
        }
        if (!normalizedEmail) {
            return res.status(400).json({ error: true, message: "Email is required" });
        }
        if (!password) {
            return res.status(400).json({ error: true, message: "Password is required" });
        }
        if (password.length < 8) {
            return res.status(400).json({ error: true, message: "Password must be at least 8 characters" });
        }
        if (!confirmPassword) {
            return res.status(400).json({ error: true, message: "Confirm Password is required" });
        }
        if (password !== confirmPassword) {
            return res.status(400).json({ error: true, message: "Passwords do not match" });
        }

        const isUser = await User.findOne({ email: normalizedEmail });
        if (isUser) {
            return res.status(409).json({ error: true, message: "User already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = new User({
            fullName: fullName.trim(),
            email: normalizedEmail,
            password: hashedPassword,
        });

        await user.save();

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
        message: "You have access",
        user: req.user,
    });
});

app.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        const normalizedEmail = email?.trim().toLowerCase();

        if (!normalizedEmail) {
            return res.status(400).json({ error: true, message: "Email is required" });
        }

        if (!password) {
            return res.status(400).json({ error: true, message: "Password is required" });
        }

        const userInfo = await User.findOne({ email: normalizedEmail });

        if (!userInfo) {
            return res.status(404).json({ error: true, message: "User not found" });
        }

        const isPasswordValid = await bcrypt.compare(password, userInfo.password);
        if (!isPasswordValid) {
            return res.status(400).json({
                error: true,
                message: "Invalid credentials",
            });
        }

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

app.put("/update-user", authenticateToken, async (req, res) => {
    const { fullName, password } = req.body;
    const { userId } = req.user;

    try {
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ error: true, message: "User not found" });
        }

        if (fullName?.trim()) user.fullName = fullName.trim();

        if (password) {
            if (password.length < 8) {
                return res.status(400).json({ error: true, message: "Password must be at least 8 characters" });
            }
            const hashedPassword = await bcrypt.hash(password, 10);
            user.password = hashedPassword;
        }

        await user.save();

        return res.json({
            error: false,
            user: toSafeUser(user),
            message: "User profile updated successfully",
        });
    } catch (error) {
        return res.status(500).json({ error: true, message: "Internal Server Error" });
    }
});

app.post("/add-note", authenticateToken, async (req, res) => {
    const { title, content, tags, folderId, noteMode = "quick" } = req.body;
    const { userId } = req.user;

    if (!title?.trim()) {
        return res.status(400).json({ error: true, message: "Title is required" });
    }

    if (!content) {
        return res.status(400).json({ error: true, message: "Content is required" });
    }

    if (!validNoteModes.has(noteMode)) {
        return res.status(400).json({ error: true, message: "Invalid note mode" });
    }

    try {
        const note = new Note({
            title: title.trim(),
            content,
            noteMode,
            tags: tags || [],
            userId,
            folderId: folderId || null,
        });

        await note.save();

        return res.json({
            error: false,
            note,
            message: "Note added successfully",
        });
    } catch (error) {
        return res.status(500).json({
            error: true,
            message: "Internal Server Error",
        });
    }
});

app.put("/edit-note/:noteId", authenticateToken, async (req, res) => {
    const noteId = req.params.noteId;
    const { title, content, tags, isPinned, folderId, noteMode } = req.body;
    const { userId } = req.user;

    if (!title && !content && !tags && isPinned === undefined && folderId === undefined && noteMode === undefined) {
        return res.status(400).json({ error: true, message: "No changes provided" });
    }

    if (noteMode !== undefined && !validNoteModes.has(noteMode)) {
        return res.status(400).json({ error: true, message: "Invalid note mode" });
    }

    try {
        const note = await Note.findOne({ _id: noteId, userId });

        if (!note) {
            return res.status(404).json({ error: true, message: "Note not found" });
        }

        if (title?.trim()) note.title = title.trim();
        if (content) note.content = content;
        if (tags) note.tags = tags;
        if (isPinned !== undefined) note.isPinned = isPinned;
        if (folderId !== undefined) note.folderId = folderId || null;
        if (noteMode !== undefined) note.noteMode = noteMode;

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

app.get("/get-note/:noteId", authenticateToken, async (req, res) => {
    const { noteId } = req.params;
    const { userId } = req.user;

    try {
        const note = await Note.findOne({ _id: noteId, userId });

        if (!note) {
            return res.status(404).json({ error: true, message: "Note not found" });
        }

        return res.json({
            error: false,
            note,
            message: "Note retrieved successfully",
        });
    } catch (error) {
        return res.status(500).json({
            error: true,
            message: "Internal Server Error",
        });
    }
});

app.get("/get-all-notes", authenticateToken, async (req, res) => {
    const { userId } = req.user;

    try {
        const notes = await Note.find({ userId }).sort({ isPinned: -1, position: 1, createdAt: -1 });

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

app.get("/get-all-tags", authenticateToken, async (req, res) => {
    const { userId } = req.user;

    try {
        const notes = await Note.find({ userId });
        const allTags = notes.reduce((acc, note) => {
            return [...acc, ...note.tags];
        }, []);

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

app.delete("/delete-note/:noteId", authenticateToken, async (req, res) => {
    const noteId = req.params.noteId;
    const { userId } = req.user;

    try {
        const note = await Note.findOne({ _id: noteId, userId });

        if (!note) {
            return res.status(404).json({ error: true, message: "Note not found" });
        }

        await Note.deleteOne({ _id: noteId, userId });

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

app.put("/update-note-pinned/:noteId", authenticateToken, async (req, res) => {
    const noteId = req.params.noteId;
    const { isPinned } = req.body;
    const { userId } = req.user;

    try {
        const note = await Note.findOne({ _id: noteId, userId });

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

app.get("/search-notes", authenticateToken, async (req, res) => {
    const { userId } = req.user;
    const { query } = req.query;

    if (!query?.trim()) {
        return res.status(400).json({ error: true, message: "Search query is required" });
    }

    try {
        const safeQuery = escapeRegex(query.trim());
        const matchingNotes = await Note.find({
            userId,
            $or: [
                { title: { $regex: new RegExp(safeQuery, "i") } },
                { content: { $regex: new RegExp(safeQuery, "i") } },
                { tags: { $regex: new RegExp(safeQuery, "i") } },
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

app.put("/update-note-folder/:noteId", authenticateToken, async (req, res) => {
    const noteId = req.params.noteId;
    const { folderId } = req.body;
    const { userId } = req.user;

    try {
        const note = await Note.findOne({ _id: noteId, userId });

        if (!note) {
            return res.status(404).json({ error: true, message: "Note not found" });
        }

        note.folderId = folderId || null;
        await note.save();

        return res.json({
            error: false,
            note,
            message: "Note moved successfully",
        });
    } catch (error) {
        return res.status(500).json({ error: true, message: "Internal Server Error" });
    }
});

app.post("/add-folder", authenticateToken, async (req, res) => {
    const { name } = req.body;
    const { userId } = req.user;

    if (!name) {
        return res.status(400).json({ error: true, message: "Folder name is required" });
    }

    try {
        const folder = new Folder({ name, userId });
        await folder.save();

        return res.json({ error: false, folder, message: "Folder created successfully" });
    } catch (error) {
        return res.status(500).json({ error: true, message: "Internal Server Error" });
    }
});

app.get("/get-all-folders", authenticateToken, async (req, res) => {
    const { userId } = req.user;

    try {
        const folders = await Folder.find({ userId }).sort({ position: 1, createdAt: -1 });
        return res.json({ error: false, folders, message: "Folders retrieved successfully" });
    } catch (error) {
        return res.status(500).json({ error: true, message: "Internal Server Error" });
    }
});

app.put("/update-folder/:folderId", authenticateToken, async (req, res) => {
    const folderId = req.params.folderId;
    const { name } = req.body;
    const { userId } = req.user;

    if (!name) {
        return res.status(400).json({ error: true, message: "Folder name is required" });
    }

    try {
        const folder = await Folder.findOne({ _id: folderId, userId });
        if (!folder) {
            return res.status(404).json({ error: true, message: "Folder not found" });
        }

        folder.name = name;
        await folder.save();

        return res.json({ error: false, folder, message: "Folder renamed successfully" });
    } catch (error) {
        return res.status(500).json({ error: true, message: "Internal Server Error" });
    }
});

app.delete("/delete-folder/:folderId", authenticateToken, async (req, res) => {
    const folderId = req.params.folderId;
    const { userId } = req.user;

    try {
        const folder = await Folder.findOne({ _id: folderId, userId });
        if (!folder) {
            return res.status(404).json({ error: true, message: "Folder not found" });
        }

        await Note.updateMany({ folderId, userId }, { $set: { folderId: null } });
        await Folder.deleteOne({ _id: folderId, userId });

        return res.json({ error: false, message: "Folder deleted successfully" });
    } catch (error) {
        return res.status(500).json({ error: true, message: "Internal Server Error" });
    }
});

app.put("/update-note-positions", authenticateToken, async (req, res) => {
    const { notes } = req.body;
    const { userId } = req.user;

    if (!notes || !Array.isArray(notes)) {
        return res.status(400).json({ error: true, message: "Invalid payload format" });
    }

    try {
        for (const noteCmd of notes) {
            await Note.updateOne(
                { _id: noteCmd._id, userId },
                { $set: { position: noteCmd.position } }
            );
        }

        return res.json({
            error: false,
            message: "Note positions updated successfully",
        });
    } catch (error) {
        return res.status(500).json({ error: true, message: "Internal Server Error" });
    }
});

app.put("/update-folder-positions", authenticateToken, async (req, res) => {
    const { folders } = req.body;
    const { userId } = req.user;

    if (!folders || !Array.isArray(folders)) {
        return res.status(400).json({ error: true, message: "Invalid payload format" });
    }

    try {
        for (const folderCmd of folders) {
            await Folder.updateOne(
                { _id: folderCmd._id, userId },
                { $set: { position: folderCmd.position } }
            );
        }

        return res.json({
            error: false,
            message: "Folder positions updated successfully",
        });
    } catch (error) {
        return res.status(500).json({ error: true, message: "Internal Server Error" });
    }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = app;

