import { buildSuperCookie } from "../../utils/getCookie";
import { getValidDfid } from "../../utils/getValidDfid";

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const config = useRuntimeConfig();

  const token = query.token as string;
  const userid = query.userid as string;

  if (!token || !userid) {
    throw createError({
      statusCode: 400,
      statusMessage: "缺少必要的 token 或 userid",
    });
  }

  const dfid = await getValidDfid();

  try {
    // 3. 调用酷狗刷新接口
    const res: any = await $fetch(`${config.api.kugouApiSource}/login/token`, {
      query: {
        token,
        userid,
        timestamp: Date.now(),
      },
      headers: {
        // 伪装三件套
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        Referer: "https://www.kugou.com/",
        Cookie: `dfid=${dfid}`,
      },
    });

    // 4. 处理返回结果
    if (res.status === 1 && res.data) {
      // 重新拼合超级 Cookie
      const newToken = res.data.token || token;
      const superCookie = buildSuperCookie({
        token: newToken,
        userid,
        dfid: dfid || "",
      });

      return resFormatMethod(
        0,
        {
          ...res.data,
          superCookie,
        },
        "刷新登录成功",
      );
    } else {
      return resFormatMethod(
        1,
        null,
        res.msg || "刷新失败，凭证可能已彻底过期",
      );
    }
  } catch (error: any) {
    console.error("刷新登录异常:", error.data || error.message);
    throw createError({
      statusCode: error.response?.status || 500,
      statusMessage: "服务器刷新接口调用失败",
    });
  }
});
