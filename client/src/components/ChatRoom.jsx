import { useEffect, useRef, useState } from "react";
import { emitSendMessage } from "../services/backendInt";

export default function ChatRoom({ room, messages, user, socket }) {
  const [chat, setChat] = useState("");
  const [typingUsers, setTypingUsers] = useState([]);
  const [chatMessages, setChatMessages] = useState(messages || []);
  const msgRef = useRef(null);
  const typingTimeout = useRef(null);

  // ✅ Join room once socket connects
  useEffect(() => {
    if (!socket || !room?._id || !user?._id) return;

    socket.on("connect", () => {
      socket.emit("joinRoom", { username: user.username, roomId: room._id });
      socket.emit("messageSeen", { roomId: room._id, userId: user._id });
    });

    return () => {
      socket.off("connect");
    };
  }, [socket, room?._id, user?.username, user?._id]);

  // ✅ Handle incoming events
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (msg) => {
      setChatMessages((prev) => [...prev, msg]);
    };

    const handleLoadMessages = (msgs) => {
      setChatMessages(msgs);
    };

    const handleTyping = (username) => {
      setTypingUsers((prev) =>
        prev.includes(username) ? prev : [...prev, username]
      );
    };

    const handleStopTyping = (username) => {
      setTypingUsers((prev) => prev.filter((u) => u !== username));
    };

    const handleMessagesSeen = () => {
      // optional: update UI state if needed
    };

    socket.on("newMessage", handleNewMessage);
    socket.on("loadMessages", handleLoadMessages);
    socket.on("typing", handleTyping);
    socket.on("stopTyping", handleStopTyping);
    socket.on("messagesSeen", handleMessagesSeen);

    return () => {
      socket.off("newMessage", handleNewMessage);
      socket.off("loadMessages", handleLoadMessages);
      socket.off("typing", handleTyping);
      socket.off("stopTyping", handleStopTyping);
      socket.off("messagesSeen", handleMessagesSeen);
    };
  }, [socket]);

  // ✅ Auto-scroll to bottom
  useEffect(() => {
    if (msgRef.current) {
      msgRef.current.scrollTop = msgRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // ✅ Typing indicator
  const handleTyping = () => {
    if (typingTimeout.current) clearTimeout(typingTimeout.current);

    if (room?._id && user?.username) {
      socket.emit("typing", { roomId: room._id, username: user.username });

      typingTimeout.current = setTimeout(() => {
        socket.emit("stopTyping", { roomId: room._id, username: user.username });
      }, 1500);
    }
  };

  // ✅ Send message
  const handleSend = () => {
    if (chat.trim() && room?._id && user?._id) {
      emitSendMessage(room._id, chat, user._id);
      setChat("");
      socket.emit("stopTyping", { roomId: room._id, username: user.username });
    }
  };

  // ✅ Format helpers
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatDateLabel = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
    return date.toLocaleDateString([], {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // ✅ Render typing users as a subtle message card
  const renderTypingUsers = () => {
    if (typingUsers.length === 0) return null;

    let text = "";
    if (typingUsers.length === 1) text = `${typingUsers[0]} is typing...`;
    else if (typingUsers.length === 2)
      text = `${typingUsers[0]} and ${typingUsers[1]} are typing...`;
    else text = `${typingUsers.slice(0, 2).join(", ")} and others are typing...`;

    return (
      <div className="mb-2 p-3 rounded-lg shadow-sm max-w-md bg-gray-100 self-start transition-opacity duration-300">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">{text}</span>
          <span className="flex gap-1">
            <span className="w-2 h-2 bg-gray-600 rounded-full animate-bounce"></span>
            <span className="w-2 h-2 bg-gray-600 rounded-full animate-bounce [animation-delay:0.2s]"></span>
            <span className="w-2 h-2 bg-gray-600 rounded-full animate-bounce [animation-delay:0.4s]"></span>
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      <h2 className="text-2xl mb-2 font-semibold text-gray-800">{room?.name}</h2>

      <div
        className="flex-1 overflow-y-auto border bg-gray-50 p-3 rounded-lg flex flex-col"
        ref={msgRef}
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
                className={`mb-2 p-3 rounded-lg shadow-sm max-w-md ${
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

                {msg.sender._id === user?._id && (
                  <div className="text-right text-xs mt-1">
                    {msg.seenBy?.length > 0 ? (
                      <span className="text-blue-500">✔✔ Seen</span>
                    ) : msg.delivered ? (
                      <span className="text-gray-500">✔ Delivered</span>
                    ) : (
                      <span className="text-gray-400">… Sending</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {renderTypingUsers()}
      </div>

      <div className="flex gap-2 mt-2">
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
  );
}