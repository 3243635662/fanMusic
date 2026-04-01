// server/api/auth/login.post.ts
import { buildSuperCookie } from "../../utils/getCookie";

export default defineEventHandler(async (event) => {
  const { mobile, code } = await readBody(event);
  const config = useRuntimeConfig();

  if (!mobile || !code) {
    throw createError({ statusCode: 400, statusMessage: "手机号和验证码必填" });
  }

  const dfid = await getValidDfid();
  if (!dfid) {
    throw createError({
      statusCode: 500,
      statusMessage: "设备注册失败，请稍后再试",
    });
  }

  try {
    const res: any = await $fetch.raw(
      `${config.api.kugouApiSource}/login/cellphone`,
      {
        query: { mobile, code, timestamp: Date.now() },
        headers: { Cookie: `dfid=${dfid}` },
      },
    );

    const body: any = res._data;

    if (body.status === 1 && body.data) {
      const { token, userid } = body.data;
      // 缝合超级 Cookie
      const superCookie = buildSuperCookie({ token, userid, dfid });
      // 统一字段名返回给前端
      body.superCookie = superCookie;
      body.token = token;
    }

    return body;
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.data?.msg || "登录验证失败",
    });
  }
});
