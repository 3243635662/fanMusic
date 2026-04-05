const iconMap = {
  success: "lucide:circle-check",
  error: "lucide:circle-x",
  music: "lucide:music",
  play: "lucide:play",
  foldUp: "lucide:list-indent-decrease",
  foldDown: "lucide:list-indent-increase",
  musicList: "lucide:list-music",
  recommend: "lucide:sparkles",
  search: "lucide:search",
  mic: "lucide:mic",
  history: "lucide:history",
  user: "lucide:user",
  refresh: "lucide:rotate-cw",
  PlayerSkipBack: "lucide:skip-back",
  PlayerSkipForward: "lucide:skip-forward",
  PlayerVolume: "lucide:volume-2",
  PlayerPause: "lucide:pause",
  PlayerPlay: "lucide:play",
  library: "lucide:library",
  heart: "lucide:heart",
  close: "lucide:x",
  check: "lucide:check",
  add: "lucide:plus",
  download: "lucide:download",
  empty: "lucide:inbox",
};

export const useIcon = (name: keyof typeof iconMap) => {
  return iconMap[name];
};
