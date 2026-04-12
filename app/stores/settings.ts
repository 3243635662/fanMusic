import { defineStore } from "pinia";

export const useSettingsStore = defineStore("setting", () => {
  const isFoldSidebar = ref(false);
  const isFoldPlayer = ref(false);
  const isHiddenPlayer = ref(false);
  const isSettingsOpen = ref(false);
  const showLoginModal = ref(false);
  const boxMode = ref(false);

  return {
    isFoldSidebar,
    isFoldPlayer,
    isHiddenPlayer,
    isSettingsOpen,
    showLoginModal,
    boxMode,
  };
});
