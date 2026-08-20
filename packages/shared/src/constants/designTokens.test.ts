import { describe, expect, it } from "vitest";
import { DESIGN_TOKENS } from "./index.js";

describe("Design System SEMS+/GoodWe v2", () => {
  it("preserva a identidade visual canônica compartilhada", () => {
    expect(DESIGN_TOKENS.color).toMatchObject({
      brandPrimary: "#FF323A",
      canvas: "#0D0D0F",
      surface1: "#1F2123",
      surface4: "#3A3A3C",
      textPrimary: "#FFFFFF"
    });
  });
});
