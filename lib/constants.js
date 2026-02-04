export const APP_NAME = "Luucid";

export const BACKGROUNDS = [
  {
    id: "none",
    label: "None",
    src: null,
    loop: false,
    icon: "Slash",
  },
  {
    id: "ocean",
    label: "Ocean",
    src: "/audio/background/Ocean.wav",
    loop: true,
  },
  {
    id: "rainforest",
    label: "Rainforest",
    src: "/audio/background/Rainforest.wav",
    loop: true,
  },
  {
    id: "rainy-night",
    label: "Rainy night",
    src: "/audio/background/Rainy%20Night.wav",
    loop: true,
  },
  {
    id: "wind",
    label: "Wind",
    src: "/audio/background/Wind.wav",
    loop: true,
  },
  {
    id: "fire",
    label: "Fire",
    src: "/audio/background/Fire.wav",
    loop: true,
  },
  {
    id: "coffee-shop",
    label: "Coffee shop",
    src: "/audio/background/Coffee%20Shop.wav",
    loop: true,
  },
  {
    id: "mountaintop",
    label: "Mountaintop",
    src: "/audio/background/Mountaintop.wav",
    loop: true,
  },
  {
    id: "night",
    label: "Night",
    src: "/audio/background/Night.wav",
    loop: true,
  },
];

export const BELLS = [
  {
    id: "soft-bell",
    label: "Soft bell",
    src: "/audio/bells/Soft%20Bell.wav",
  },
  {
    id: "deep-bell",
    label: "Deep bell",
    src: "/audio/bells/Deep%20Bell.wav",
  },
  {
    id: "bright-bell",
    label: "Bright bell",
    src: "/audio/bells/Bright%20Bell.wav",
  },
];

export const DURATION_CHIPS_MINUTES = [3, 5, 10, 15, 20, 30, 45, 60];
export const CUSTOM_DURATION_MIN = 1;
export const CUSTOM_DURATION_MAX = 180;

export const INTERVAL_OPTIONS_MINUTES = [1, 2, 5, 10];

export const DEFAULTS = {
  backgroundId: "ocean",
  durationMinutes: 10,
  startBellId: "soft-bell",
  endBellId: "deep-bell",
  intervalEnabled: false,
  intervalMinutes: 5,
  backgroundVolume: 0.6,
  bellVolume: 0.8,
  fadeInSeconds: 1.5,
};

export function getBackgroundById(id, backgrounds = BACKGROUNDS) {
  const list = Array.isArray(backgrounds) && backgrounds.length ? backgrounds : BACKGROUNDS;
  return list.find((b) => b.id === id) || list[0];
}

export function getBellById(id, bells = BELLS) {
  const list = Array.isArray(bells) && bells.length ? bells : BELLS;
  return list.find((b) => b.id === id) || list[0];
}
