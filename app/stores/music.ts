import { defineStore } from "pinia";

export const useMusicStore = defineStore("music", () => {
  // 当前播放歌曲
  const currentTrack = ref<any>(null);

  // 播放状态
  const isPlaying = ref(false);

  // 搜索的歌曲
  const searchSongs = ref<any[]>([]);

  // 上次搜索的关键词
  const lastSearchKeyword = ref("");

  // 我的歌单
  const MyplayList = ref<PlayListType[]>([]);

  // 推荐歌单
  const recommendationPlayList = ref<RecommendationPlayListType[]>([]);

  function setSearchSongs(songs: any[], keyword: string) {
    searchSongs.value = songs;
    lastSearchKeyword.value = keyword;
  }

  function setPlayList(list: PlayListType[]) {
    MyplayList.value = list;
  }

  function setRecommendationPlayList(list: RecommendationPlayListType[]) {
    recommendationPlayList.value = list;
  }

  function playTrack(track: any) {
    currentTrack.value = track;
    isPlaying.value = true;
  }

  function togglePlay() {
    isPlaying.value = !isPlaying.value;
  }

  return {
    currentTrack,
    isPlaying,
    searchSongs,
    lastSearchKeyword,
    playList: MyplayList,
    recommendationPlayList,
    setSearchSongs,
    setPlayList,
    setRecommendationPlayList,
    playTrack,
    togglePlay,
  };
});
