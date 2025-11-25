const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema ({ 
    name: { type: String, require: true, unique: true },
}, {timestamps: true});

module.exports = mongoose.model("Room", roomSchema);