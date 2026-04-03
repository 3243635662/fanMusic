export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const query = getQuery(event);
  const hash = query.hash as string;
  if (!hash) {
    throw createError({
      statusCode: 400,
      message: "缺少hash参数",
    });
  }

  try {
    const res: any = await $fetch(`${config.api.kugouApiSource}/song/url`, {
      query: {
        hash: hash,
        quality:128,
      },
      headers: getKugouHeaders(event),
    } as any);

    // 酷狗接口返回的 url 是一个数组，我们取第一个
    const playUrl = Array.isArray(res.url) ? res.url[0] : (res.url || null);
    
    return resFormatMethod(0, playUrl, "获取歌曲URL成功");
  } catch (error: any) {
    if (error.statusCode) throw error;

    throw createError({
      statusCode: 500,
      statusMessage: error.statusMessage || "获取歌曲URL失败",
    });
  }
});
