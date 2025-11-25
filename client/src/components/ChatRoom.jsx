import { useEffect, useRef, useState } from "react";
import { emitSendMessage } from "../services/backendInt";

export default function ChatRoom({ room, messages, user, socket }) {
  const [chat, setChat] = useState("");
  const [typingUser, setTypingUser] = useState("");
  const [chatMessages, setChatMessages] = useState(messages || []);
  const msgRef = useRef(null);

  useEffect(() => {
    setChatMessages(messages || []);
  }, [messages]);

  useEffect(() => {
    socket.on("newMessage", (msg) => {
      console.log("Received newMessage:", msg);
      setChatMessages((prev) => [...prev, msg]);
    });

    socket.on("typing", (username) => {
      setTypingUser(username);
    });

    socket.on("stopTyping", () => {
      setTypingUser("");
    });

    return () => {
      socket.off("newMessage");
      socket.off("typing");
      socket.off("stopTyping");
    };
  }, [socket]);

  useEffect(() => {
    if (msgRef.current) {
      msgRef.current.scrollTop = msgRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const handleTyping = () => {
    socket.emit("typing", user.username); // ✅ send username, not chat text
    setTimeout(() => socket.emit("stopTyping", user.username), 1000);
  };

  const handleSend = () => {
    if (chat.trim()) {
      console.log("Sending message:", { roomId: room._id, content: chat, senderId: user._id });
      emitSendMessage(room._id, chat, user._id); // ✅ aligned with backend
      setChat("");
    }
  };

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
    return date.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
  };

  return (
    <div className="flex flex-col h-full">
      <h2 className="text-2xl mb-2 font-semibold text-gray-800">{room.name}</h2>

      <div
        className="flex-1 overflow-y-auto border bg-gray-50 p-3 rounded-lg"
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
                  msg.sender._id === user._id
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

                {msg.sender._id === user._id && (
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
      </div>

      <div className="mb-2 text-sm text-gray-600">
        {typingUser && `${typingUser} is typing...`}
      </div>

      <div className="flex gap-2">
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