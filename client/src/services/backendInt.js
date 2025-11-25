// backend integration - backendInt.js

import axios from "axios";
import { io } from "socket.io-client";

const BackendBaseUrl = "http://localhost:5000";
const APIBaseUrl = `${BackendBaseUrl}/api`;

const API = axios.create({
  baseURL: APIBaseUrl,
});

// ✅ Auth
export const registerUser = (username) =>
  API.post("/auth/register", { username });

// ✅ Rooms
export const getRooms = () => API.get("/rooms");
export const createRoom = (name) => API.post("/rooms", { name });

// ✅ Messages
export const getMessages = (roomId) => API.get(`/messages/${roomId}`);

// ✅ Socket connection
export const socket = io(BackendBaseUrl, {
  autoConnect: false, // connect manually in Home.jsx
  transports: ["websocket"], // force websocket for reliability
});

// ✅ Helper socket actions for seen/delivered
export const emitMessageSeen = (roomId, userId) => {
  if (socket.connected) {
    socket.emit("messageSeen", { roomId, userId });
  } else {
    console.warn("Socket not connected: messageSeen not sent");
  }
};

export const emitSendMessage = (roomId, content, senderId) => {
  if (socket.connected) {
    socket.emit("sendMessage", { roomId, content, senderId });
  } else {
    console.warn("Socket not connected: sendMessage not sent");
  }
};
