export const useMusic = () => {
  // *搜索歌曲 (待接入)
  const searchSongs = async (query: string) => {
    return [];
  };

  // *获取热门歌曲 (待接入)
  const getHotSongs = async (
    offset: number,
    limit: number,
    time: string,
  ) => {
    // 数据源已移除，等待接入新接口
    return [];
  };

  return { searchSongs, getHotSongs };
};


