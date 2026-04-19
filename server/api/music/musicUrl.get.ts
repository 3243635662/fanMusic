export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const query = getQuery(event);
  const hash = query.hash as string;
  
  if (!hash) {
    throw createError({
      statusCode: 400,
      message: "缺少 hash 参数",
    });
  }
  
  try {
    const res: any = await $fetch(`${config.api.kugouApiSource}/song/url`, {
      query: {
        hash: hash,
        quality: 128,
      },
      headers: {
        ...getKugouHeaders(event),
        "Accept-Encoding": "gzip, deflate",
      },
    } as any);

    // 酷狗接口返回的 url 是一个数组，我们取第一个
    const rawUrl: string | null = Array.isArray(res.url) ? res.url[0] : (res.url || null);

    // 修复 Mixed Content：通过 Cloudflare Worker 代理转发 HTTP 音频
    // Cloudflare Worker 支持 HTTPS + 流式传输 + Range 请求，完美解决 Vercel 上的播放问题
    let playUrl: string | null = null;
    if (rawUrl) {
      playUrl = `${config.api.audioProxyUrl}?url=${encodeURIComponent(rawUrl)}`;
    }

    return resFormatMethod(0, playUrl, "获取歌曲 URL 成功");
  } catch (error: any) {
    if (error.statusCode) throw error;

    throw createError({
      statusCode: 500,
      statusMessage: error.statusMessage || "获取歌曲 URL 失败",
    });
  }
});
