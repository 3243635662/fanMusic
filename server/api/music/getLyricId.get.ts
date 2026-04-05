import { GetLyricIdType } from "../../../shared/types/music";

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const query = getQuery(event);
  const hash = query.hash;
  if (!hash) {
    throw createError({
      statusCode: 400,
      statusMessage: "缺少参数",
    });
  }
  try {
    const res: any = await $fetch(`${config.api.kugouApiSource}/search/lyric`, {
      query: {
        hash: hash,
      },
      headers: getKugouHeaders(event),
    } as any);

    const firstCandidate =
      res.candidates && res.candidates.length > 0 ? res.candidates[0] : null;
    if (!firstCandidate) {
      return resFormatMethod(1, null, "未找到对应歌词候选");
    }

    const formatData: GetLyricIdType = {
      id: firstCandidate.id,
      accesskey: firstCandidate.accesskey,
      nickname: firstCandidate.nickname,
      duration: firstCandidate.duration,
    };
    return resFormatMethod(0, formatData, "获取歌词成功");
  } catch (error: any) {
    if (error.statusCode) throw error;

    throw createError({
      statusCode: 500,
      statusMessage: error.statusMessage || "获取歌词失败",
    });
  }
});
