const express = require("express");
const router = express.Router();
const Room = require("../models/room");

// Create Room
router.post("/create", async (req, res) => {
  try {
    const { roomId, title, language, type } = req.body;

    const room = await Room.create({
      roomId,
      title,
      language,
      type,
      code: "// Start coding here...",
    });

    res.status(201).json(room);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Join Room
router.post("/join", async (req, res) => {
  try {
    const { roomId } = req.body;

    const room = await Room.findOne({ roomId });

    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Room joined successfully",
      room,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Load Saved Code
router.get("/:roomId/code", async (req, res) => {
  try {
    const room = await Room.findOne({ roomId: req.params.roomId });

    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found",
      });
    }

    res.status(200).json({
      success: true,
      code: room.code,
      language: room.language,
      type: room.type,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Save Code
router.put("/:roomId/code", async (req, res) => {
  try {
    const { code, language } = req.body;

    const room = await Room.findOneAndUpdate(
      { roomId: req.params.roomId },
      { code, language },
      { new: true }
    );

    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Code saved successfully",
      room,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;