import { defineStore } from "pinia";

export const useSettingsStore = defineStore("setting", () => {
  const isFold = ref(false);
  const isSettingsOpen = ref(false);

  return {
    isFold,
    isSettingsOpen,
  };
});
