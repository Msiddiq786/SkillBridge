const mongoose = require("mongoose");

const achievementSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
        required: true
    },
    achievementId: {
        type: String,
        required: true
    },
    type: {
        type: String,
        default: "JOURNEY"
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    icon: {
        type: String,
        default: "🏆"
    },
    unlockedAt: {
        type: Date,
        default: Date.now
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed
    }
}, { timestamps: true });

achievementSchema.index({ user: 1, achievementId: 1 }, { unique: true });

const Achievement = mongoose.model("Achievement", achievementSchema);

module.exports = Achievement;
