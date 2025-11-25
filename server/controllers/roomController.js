const Room = require("../models/Room");

// Get all rooms
exports.getRooms = async (req, res) => {
  try {
    const rooms = await Room.find();
    res.json(rooms);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create a new room
exports.createRoom = async (req, res) => {
  const { name } = req.body;

  if (!name || name.trim() === "") {
    return res.status(400).json({ error: "Room name is required" });
  }

  try {
    // Prevent duplicate room names
    const existing = await Room.findOne({ name });
    if (existing) {
      return res.status(400).json({ error: "Room already exists" });
    }

    const room = await Room.create({ name });
    res.status(201).json(room); // 201 = Created
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};