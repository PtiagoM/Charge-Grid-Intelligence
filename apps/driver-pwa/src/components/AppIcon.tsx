import type { SVGProps } from "react";

export type AppIconName =
  | "arrow-left"
  | "bell"
  | "camera"
  | "card"
  | "check"
  | "chevron-right"
  | "clock"
  | "filter"
  | "location"
  | "logout"
  | "map"
  | "moon"
  | "plug"
  | "qr"
  | "receipt"
  | "route"
  | "search"
  | "sun"
  | "user"
  | "vehicle"
  | "warning"
  | "wifi-off";

interface AppIconProps extends SVGProps<SVGSVGElement> {
  name: AppIconName;
  size?: number;
}

const paths: Record<AppIconName, React.ReactNode> = {
  "arrow-left": <path d="m15 18-6-6 6-6M9 12h10" />,
  bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></>,
  camera: <><path d="M14.5 4 16 7h3a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h3l1.5-3Z" /><circle cx="12" cy="13" r="4" /></>,
  card: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 10h18M7 15h4" /></>,
  check: <path d="m5 12 4 4L19 6" />,
  "chevron-right": <path d="m9 18 6-6-6-6" />,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  filter: <><path d="M4 6h16M7 12h10M10 18h4" /></>,
  location: <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
  logout: <><path d="M10 5H5v14h5M14 8l4 4-4 4M18 12H9" /></>,
  map: <><path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3Z" /><path d="M9 3v15M15 6v15" /></>,
  moon: <path d="M20.5 14.2A8.5 8.5 0 0 1 9.8 3.5 8.5 8.5 0 1 0 20.5 14.2Z" />,
  plug: <><path d="M8 12h8v3a4 4 0 0 1-8 0ZM10 12V7M14 12V7M12 19v3" /></>,
  qr: <><path d="M4 4h6v6H4ZM14 4h6v6h-6ZM4 14h6v6H4ZM15 14h2v2h-2ZM19 14h1v3M14 19h3M19 19h1" /></>,
  receipt: <><path d="M6 3h12v18l-3-2-3 2-3-2-3 2Z" /><path d="M9 8h6M9 12h6M9 16h3" /></>,
  route: <><circle cx="6" cy="18" r="2" /><circle cx="18" cy="6" r="2" /><path d="M8 18h3a3 3 0 0 0 3-3v-6a3 3 0 0 1 3-3" /></>,
  search: <><circle cx="11" cy="11" r="7" /><path d="m16 16 5 5" /></>,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.66 6.34l1.41-1.41" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
  vehicle: <><path d="m5 11 2-5h10l2 5 2 2v5h-3v-2H6v2H3v-5Z" /><circle cx="7" cy="13" r="1" /><circle cx="17" cy="13" r="1" /></>,
  warning: <><path d="M12 3 2.7 20h18.6Z" /><path d="M12 9v4M12 17h.01" /></>,
  "wifi-off": <><path d="m2 2 20 20M8.5 8.5a10 10 0 0 1 10.8 1.8M5 10a14 14 0 0 1 2.4-1.5M8.5 14.5a5 5 0 0 1 7 0M12 19h.01" /></>
};

export function AppIcon({ name, size = 24, ...props }: AppIconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      {paths[name]}
    </svg>
  );
}
