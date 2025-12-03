import { useEffect, useState } from "react";
import {
  getRooms,
  getMessages,
  socket,
  emitMessageSeen,
  createRoom,
} from "../services/backendInt";
import ChatRoom from "../components/ChatRoom";
import toast from "react-hot-toast";

export default function Home({ user }) {
  const [rooms, setRooms] = useState([]);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // ✅ Connect socket once on mount
  useEffect(() => {
    fetchRooms();
    socket.connect();

    socket.on("connect_error", (err) => {
      console.error("Socket connection error:", err.message);
      toast.error("Unable to connect to chat server");
    });

    socket.on("messagesSeen", ({ roomId, userId }) => {
      if (currentRoom && currentRoom._id === roomId) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.seenBy?.includes(userId)
              ? msg
              : { ...msg, seenBy: [...(msg.seenBy || []), userId] }
          )
        );
      }
    });

    return () => {
      socket.disconnect();
      socket.off("connect_error");
      socket.off("messagesSeen");
    };
  }, [currentRoom]);

  const fetchRooms = async () => {
    try {
      const res = await getRooms();
      setRooms(res.data);
    } catch (err) {
      console.error("Failed to fetch rooms", err.message);
      toast.error("Failed to load rooms");
    }
  };

  const handleJoinRoom = async (room) => {
    try {
      setLoading(true);
      socket.emit("joinRoom", { username: user.username, roomId: room._id });
      setCurrentRoom(room);

      const res = await getMessages(room._id);
      setMessages(res.data);

      emitMessageSeen(room._id, user._id);
    } catch (err) {
      console.error("Failed to join room or fetch messages", err.message);
      toast.error("Could not join room or load messages");
    } finally {
      setLoading(false);
      setSidebarOpen(false); // close sidebar on mobile after joining
    }
  };

  const handleCreateRoom = async () => {
    if (!newRoomName.trim()) return;
    try {
      const res = await createRoom(newRoomName);
      setRooms((prev) => [...prev, res.data]);
      setNewRoomName("");
      toast.success(`Room "${res.data.name}" created successfully!`);
    } catch (err) {
      console.error("Failed to create room", err.message);
      toast.error("Could not create room");
    }
  };

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 transform ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } transition-transform duration-300 ease-in-out bg-gray-800 text-white w-64 p-4 z-50 md:relative md:translate-x-0 md:w-1/4`}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg">Rooms</h2>
          <button
            className="md:hidden text-gray-300 hover:text-white"
            onClick={() => setSidebarOpen(false)}
          >
            ✕
          </button>
        </div>

        <div className="mb-4 flex gap-2">
          <input
            type="text"
            value={newRoomName}
            onChange={(e) => setNewRoomName(e.target.value)}
            placeholder="Enter room name..."
            className="flex-1 p-2 rounded bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <button
            onClick={handleCreateRoom}
            className="bg-blue-500 px-3 py-2 rounded hover:bg-blue-600 text-white font-semibold"
          >
            +
          </button>
        </div>

        <ul>
          {rooms.map((room) => (
            <li key={room._id} className="mb-2">
              <button
                onClick={() => handleJoinRoom(room)}
                className={`w-full p-2 rounded ${
                  currentRoom?._id === room._id
                    ? "bg-blue-600"
                    : "bg-gray-700 hover:bg-gray-600"
                }`}
              >
                {room.name}
              </button>
            </li>
          ))}
        </ul>
      </aside>

      {/* Main chat area */}
      <main className="flex-1 p-4">
        {/* Mobile toggle button */}
        <button
          className="md:hidden mb-2 px-3 py-2 bg-blue-500 text-white rounded-lg"
          onClick={() => setSidebarOpen(true)}
        >
          ☰ Rooms
        </button>

        {loading && <p className="text-gray-500">Loading messages...</p>}
        {currentRoom ? (
          <ChatRoom
            room={currentRoom}
            messages={messages}
            user={user}
            socket={socket}
          />
        ) : (
          <p className="text-blue-500">Select a room to join or create one</p>
        )}
      </main>
    </div>
  );
}