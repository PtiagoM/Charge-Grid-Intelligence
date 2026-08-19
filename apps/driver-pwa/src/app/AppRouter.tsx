import { Navigate, Route, Routes } from "react-router-dom";
import { MobileShell } from "../layouts/MobileShell";
import { ExplorePage } from "../pages/ExplorePage";

export function AppRouter() {
  return (
    <Routes>
      <Route element={<MobileShell />}>
        <Route index element={<ExplorePage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
