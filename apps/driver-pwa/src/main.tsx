import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "@chargegrid/shared/styles/tokens.css";
import "./styles/app.css";
import { AppRouter } from "./app/AppRouter";
import { DriverAppProvider } from "./app/DriverAppContext";

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    void navigator.serviceWorker.register("/sw.js");
  });
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <DriverAppProvider>
        <AppRouter />
      </DriverAppProvider>
    </BrowserRouter>
  </StrictMode>
);
