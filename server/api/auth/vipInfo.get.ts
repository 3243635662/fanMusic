export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const userCookie = getUserCookie(event);
  const res = await $fetch.raw(`${config.api.kugouApiSource}/user/vip/detail`, {
    headers: {
      Cookie: userCookie,
    },
  });

  return res._data;
});
