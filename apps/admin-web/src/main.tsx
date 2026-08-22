import { StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";

function ChargeGridIntelligenceApp() {
  useEffect(() => {
    void import("./chargegrid-app/src/main");
  }, []);

  return <div id="app" />;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ChargeGridIntelligenceApp />
  </StrictMode>
);
