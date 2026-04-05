import { defineStore } from "pinia";

export const useSettingsStore = defineStore("setting", () => {
  const isFoldSidebar = ref(false);
  const isFoldPlayer = ref(false);
  const isHiddenPlayer = ref(false);
  const isSettingsOpen = ref(false);

  return {
    isFoldSidebar,
    isFoldPlayer,
    isHiddenPlayer,
    isSettingsOpen,
  };
});
