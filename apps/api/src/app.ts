import cors from "cors";
import express from "express";
import { createPaymentRouter, stripeWebhook } from "./payments/routes.js";

export function createApp() {
  const app = express();

  app.disable("x-powered-by");
  const allowedOrigins = (process.env.CHARGEGRID_ALLOWED_ORIGINS ?? "http://localhost:5174,http://127.0.0.1:5174").split(",").map((origin) => origin.trim());
  app.use(cors({ origin: (origin, callback) => callback(null, !origin || allowedOrigins.includes(origin)), methods: ["GET", "POST", "OPTIONS"], allowedHeaders: ["Content-Type", "Idempotency-Key", "Stripe-Signature"] }));
  app.post("/payments/webhook", express.raw({ type: "application/json" }), stripeWebhook);
  app.use(express.json());

  app.get("/health", (_request, response) => {
    response.status(200).json({ status: "ok", service: "chargegrid-api" });
  });

  app.use("/payments", createPaymentRouter());

  return app;
}
