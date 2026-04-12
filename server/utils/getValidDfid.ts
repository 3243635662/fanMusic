import type { H3Event } from "h3";

export async function getValidDfid() {
  const storage = useStorage("cache:kugou");

  // 1. 尝试从缓存中获取 dfid
  const dfid = await storage.getItem("dfid");

  if (dfid) {
    return dfid as string;
  }

  // 2. 缓存中没有，请求酷狗接口
  const config = useRuntimeConfig();
  try {
    const res: any = await $fetch(
      `${config.api.kugouApiSource}/register/dev`,
    );

    if (res.status === 1 && res.data?.dfid) {
      const newDfid = res.data.dfid;
      await storage.setItem("dfid", newDfid, { ttl: 60 * 60 * 12 });
      return newDfid;
    } else {
      throw new Error("获取 dfid 失败");
    }
  } catch (error) {
    console.error("酷狗设备注册异常:", error);
    return null;
  }
}

/**
 * 从浏览器传来的 Cookie 中提取用户的完整酷狗 Cookie
 */
export function getUserCookie(event: H3Event) {
  let cookieStr = getCookie(event, "kugou_cookie") || "";
  if (cookieStr.includes("%3D") || cookieStr.includes("%3B")) {
    try {
      cookieStr = decodeURIComponent(cookieStr);
    } catch {
      // ignore
    }
  }
  return cookieStr;
}

// *统一配置好headers:
export const getKugouHeaders = (event: H3Event) => {
  const userCookie = getUserCookie(event);
  return {
    Cookie: userCookie,
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    Referer: "https://www.kugou.com/",
    Origin: "https://www.kugou.com/",
  };
};
