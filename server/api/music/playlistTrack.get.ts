// server/api/music/playlistTrack.get.ts
import { TrackType } from "../../../shared/types/music";

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const listid = query.listid as string;
  const config = useRuntimeConfig();

  if (!listid) {
    throw createError({
      statusCode: 400,
      statusMessage: "缺少歌单 ID",
    });
  }

  try {
    const res: any = await $fetch(
      `${config.api.kugouApiSource}/playlist/track/all/new`,
      {
        query: {
          listid: listid,
          page: query.page || 1,
          pagesize: query.pagesize || 10,
        },
        headers: getKugouHeaders(event),
      } as any,
    );

    const tracks = res?.data?.info || res?.data;

    if (!tracks || !Array.isArray(tracks)) {
      throw createError({
        statusCode: 500,
        statusMessage:
          res?.msg || "获取歌单内容异常，请检查配置或手动刷新登录状态",
      });
    }

    const formatData: TrackType[] = tracks.map((item: any) => {
      return {
        id: item.id,
        hash: item.hash,
        name: item.name.split(" - ")[1].split(".")[0] || "未知歌曲",
        artist: item.name.split(" - ")[0] || "未知歌手",
        cover: item.cover,
        duration: "未知",
      };
    });
    return resFormatMethod(0, formatData, "获取歌单歌曲成功");
  } catch (error: any) {
    if (error.statusCode) throw error;

    throw createError({
      statusCode: 500,
      statusMessage: error.statusMessage || "获取歌单歌曲失败",
    });
  }
});
