/**
 * 处理封面图 URL，替换尺寸占位符
 * @param url 封面图 URL
 * @param size 尺寸，默认为 400
 * @returns 处理后的 URL
 */
export const processCover = (url: string | undefined | null, size: string = "400") => {
  const target = url || "https://imge.kugou.com/stdmusic/{size}/20210817/20210817080716564241.jpg";
  return target.replace("{size}", size).replace("http://", "https://");
};
