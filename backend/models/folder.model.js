const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const folderSchema = new Schema(
    {
        name: { type: String, required: true },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        position: {
            type: Number,
            default: 0
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model("Folder", folderSchema);
