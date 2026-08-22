import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { MobileShell } from "../layouts/MobileShell";
import { ExplorePage } from "../pages/ExplorePage";
import { AccountPage } from "../pages/AccountPage";
import { EstablishmentPage } from "../pages/EstablishmentPage";
import { HistoryPage } from "../pages/HistoryPage";
import { HomePage } from "../pages/HomePage";
import { LoginPage } from "../pages/LoginPage";
import { MapPage } from "../pages/MapPage";
import { NotificationsPage } from "../pages/NotificationsPage";
import { QrLandingPage } from "../pages/QrLandingPage";
import { QrScannerPage } from "../pages/QrScannerPage";
import { QueuePage } from "../pages/QueuePage";
import { ReceiptPage } from "../pages/ReceiptPage";
import { SessionPage } from "../pages/SessionPage";
import { SignupPage } from "../pages/SignupPage";

const CheckoutPage = lazy(() => import("../pages/CheckoutPage").then((module) => ({ default: module.CheckoutPage })));

export function AppRouter() {
  return (
    <Routes>
      <Route element={<MobileShell />}>
        <Route index element={<HomePage />} />
        <Route path="explore" element={<ExplorePage />} />
        <Route path="map" element={<MapPage />} />
        <Route path="place/:establishmentId" element={<EstablishmentPage />} />
        <Route path="qr/:chargerSlug" element={<QrLandingPage />} />
        <Route path="scan" element={<QrScannerPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="signup" element={<SignupPage />} />
        <Route path="queue" element={<QueuePage />} />
        <Route path="checkout" element={<Suspense fallback={<div className="route-loading"><span className="spinner" /><strong>Preparando pagamento…</strong></div>}><CheckoutPage /></Suspense>} />
        <Route path="session" element={<SessionPage />} />
        <Route path="receipt/:receiptId" element={<ReceiptPage />} />
        <Route path="history" element={<HistoryPage />} />
        <Route path="account" element={<AccountPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
