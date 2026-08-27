const base = "/assets/sems";

export const assets = {
  logo: `${base}/logos/goodwe_logo.9e3214c8.png`,
  logoCollapsed: `${base}/logos/goodwe_logo_w.e0d65374.png`,
  avatar: `${base}/avatars/personal_installer.d222d640.png`,
  assistant: `${base}/icons/ai_icon_no_eye.9dad5490.png`,
  charger: `${base}/devices/charger-device-off.png`,
  chargerChargingLight: `${base}/devices/charger-charging-light.png`,
  chargerStatusIdle: `${base}/devices/charger-status-idle.png`,
  chargerNoConnectedCar: `${base}/devices/charger-no-connected-car.png`,
  chargerDeviceInformation: `${base}/devices/charger-device-information.png`,
  plant: `${base}/plants/136287ad-ae2c-4034-bb53-015701b5fe9d.jpg`,
  dashboard: {
    power: `${base}/dashboard/SEMS-ASSET-DASHBOARD-POWER-DARK_40x34.png`,
    alarm: `${base}/dashboard/SEMS-ASSET-DASHBOARD-ALARM-DARK_36x34.png`,
    curve: `${base}/dashboard/SEMS-ASSET-DASHBOARD-CURVE-LINE-DARK_40x36.png`,
    monitor: `${base}/dashboard/SEMS-ASSET-DASHBOARD-ENERGY-MONITOR-DARK_32x32.png`,
    co2: `${base}/dashboard/SEMS-ASSET-DASHBOARD-CO2_52x38.png`,
    tree: `${base}/dashboard/SEMS-ASSET-DASHBOARD-GREEN-TREE_50x46.png`,
    chargingEnergy: `${base}/dashboard/SEMS-ASSET-DASHBOARD-CHARGING-ENERGY_54x52.png`,
    dischargedEnergy: `${base}/dashboard/SEMS-ASSET-DASHBOARD-DISCHARGED-ENERGY_54x54.png`,
    generatedEnergy: `${base}/dashboard/SEMS-ASSET-DASHBOARD-GENERATED-ENERGY_52x52.png`,
    generationIncome: `${base}/dashboard/SEMS-ASSET-DASHBOARD-GENERATION-INCOME_52x52.png`,
    gridFeedIn: `${base}/dashboard/SEMS-ASSET-DASHBOARD-GRID-FEED-IN_54x54.png`,
    gridIncome: `${base}/dashboard/SEMS-ASSET-DASHBOARD-GRID-INCOME_54x54.png`
  },
  icons: {
    dashboard: `${base}/icons/icon_backstage_over.6f515874.png`,
    solarInfo: `${base}/icons/entrance_light.8edf1291.png`,
    plants: `${base}/icons/icon_station_over.fd7f2df2.png`,
    devices: `${base}/icons/icon_device.ad71c9b2.png`,
    alarms: `${base}/icons/icon_alarm.90066d1f.png`,
    reports: `${base}/icons/icon_reports.3ff95c2c.png`,
    analysis: `${base}/icons/icon_analysis.fd7d7adf.png`,
    services: `${base}/icons/icon_services.f837f7f1.png`,
    search: `${base}/icons/icon_search.34450bf1.png`,
    language: `${base}/icons/icon_language.1c16961c.png`,
    message: `${base}/icons/icon_message.113c036c.png`,
    setting: `${base}/icons/icon_setting.6ecae33c.png`
  }
} as const;
