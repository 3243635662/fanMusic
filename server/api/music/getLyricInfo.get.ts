export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const { id, accesskey } = getQuery(event);
  if (!id || !accesskey) {
    throw createError({
      statusCode: 400,
      message: "缺少参数",
    });
  }
  try {
    const res: any = await $fetch(`${config.api.kugouApiSource}/lyric`, {
      query: {
        id: id,
        accesskey: accesskey,
        fmt: "krc",
        decode: true,
      },
      headers: getKugouHeaders(event),
    } as any);
    return resFormatMethod(0, res, "获取歌词成功");
  } catch (error: any) {
    if (error.statusCode) throw error;

    throw createError({
      statusCode: 500,
      statusMessage: error.statusMessage || "获取歌词失败",
    });
  }
});
