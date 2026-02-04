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
    id: "rain",
    label: "Rain",
    src: "/audio/background/rain.mp3",
    loop: true,
  },
  {
    id: "ocean",
    label: "Ocean",
    src: "/audio/background/ocean.mp3",
    loop: true,
  },
  {
    id: "white-noise",
    label: "White noise",
    src: "/audio/background/white-noise.mp3",
    loop: true,
  },
];

export const BELLS = [
  {
    id: "bell-soft",
    label: "Soft bell",
    src: "/audio/bells/bell-soft.mp3",
  },
  {
    id: "bell-deep",
    label: "Deep bell",
    src: "/audio/bells/bell-deep.mp3",
  },
  {
    id: "bell-bright",
    label: "Bright bell",
    src: "/audio/bells/bell-bright.mp3",
  },
];

export const DURATION_CHIPS_MINUTES = [3, 5, 10, 15, 20, 30, 45, 60];
export const CUSTOM_DURATION_MIN = 1;
export const CUSTOM_DURATION_MAX = 180;

export const INTERVAL_OPTIONS_MINUTES = [1, 2, 5, 10];

export const DEFAULTS = {
  backgroundId: "rain",
  durationMinutes: 10,
  startBellId: "bell-soft",
  endBellId: "bell-deep",
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
