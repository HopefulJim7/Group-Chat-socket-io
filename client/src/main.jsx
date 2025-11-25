import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";

// ✅ Toast setup
import { Toaster } from "react-hot-toast";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: "#3B82F6", // Tailwind blue-500
            color: "#ffffff",
            fontWeight: "500",
            borderRadius: "0.5rem",
          },
        }}
      />
    </>
  </StrictMode>
);