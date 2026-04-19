import { RecommendationTrackType } from "../../../shared/types/music";

export default defineCachedEventHandler(async (event) => {
  const query = getQuery(event);
  const config = useRuntimeConfig();
  const theme_id = query.theme_id;

  if (!theme_id) {
    throw createError({
      statusCode: 400,
      statusMessage: "缺少歌单 ID",
    });
  }

  try {
    const res: any = await $fetch(
      `${config.api.kugouApiSource}/theme/playlist/track`,
      {
        query: {
          theme_id: theme_id,
        },
        headers: {
          ...getKugouHeaders(event),
          "Accept-Encoding": "gzip, deflate",
        },
      } as any,
    );

    const formatData: RecommendationTrackType[] = res.data.song_list.map(
      (item: any) => {
        return {
          hash: item.hash,
          name: item.songname,
          artist: item.author_name,
          cover: item.sizable_cover?.replace("{size}", "400") || "",
          duration: item.time_length,
        };
      },
    );
    return resFormatMethod(0, formatData, "获取推荐歌单歌曲成功");
  } catch (error: any) {
    if (error.statusCode) throw error;

    throw createError({
      statusCode: 500,
      statusMessage: error.statusMessage || "获取推荐歌单歌曲失败",
    });
  }
}, {
  // 推荐歌单歌曲缓存：10 分钟
  maxAge: 600,
  swr: true,
  vary: ["theme_id"],
});
