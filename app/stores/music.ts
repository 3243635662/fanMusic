import { defineStore } from "pinia";
import { ref } from "vue";
import { useMusic } from "~/composables/useMusic";
import type { GetTrendingTracksTimeEnum } from "@audius/sdk";

export const useMyMusicStore = defineStore(
  "music",
  () => {
    const hotSongs = ref<any[]>([]);
    const hotSongsUpdateTime = ref(0);

    async function fetchHotSongs() {
      const now = Date.now();
      const twoHours = 2 * 60 * 60 * 1000;

      // 如果数据存在且没有过期，不执行请求
      if (
        hotSongs.value.length > 0 &&
        now - hotSongsUpdateTime.value < twoHours
      ) {
        return;
      }

      const { getHotSongs } = useMusic();
      try {
        // limit=20, offset=0, time=week
        const data = await getHotSongs(
          0,
          10,
          "week" as GetTrendingTracksTimeEnum,
        );
        if (data) {
          hotSongs.value = data;
          hotSongsUpdateTime.value = now;
        }
      } catch (err) {
        console.error("获取热门歌曲失败:", err);
      }
    }

    return {
      hotSongs,
      hotSongsUpdateTime,
      fetchHotSongs,
    };
  },
  {
    persist: {
      key: "fanMusic:music_cache",
    },
  },
);
