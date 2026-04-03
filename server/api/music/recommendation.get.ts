import { RecommendationPlayListType } from "../../../shared/types/music";

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  try {
    const res: any = await $fetch(
      `${config.api.kugouApiSource}/theme/playlist`,
      {
        headers: getKugouHeaders(event),
      },
    );


    const formatData: RecommendationPlayListType[] = res.data.theme_list.map(
      (item: any) => {
        return {
          id: item.id,
          cover: item.pic,
          title: item.title,
          intro: item.intro,
        };
      },
    );
    return resFormatMethod(0, formatData, "获取推荐歌单成功");
  } catch (error: any) {
    if (error.statusCode) throw error;

    throw createError({
      statusCode: 500,
      statusMessage: error.statusMessage || "获取推荐歌单失败",
    });
  }
});
