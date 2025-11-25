import { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Home from "./pages/Home";

export default function App() {
  const [user, setUser] = useState(null);

  return (
    <BrowserRouter>
      <Routes>
        {/* Root route: show Home if logged in, otherwise Login */}
        <Route
          path="/"
          element={
            user ? <Home user={user} /> : <Login setUser={setUser} />
          }
        />
        {/* Optional: add a fallback route */}
        <Route
          path="*"
          element={<Login setUser={setUser} />}
        />
      </Routes>
    </BrowserRouter>
  );
}