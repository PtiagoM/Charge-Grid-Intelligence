import { Navigate, Route, Routes } from "react-router-dom";
import { AdminShell } from "../layouts/AdminShell";
import { HomePage } from "../pages/HomePage";

export function AppRouter() {
  return (
    <Routes>
      <Route element={<AdminShell />}>
        <Route index element={<HomePage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
