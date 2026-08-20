export const CONTRACT_VERSION = "1.0" as const;

export const DESIGN_TOKENS = {
  color: {
    brandPrimary: "#FF323A",
    brandPrimaryHover: "#D8212D",
    canvas: "#0D0D0F",
    surface1: "#1F2123",
    surface2: "#202224",
    surface3: "#2C2D30",
    surface4: "#3A3A3C",
    textPrimary: "#FFFFFF",
    textSecondary: "rgba(245, 246, 248, 0.60)",
    textMuted: "rgba(245, 246, 248, 0.50)",
    border: "rgba(255, 255, 255, 0.08)",
    success: "#4ECB57",
    info: "#2F86FF",
    warning: "#F6C443",
    danger: "#FF323A"
  },
  font: { sans: 'Poppins, "Segoe UI", Arial, Helvetica, sans-serif', body: "14px" },
  space: { 1: "4px", 2: "8px", 3: "12px", 4: "16px", 5: "20px", 6: "24px", 7: "32px" },
  radius: { xs: "6px", sm: "8px", md: "12px", lg: "16px", mobile: "16px", pill: "100px" },
  border: { default: "1px solid rgba(255, 255, 255, 0.08)" }
} as const;
