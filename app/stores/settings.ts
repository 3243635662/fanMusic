import { defineStore } from "pinia";

export const useSettingsStore = defineStore("setting", () => {
  const isFold = ref(false);

  return {
    isFold,
  };
});
