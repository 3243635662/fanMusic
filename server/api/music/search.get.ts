// server/api/music/search.get.ts
import { resFormatMethod } from "../../utils/formatResponse";

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const keyword = (query.keyword as string)?.trim();
  const config = useRuntimeConfig();

  // 1. 参数校验：不允许空搜索
  if (!keyword) {
    return resFormatMethod(400, [], "请输入关键词");
  }

  try {
    // 3. 使用 defineCachedResponse (如果想做缓存) 或者简单的 $fetch
    // 注意：酷狗概念版搜索接口某些版本用 keywords，某些用 keyword，请根据你测试成功的为准
    const res = await $fetch.raw(`${config.api.kugouApiSource}/search`, {
      query: {
        keywords: keyword,
        type: "song",
        page: query.page || 1,
        pagesize: 10, // 增加单页数量
      },
      headers: getKugouHeaders(event),
      timeout: 10000, // 10秒超时控制
    });

    const response: any = res._data;

    // 4. 增强映射逻辑：处理更多边界情况
    if (response?.status === 1) {
      const rawList = response.data?.lists || [];

      const optimizedList = rawList.map((item: any) => {
        // 封面图尺寸优化：酷狗图片通常支持 {size} 替换
        let cover = item.Image || item.trans_param?.union_cover || "";
        cover = cover.replace("{size}", "400");

        return {
          id: item.Audioid,
          hash: item.FileHash || item.SongHash,
          name:
            item.SongName || item.FileName?.split(" - ")[1] || item.FileName,
          artist:
            item.SingerName || item.FileName?.split(" - ")[0] || "未知歌手",
          album: item.AlbumName || "单曲",
          albumId: item.AlbumID,
          duration: item.Duration,
          image: cover,
          // 这里的 privilege 逻辑很重要，决定了是否能听
          isVip: item.PayType === 3 || item.Privilege > 0,
          // 某些接口返回会有高亮标签，清除掉以保持 UI 干净
          tag: item.TagContent?.replace(/<[^>]+>/g, "") || "",
          mvHash: item.mvdata?.[0]?.hash || null,
        };
      });

      return resFormatMethod(0, optimizedList, "搜索成功");
    }

    return resFormatMethod(-1, null, response?.error_msg || "搜索暂无结果");
  } catch (error: any) {
    // 5. 区分错误类型：如果是 API 挂了，给一个友好的提示
    console.error("搜索链路异常:", error.message);
    throw createError({
      statusCode: 502,
      message: "音乐服务暂时不可用，请稍后再试",
    });
  }
});
