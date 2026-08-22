import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@chargegrid/shared/styles/tokens.css";
import "./styles/app.css";
import { NativeApp } from "./native/NativeApp";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <NativeApp />
  </StrictMode>
);
