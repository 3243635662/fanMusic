export interface MenuItem {
  label: string;
  icon: string;
  to: string;
}

export const useMenu = () => {
  const libraryLinks: MenuItem[] = [
    { label: "推荐", icon: useIcon("recommend"), to: "/recommendation" },
    { label: "搜索", icon: useIcon("search"), to: "/search" },
    { label: "歌手", icon: useIcon("mic"), to: "/artists" },
    { label: "历史", icon: useIcon("history"), to: "/history" },
    { label: "我的", icon: useIcon("user"), to: "/mine" },
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
