/**
 * 构造酷狗概念版所需的“超级 Cookie”字符串
 */
export const buildSuperCookie = (params: {
  token: string;
  userid: string | number;
  dfid: string;
}) => {
  const { token, userid, dfid } = params;

  const cookieMap = {
    token,
    userid,
    dfid,
    KUGOU_API_MID: dfid,
    KUGOU_API_GUID: dfid,
    KUGOU_API_DEV: dfid,
    KUGOU_API_MAC: "02:00:00:00:00:00", // 固定虚拟 MAC 地址
  };

  return Object.entries(cookieMap)
    .map(([key, val]) => `${key}=${val}`)
    .join("; ");
};
