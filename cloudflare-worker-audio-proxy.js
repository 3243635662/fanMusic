/**
 * Cloudflare Worker - 音频流代理
 * 部署方式：
 * 1. 登录 Cloudflare Dashboard → Workers & Pages → Create Worker
 * 2. 将此文件内容粘贴到 Worker 编辑器中
 * 3. 保存并部署
 * 4. 在 Custom Domains 中绑定：audio-proxy.fanblog.top
 * 
 * 使用方式：
 * https://audio-proxy.fanblog.top/?url=encodeURIComponent(酷狗CDN原始URL)
 */

const ALLOWED_HOSTS = [
  'fs.youthandroid2.kugou.com',
  'fs.kugou.com',
  'trackercdn.kugou.com',
  'other.web.rh01.sycdn.kuwo.cn',
];

export default {
  async fetch(request) {
    // 处理 CORS 预检请求
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Range',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    const url = new URL(request.url);
    const targetUrl = url.searchParams.get('url');

    if (!targetUrl) {
      return new Response('Missing url parameter', { status: 400 });
    }

    // 安全校验
    let parsedTarget;
    try {
      parsedTarget = new URL(targetUrl);
    } catch {
      return new Response('Invalid URL', { status: 400 });
    }

    if (!ALLOWED_HOSTS.some(h => parsedTarget.hostname.endsWith(h))) {
      return new Response('Domain not allowed', { status: 403 });
    }

    try {
      // 构建转发请求头
      const headers = new Headers();
      headers.set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      headers.set('Referer', 'https://www.kugou.com/');

      // 转发 Range 头（关键：支持跳转进度条）
      const rangeHeader = request.headers.get('Range');
      if (rangeHeader) {
        headers.set('Range', rangeHeader);
      }

      // 请求源站
      const response = await fetch(targetUrl, { headers });

      // 构建响应头
      const responseHeaders = new Headers();
      responseHeaders.set('Content-Type', response.headers.get('Content-Type') || 'audio/mpeg');
      responseHeaders.set('Accept-Ranges', 'bytes');
      responseHeaders.set('Access-Control-Allow-Origin', '*');
      responseHeaders.set('Cache-Control', 'public, max-age=3600');

      const contentLength = response.headers.get('Content-Length');
      const contentRange = response.headers.get('Content-Range');

      if (contentLength) responseHeaders.set('Content-Length', contentLength);
      if (contentRange) responseHeaders.set('Content-Range', contentRange);

      // 返回流式响应，状态码与源站一致
      return new Response(response.body, {
        status: response.status,
        headers: responseHeaders,
      });
    } catch (error) {
      return new Response('Proxy fetch failed: ' + error.message, { status: 502 });
    }
  },
};
