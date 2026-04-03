export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const res = await $fetch.raw(`${config.api.kugouApiSource}/user/vip/detail`, {
    headers: getKugouHeaders(event),
  });

  return res._data;
});
