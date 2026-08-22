import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/chargegrid-app/tests/unit/**/*.test.js"]
  }
});
