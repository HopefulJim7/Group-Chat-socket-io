const Message = require('../models/Message');
const User = require('../models/User');

module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log("Socket Connected:", socket.id);

    // ✅ Join Room
    socket.on("joinRoom", async ({ username, roomId }) => {
      try {
        const user = await User.findOneAndUpdate(
          { username },
          { socketId: socket.id, isOnline: true },
          { new: true }
        );

        socket.join(roomId);
        io.to(roomId).emit("userJoined", { user, roomId });

        // ✅ Typing Indicator
        socket.on("typing", ({ roomId, username }) => {
          socket.to(roomId).emit("typing", username);
        });

        socket.on("stopTyping", ({ roomId, username }) => {
          socket.to(roomId).emit("stopTyping", username);
        });

        // ✅ Send Message with delivered flag
        socket.on("sendMessage", async ({ roomId, content, senderId }) => {
          try {
            const message = await Message.create({
              sender: senderId,
              room: roomId,
              content,
              delivered: true, // mark as delivered
            });

            const fullMessage = await message.populate("sender", "username");
            io.to(roomId).emit("newMessage", fullMessage);
          } catch (err) {
            console.error("Error saving message:", err.message);
          }
        });

        // ✅ Mark messages as seen when user opens room
        socket.on("messageSeen", async ({ roomId, userId }) => {
          try {
            await Message.updateMany(
              { room: roomId, seenBy: { $ne: userId } },
              { $push: { seenBy: userId } }
            );
            io.to(roomId).emit("messagesSeen", { roomId, userId });
          } catch (err) {
            console.error("Error updating seen messages:", err.message);
          }
        });

        // ✅ Disconnect handling
        socket.on("disconnect", async () => {
          try {
            const offlineUser = await User.findOneAndUpdate(
              { socketId: socket.id },
              { isOnline: false }
            );
            if (offlineUser) {
              io.emit("userOffline", offlineUser.username);
            }
          } catch (err) {
            console.error("Error marking user offline:", err.message);
          }
        });
      } catch (err) {
        console.error("Error joining room:", err.message);
      }
    });
  });
};