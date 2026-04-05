// 我的歌单
export interface MyPlayListType {
  listid: string; // 歌单ID
  title: string; // 歌单名称
  count: number; // 歌曲数量
  cover: string; // 歌单封面
  list_create_username: string; // 歌单创建者
}
// 我的歌单歌曲
export interface MyTrackType {
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
  cover: string; // 歌单封面
  title: string; // 歌单名称
  intro: string; // 歌单简介
}

// 推荐歌单歌曲列表
export interface RecommendationTrackType {
  hash: string; //歌曲hash
  name: string;
  artist: string; // 需要提供 空格-空格进行split
  cover: string; // 歌曲封面
  duration: number; // 歌曲时长
}

// 播放队列歌曲类型
export interface PlayQueueTrackType {
  hash: string; //歌曲hash
  name: string; // 歌名
  artist: string;
  cover: string; // 歌曲封面
  duration: number; // 歌曲时长
  url: string | null;
  // 歌词相关
  lyricId?: string;
  lyricAccessKey?: string;
  lyrics?: any[]; // 解析后的歌词数组
}

// 获取歌词id响应 (可能包含多个待选歌词)
export interface GetLyricIdType {
  id: string;
  accesskey: string;
  nickname: string; // 歌词提供者
  duration: number; // 歌曲时长
}
