const mongoose = require("mongoose");

const progressSchema = new mongoose.Schema({

    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
        required: true,
        unique: true
    },

    progress: {
        type: Number,
        default: 0
    },

    status: {
        type: String,
        default: "IDLE"
    }

}, {
    timestamps: true
});

module.exports = mongoose.model(
    "Progress",
    progressSchema
);