export interface MenuItem {
  label: string;
  icon: string;
  to: string;
}

export const useMenu = () => {
  const libraryLinks: MenuItem[] = [
    { label: "推荐", icon: "i-lucide-sparkles", to: "/recommendation" },
    { label: "热门", icon: "i-lucide-sparkles", to: "/hot" },
    { label: "歌手", icon: "i-lucide-mic", to: "/artists" },
    { label: "历史", icon: "i-lucide-history", to: "/history" },
    { label: "我的", icon: "i-lucide-user", to: "/mine" },
  ];

  const pageMap = computed(() => {
    const map: Record<string, { label: string; icon: string }> = {};
    libraryLinks.forEach((item) => {
      map[item.to] = { label: item.label, icon: item.icon };
    });
    return map;
  });

  return {
    libraryLinks,
    pageMap,
  };
};
