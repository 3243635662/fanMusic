import type { PlayListType } from "#shared/types/music";
import { resFormatMethod } from "../../utils/formatResponse";
export default defineEventHandler(async (event) => {
  const { page, pagesize } = getQuery(event);
  const config = useRuntimeConfig();
  const userCookie = getUserCookie(event);
  console.log("userCookie", userCookie);

  try {
    const res: any = await $fetch(
      `${config.api.kugouApiSource}/user/playlist`,
      {
        query: {
          page,
          pagesize,
        },
        headers: getKugouHeaders(event),
      } as any,
    );

    const formatData: PlayListType[] = res.data.info.map((item: any) => {
      return {
        listid: item.listid,
        name: item.name,
        count: item.count,
        cover: item.pic,
        list_create_username: item.list_create_username,
      };
    });
    return resFormatMethod(0, formatData, "获取歌单成功");
  } catch (error: any) {
    // 打印具体的报错信息到终端
    console.error("DEBUG - 歌单接口错误详情:", error);

    // 抛出更有用的错误信息
    throw createError({
      statusCode: error.response?.status || 500,
      statusMessage: error.message || "Internal Server Error",
    });
  }
});
