export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();

  try {
    const res = await $fetch.raw(`${config.api.kugouApiSource}/user/vip/detail`, {
      headers: getKugouHeaders(event),
    });

    return res._data;
  } catch (error: any) {
    throw createError({
      statusCode: error.response?.status || 500,
      statusMessage: "获取 VIP 信息失败",
    });
  }
});
