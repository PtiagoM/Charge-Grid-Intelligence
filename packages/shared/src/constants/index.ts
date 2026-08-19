export const CONTRACT_VERSION = "1.0" as const;

export const DESIGN_TOKENS = {
  color: {
    brandPrimary: "#FF3049",
    brandPrimaryHover: "#DF1C35",
    canvas: "#F1F2F3",
    surface: "#FFFFFF",
    textPrimary: "#08111F",
    textMuted: "#7D8696",
    border: "#E7E9ED",
    success: "#42C95A",
    info: "#2F80FF",
    warning: "#EBA900",
    danger: "#FF4D5E"
  },
  font: { sans: '"Segoe UI", Arial, Helvetica, sans-serif', body: "14px" },
  space: { 1: "4px", 2: "8px", 3: "12px", 4: "16px", 5: "20px", 6: "24px", 7: "32px" },
  radius: { xs: "6px", sm: "8px", md: "10px", lg: "12px", mobile: "22px", pill: "999px" },
  border: { default: "1px solid #E7E9ED" }
} as const;
