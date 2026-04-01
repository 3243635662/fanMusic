export default defineEventHandler(async (event) => {
  const { mobile } = await readBody(event);
  const config = useRuntimeConfig();

  if (!mobile) {
    throw createError({
      statusCode: 400,
      statusMessage: "请输入手机号",
    });
  }

  // 1. 获取 dfid
  const dfid = await getValidDfid();

  // 2. 发送验证码
  try {
    const res: any = await $fetch(`${config.api.kugouApiSource}/captcha/sent`, {
      query: { mobile, timestamp: Date.now() },
      headers: { Cookie: `dfid=${dfid}` },
    });
    return res;
  } catch (error: any) {
    console.error("验证码发送失败:", error.data);
    throw createError({
      statusCode: 500,
      statusMessage: error.data?.msg || "验证码发送失败",
    });
  }
});
