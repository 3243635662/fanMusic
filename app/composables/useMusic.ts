import type { GetTrendingTracksTimeEnum } from "@audius/sdk";

export const useMusic = () => {
  const { $audius } = useNuxtApp();

  // *搜索歌曲
  const searchSongs = async (query: string) => {
    const result = await $audius.tracks.searchTracks({ query });
    return result.data; // 返回歌曲数组
  };

  // *获取热门歌曲
  const getHotSongs = async (
    offset: number,
    limit: number,
    time: GetTrendingTracksTimeEnum,
  ) => {
    const result = await $audius.tracks.getTrendingTracks({
      limit,
      offset,
      time,
    });
    return result.data;
  };
  return { searchSongs, getHotSongs };
};
