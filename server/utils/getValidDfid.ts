import type { H3Event } from "h3";

export async function getValidDfid() {
  // 使用 Nitro 的内存缓存模块
  const storage = useStorage("cache:kugou");

  // 1. 尝试从缓存中获取 dfid
  let dfid = await storage.getItem("dfid");

  // 2. 如果缓存中没有，再去请求酷狗接口
  if (!dfid) {
    const config = useRuntimeConfig();
    try {
      console.log("缓存中无 dfid，正在向酷狗服务器注册新设备...");
      const res: any = await $fetch(
        `${config.api.kugouApiSource}/register/dev`,
      );

      if (res.status === 1 && res.data?.dfid) {
        dfid = res.data.dfid;
        // 将 dfid 存入缓存 (可以设置过期时间，这里简化为常驻)
        await storage.setItem("dfid", dfid);
        console.log("新 dfid 获取并缓存成功:", dfid);
      } else {
        throw new Error("获取 dfid 失败");
      }
    } catch (error) {
      console.error("酷狗设备注册异常:", error);
      return null;
    }
  }

  return dfid as string;
}

/**
 * 从浏览器传来的 Cookie 中提取用户的完整酷狗 Cookie
 */
export function getUserCookie(event: H3Event) {
  let cookieStr = getCookie(event, "kugou_cookie") || "";
  // h3 的 getCookie 一般会自动 decode，但如果没 decode 成功，我们手动解析：%3D 对应 '='
  if (cookieStr.includes("%3D") || cookieStr.includes("%3B")) {
    try {
      cookieStr = decodeURIComponent(cookieStr);
    } catch {
      // ignore
    }
  }
  return cookieStr;
}
