import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { registerUser } from "../services/backendInt";
import toast from "react-hot-toast";

export default function Login({ setUser }) {
  const [username, setUsername] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!username.trim()) {
      return toast.error("Username is required", {
        style: {
          background: "#3B82F6", // blue background
          color: "#fff",
        },
        iconTheme: {
          primary: "#3B82F6", // ✅ blue tick
          secondary: "#fff",
        },
      });
    }

    const loadingToast = toast.loading("Logging in...", {
      style: {
        background: "#3B82F6",
        color: "#fff",
      },
    });

    try {
      const res = await registerUser(username);
      setUser(res.data);

      toast.success("Welcome!", {
        id: loadingToast,
        style: {
          background: "#3B82F6",
          color: "#fff",
        },
        iconTheme: {
          primary: "#3B82F6",
          secondary: "#fff",
        },
      });

      navigate("/");
    } catch (error) {
      const message =
        error?.response?.data?.error || error?.message || "Login failed";

      toast.error(message, {
        id: loadingToast,
        style: {
          background: "#3B82F6",
          color: "#fff",
        },
        iconTheme: {
          primary: "#3B82F6",
          secondary: "#fff",
        },
      });
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-gray-100">
      <div className="p-6 bg-white rounded-lg shadow-md w-full max-w-sm">
        <h1 className="text-xl font-bold mb-4 text-center">Join Chat</h1>
        <input
          className="w-full p-2 border rounded mb-4 focus:outline-none focus:ring focus:border-blue-300"
          placeholder="Enter your username..."
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <button
          onClick={handleLogin}
          className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 transition-colors font-semibold"
        >
          Enter
        </button>
      </div>
    </div>
  );
}