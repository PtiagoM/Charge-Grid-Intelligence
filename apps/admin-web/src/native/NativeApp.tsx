import { useLayoutEffect } from "react";
import { HashRouter, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { AdminPage } from "./AdminPage";
import { AppProvider, useAppState } from "./AppState";
import { DriverPage, QuickChargerPage, QuickPaymentPage, QuickTrackingPage } from "./DriverPages";
import { LoginPage } from "./LoginPage";
import { ManagerShell } from "./ManagerShell";
import { MvpPage } from "./MvpPage";

function ManagerRoute() {
  return <ManagerShell><MvpPage /></ManagerShell>;
}

function AdminRoute() {
  return <ManagerShell><AdminPage /></ManagerShell>;
}

function LogoutPage() {
  const { logout } = useAppState();
  const navigate = useNavigate();
  useLayoutEffect(() => { logout(); navigate("/login", { replace: true }); }, [logout, navigate]);
  return null;
}

function AppRoutes() {
  return <Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route path="/logout" element={<LogoutPage />} />
    <Route path="/mvp/:tab" element={<ManagerRoute />} />
    <Route path="/admin" element={<AdminRoute />} />
    <Route path="/drive/:tab" element={<DriverPage />} />
    <Route path="/quick/charger/:chargerId" element={<QuickChargerPage />} />
    <Route path="/quick/payment/:chargerId" element={<QuickPaymentPage />} />
    <Route path="/quick/session/:sessionId" element={<QuickTrackingPage />} />
    <Route path="/" element={<Navigate to="/login" replace />} />
    <Route path="*" element={<Navigate to="/login" replace />} />
  </Routes>;
}

export function NativeApp() {
  return <AppProvider><HashRouter><AppRoutes /></HashRouter></AppProvider>;
}
