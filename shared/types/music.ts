// 我的歌单
export interface PlayListType {
  listid: string; // 歌单ID
  name: string; // 歌单名称
  count: number; // 歌曲数量
  cover: string; // 歌单封面
  list_create_username: string; // 歌单创建者
}
// 我的歌单歌曲
export interface TrackType {
  id: number;
  hash: string; //歌曲hash
  name: string;
  artist: string; // 需要提供 空格-空格进行split
  cover: string; // 歌曲封面
  duration: "未知"; // 歌曲时长 第三方逆向接口暂未给出
}

// 推荐歌单（也就是主题歌单）
export interface RecommendationPlayListType {
  id: string; // 歌单ID
  pic: string; // 歌单封面
  title: string; // 歌单名称
  intro: string; // 歌单简介
}

// 推荐歌单歌曲列表
export interface RecommendationTrackType {
  hash: string; //歌曲hash
  name: string;
  artist: string; // 需要提供 空格-空格进行split
  image: string; // 歌曲封面
  duration: number; // 歌曲时长 第三方逆向接口暂未给出
}
