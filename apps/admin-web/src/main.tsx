import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@chargegrid/shared/styles/tokens.css";
import "./styles/app.css";
import "./styles/sems-reference.css";
import { AdminApp } from "./app/AdminApp";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AdminApp />
  </StrictMode>
);
