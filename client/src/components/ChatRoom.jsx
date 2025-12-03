import { useEffect, useRef, useState } from "react";
import { emitSendMessage, fetchRooms } from "../services/backendInt"; 
// 👆 fetchRooms should return [{ _id, name }, ...]

export default function ChatApp({ user, socket }) {
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [roomInput, setRoomInput] = useState("");
  const [chat, setChat] = useState("");
  const [typingUsers, setTypingUsers] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const msgRef = useRef(null);
  const typingTimeout = useRef(null);

  // --- Fetch rooms from DB ---
  useEffect(() => {
    const loadRooms = async () => {
      try {
        const data = await fetchRooms();
        setRooms(data);
        if (data.length > 0) setSelectedRoom(data[0]); // auto-select first room object
      } catch (err) {
        console.error("Failed to load rooms", err);
      }
    };
    loadRooms();
  }, []);

  // --- Socket setup ---
  useEffect(() => {
    if (!socket || !selectedRoom?._id || !user?._id) return;

    socket.on("connect", () => {
      socket.emit("joinRoom", { username: user.username, roomId: selectedRoom._id });
      socket.emit("messageSeen", { roomId: selectedRoom._id, userId: user._id });
    });

    return () => socket.off("connect");
  }, [socket, selectedRoom?._id, user?._id, user?.username]);

  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (msg) => setChatMessages((prev) => [...prev, msg]);
    const handleLoadMessages = (msgs) => setChatMessages(msgs);
    const handleTyping = (username) =>
      setTypingUsers((prev) => (prev.includes(username) ? prev : [...prev, username]));
    const handleStopTyping = (username) =>
      setTypingUsers((prev) => prev.filter((u) => u !== username));

    socket.on("newMessage", handleNewMessage);
    socket.on("loadMessages", handleLoadMessages);
    socket.on("typing", handleTyping);
    socket.on("stopTyping", handleStopTyping);

    return () => {
      socket.off("newMessage", handleNewMessage);
      socket.off("loadMessages", handleLoadMessages);
      socket.off("typing", handleTyping);
      socket.off("stopTyping", handleStopTyping);
    };
  }, [socket]);

  useEffect(() => {
    if (msgRef.current) msgRef.current.scrollTop = msgRef.current.scrollHeight;
  }, [chatMessages]);

  // --- Handlers ---
  const handleTyping = () => {
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    if (selectedRoom?._id && user?.username) {
      socket.emit("typing", { roomId: selectedRoom._id, username: user.username });
      typingTimeout.current = setTimeout(() => {
        socket.emit("stopTyping", { roomId: selectedRoom._id, username: user.username });
      }, 1500);
    }
  };

  const handleSend = () => {
    if (chat.trim() && selectedRoom?._id && user?._id) {
      emitSendMessage(selectedRoom._id, chat, user._id);
      setChat("");
      socket.emit("stopTyping", { roomId: selectedRoom._id, username: user.username });
    }
  };

  const formatTime = (dateString) =>
    new Date(dateString).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const formatDateLabel = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
    return date.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
  };

  const renderTypingUsers = () =>
    typingUsers.length > 0 && (
      <div className="mb-2 p-3 rounded-lg shadow-sm max-w-[90%] bg-gray-100 self-start">
        <span className="text-sm text-gray-600">
          {typingUsers.length === 1
            ? `${typingUsers[0]} is typing...`
            : typingUsers.length === 2
            ? `${typingUsers[0]} and ${typingUsers[1]} are typing...`
            : `${typingUsers.slice(0, 2).join(", ")} and others are typing...`}
        </span>
      </div>
    );

  // --- UI ---
  return (
    <div className="flex flex-col sm:flex-row min-h-screen">
      {/* Sidebar */}
      <div className="w-full sm:w-64 bg-gray-100 p-4 space-y-4 sm:sticky sm:top-0 sm:h-screen">
        <h2 className="text-lg font-semibold text-gray-700">Rooms</h2>
        <div className="space-y-2">
          {rooms.map((room) => (
            <button
              key={room._id}
              onClick={() => {
                setSelectedRoom(room);
                setChatMessages([]); // clear messages when switching
              }}
              className={`w-full text-left px-3 py-2 rounded ${
                room._id === selectedRoom?._id
                  ? "bg-blue-500 text-white font-semibold"
                  : "bg-blue-100 text-blue-800"
              }`}
            >
              {room.name}
            </button>
          ))}
        </div>
        <input
          type="text"
          value={roomInput}
          onChange={(e) => setRoomInput(e.target.value)}
          placeholder="Enter room name"
          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring focus:ring-blue-300"
        />
      </div>

      {/* Chat Room */}
      <div className="flex-1 flex flex-col px-4 py-2">
        <h2 className="text-xl sm:text-2xl mb-2 font-semibold text-gray-800 text-center">
          {selectedRoom?.name || "Select a room"}
        </h2>

        <div
          ref={msgRef}
          className="flex-1 min-h-0 overflow-y-auto border bg-gray-50 p-3 rounded-lg flex flex-col"
        >
          {chatMessages.length === 0 && (
            <p className="text-gray-500 text-sm">No messages yet</p>
          )}

          {chatMessages.map((msg, idx) => {
            const prevMsg = chatMessages[idx - 1];
            const showDateSeparator =
              !prevMsg ||
              new Date(prevMsg.createdAt).toDateString() !==
                new Date(msg.createdAt).toDateString();

            return (
              <div key={idx}>
                {showDateSeparator && (
                  <div className="text-center my-2">
                    <span className="bg-gray-300 text-gray-700 text-xs px-3 py-1 rounded-full">
                      {formatDateLabel(msg.createdAt)}
                    </span>
                  </div>
                )}
                <div
                  className={`mb-2 p-3 rounded-lg shadow-sm w-fit max-w-[90%] break-words ${
                    msg.sender._id === user?._id
                      ? "bg-blue-100 self-end"
                      : "bg-white self-start"
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <strong className="text-blue-600">{msg.sender.username}</strong>
                    {msg.createdAt && (
                      <span className="text-xs text-gray-500">
                        {formatTime(msg.createdAt)}
                      </span>
                    )}
                  </div>
                  <p>{msg.content}</p>
                </div>
              </div>
            );
          })}

          {renderTypingUsers()}
        </div>

        <div className="flex gap-2 mt-2 sticky bottom-0 bg-white py-2 px-2 z-10 w-full">
          <input
            className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring focus:border-blue-300"
            value={chat}
            onChange={(e) => setChat(e.target.value)}
            onKeyDown={handleTyping}
            placeholder="Type a message..."
          />
          <button
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
            onClick={handleSend}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}