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
    id: "coffee",
    label: "Coffee",
    src: "/audio/background/Coffee.wav",
    loop: true,
    icon: "Coffee",
  },
  {
    id: "fire",
    label: "Fire",
    src: "/audio/background/Fire.wav",
    loop: true,
    icon: "Flame",
  },
  {
    id: "night",
    label: "Night",
    src: "/audio/background/Night.wav",
    loop: true,
    icon: "Moon",
  },
  {
    id: "ocean",
    label: "Ocean",
    src: "/audio/background/Ocean.wav",
    loop: true,
    icon: "Waves",
  },
  {
    id: "rainforest",
    label: "Rainforest",
    src: "/audio/background/Rainforest.wav",
    loop: true,
    icon: "Leaf",
  },
  {
    id: "rainy",
    label: "Rainy",
    src: "/audio/background/Rainy.wav",
    loop: true,
    icon: "CloudRain",
  },
  {
    id: "relax",
    label: "Relax",
    src: "/audio/background/Relax.wav",
    loop: true,
    icon: "Moon",
  },
  {
    id: "smooth",
    label: "Smooth",
    src: "/audio/background/Smooth.wav",
    loop: true,
    icon: "Sparkles",
  },
  {
    id: "wind",
    label: "Wind",
    src: "/audio/background/Wind.wav",
    loop: true,
    icon: "Wind",
  },
];

export const BELLS = [
  {
    id: "bright",
    label: "Bright",
    src: "/audio/bells/Bright.wav",
    icon: "Bell",
  },
  {
    id: "deep",
    label: "Deep",
    src: "/audio/bells/Deep.wav",
    icon: "Bell",
  },
  {
    id: "high",
    label: "High",
    src: "/audio/bells/High.wav",
    icon: "Bell",
  },
  {
    id: "mid",
    label: "Mid",
    src: "/audio/bells/Mid.wav",
    icon: "Bell",
  },
  {
    id: "soft",
    label: "Soft",
    src: "/audio/bells/Soft.wav",
    icon: "Bell",
  },
];

export const DURATION_CHIPS_MINUTES = [3, 5, 10, 15, 20, 30, 45, 60];
export const CUSTOM_DURATION_MIN = 1;
export const CUSTOM_DURATION_MAX = 180;

export const INTERVAL_OPTIONS_MINUTES = [1, 2, 5, 10];

export const DEFAULTS = {
  backgroundId: "ocean",
  durationMinutes: 10,
  startBellId: "soft",
  endBellId: "deep",
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
