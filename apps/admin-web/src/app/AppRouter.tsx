import { Navigate, Route, Routes } from "react-router-dom";
import { AdminShell } from "../layouts/AdminShell";
import { HomePage } from "../pages/HomePage";
import { NetworkMapPage } from "../pages/NetworkMapPage";
import { OperationalPage } from "../pages/OperationalPage";
import { LoginPage } from "../pages/LoginPage";
import { EstablishmentsPage } from "../pages/EstablishmentsPage";

export function AppRouter() {
  return (
    <Routes>
      <Route path="login" element={<LoginPage />} />
      <Route element={<AdminShell />}>
        <Route index element={<HomePage />} />
        <Route path="establishments" element={<EstablishmentsPage />} />
        <Route path="plants" element={<NetworkMapPage />} />
        <Route path="chargers" element={<OperationalPage section="chargers" />} />
        <Route path="sessions" element={<OperationalPage section="sessions" />} />
        <Route path="energy" element={<OperationalPage section="energy" />} />
        <Route path="financial" element={<OperationalPage section="financial" />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
