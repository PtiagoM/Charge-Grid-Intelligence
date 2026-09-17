import cors from "cors";
import express from "express";
import { createPaymentRouter, stripeWebhook } from "./payments/routes.js";
import { createDemoRouter } from "./demo/routes.js";

export function createApp() {
  const app = express();

  app.disable("x-powered-by");
  const allowedOrigins = (process.env.CHARGEGRID_ALLOWED_ORIGINS ?? "http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174").split(",").map((origin) => origin.trim());
  const isDevelopmentLanOrigin = (origin: string) => process.env.NODE_ENV !== "production" && process.env.CHARGEGRID_DEMO_ENABLED !== "true" && /^http:\/\/(?:192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(?:1[6-9]|2\d|3[0-1])\.\d+\.\d+)(?::\d+)?$/.test(origin);
  app.use(cors({ origin: (origin, callback) => callback(null, !origin || allowedOrigins.includes(origin) || isDevelopmentLanOrigin(origin)), methods: ["GET", "POST", "OPTIONS"], allowedHeaders: ["Content-Type", "Idempotency-Key", "Stripe-Signature"] }));
  app.post("/payments/webhook", express.raw({ type: "application/json" }), stripeWebhook);
  app.use(express.json());

  app.get("/health", (_request, response) => {
    response.status(200).json({ status: "ok", service: "chargegrid-api" });
  });

  app.use("/payments", createPaymentRouter());
  if (process.env.CHARGEGRID_DEMO_ENABLED === "true" && process.env.NODE_ENV !== "production") app.use("/demo", createDemoRouter());
  app.use((error: unknown, request: express.Request, response: express.Response, next: express.NextFunction) => {
    if (error instanceof SyntaxError && "body" in error) {
      const detail = { code: "INVALID_JSON", message: "Envie um objeto JSON válido." };
      return response.status(400).json(request.path.startsWith("/demo/") ? { error: detail } : detail);
    }
    return next(error);
  });

  return app;
}

export default createApp();
