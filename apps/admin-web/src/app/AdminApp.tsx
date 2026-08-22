import { useLayoutEffect } from "react";
import { HashRouter, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { LoginPage } from "../features/auth/LoginPage";
import { AdminDashboardPage } from "../features/dashboard/AdminDashboardPage";
import { AdminSimulatorPage } from "../features/simulator/AdminSimulatorPage";
import { ManagerShell } from "../layouts/ManagerShell";
import { AdminProvider, useAdminState } from "./AdminState";

function ManagerRoute() {
  return <ManagerShell><AdminDashboardPage /></ManagerShell>;
}

function AdminRoute() {
  return <ManagerShell><AdminSimulatorPage /></ManagerShell>;
}

function LogoutPage() {
  const { logout } = useAdminState();
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
    <Route path="/" element={<Navigate to="/login" replace />} />
    <Route path="*" element={<Navigate to="/login" replace />} />
  </Routes>;
}

export function AdminApp() {
  return <AdminProvider><HashRouter><AppRoutes /></HashRouter></AdminProvider>;
}
