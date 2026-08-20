import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "@chargegrid/shared/styles/tokens.css";
import "./styles/app.css";
import { AppRouter } from "./app/AppRouter";
import { AuthProvider } from "./auth/AuthContext";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider><AppRouter /></AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
