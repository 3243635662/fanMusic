import { Readable } from "node:stream";

/**
 * 音频流代理 API
 * 解决 Mixed Content：HTTPS 页面无法加载 HTTP 音频资源
 * 支持 Range 请求，浏览器 <audio> 可正常流式播放和跳转
 */
export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const url = query.url as string;

  if (!url) {
    throw createError({ statusCode: 400, message: "缺少 url 参数" });
  }

  // 安全校验：只允许代理酷狗 CDN 域名
  const allowedHosts = [
    "fs.youthandroid2.kugou.com",
    "fs.kugou.com",
    "trackercdn.kugou.com",
    "other.web.rh01.sycdn.kuwo.cn",
  ];
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    throw createError({ statusCode: 400, message: "无效的 URL" });
  }
  if (!allowedHosts.some((h) => parsedUrl.hostname.endsWith(h))) {
    throw createError({ statusCode: 403, message: "不允许代理该域名" });
  }

  const fetchHeaders: Record<string, string> = {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    Referer: "https://www.kugou.com/",
  };

  // 转发客户端的 Range 头
  const rangeHeader = getHeader(event, "range");
  if (rangeHeader) {
    fetchHeaders["Range"] = rangeHeader;
  }

  try {
    const response = await fetch(url, { headers: fetchHeaders });

    if (!response.ok && response.status !== 206) {
      throw createError({
        statusCode: response.status,
        statusMessage: `源站返回错误: ${response.statusText}`,
      });
    }

    const contentType = response.headers.get("content-type") || "audio/mpeg";
    const contentLength = response.headers.get("content-length");
    const contentRange = response.headers.get("content-range");

    // 设置响应头
    setResponseHeader(event, "Content-Type", contentType);
    setResponseHeader(event, "Accept-Ranges", "bytes");
    setResponseHeader(event, "Cache-Control", "public, max-age=3600");

    if (contentLength) {
      setResponseHeader(event, "Content-Length", Number(contentLength));
    }
    if (contentRange) {
      setResponseHeader(event, "Content-Range", contentRange);
    }

    // 源站返回 206 则我们也返回 206
    if (response.status === 206) {
      setResponseStatus(event, 206);
    }

    // 将 Web ReadableStream 转为 Node.js Readable，再流式传输
    const nodeStream = Readable.fromWeb(response.body as any);
    return sendStream(event, nodeStream);
  } catch (error: any) {
    if (error.statusCode) throw error;
    console.error("[proxy] 代理失败:", error.message || error);
    throw createError({
      statusCode: 502,
      statusMessage: "音频代理请求失败: " + (error.message || "未知错误"),
    });
  }
});
