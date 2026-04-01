# 酷狗音乐 NodeJS 版 API

> 全部接口已升级到最新
> 具备登录接口
> 更完善的文档

## 环境要求

需要 NodeJS 12+ 环境

## 工作原理

跨站请求伪造 (CSRF), 伪造请求头 , 调用官方 API

## 安装

```bash
$ git clone git@github.com:MakcRe/KuGouMusicApi.git
$ cd KuGouMusicApi
$ npm install
```

## 使用接口为概念版

```
复制 .env.example 为 .env，并且把里面的 platform='' 改为 platform=lite
注意不同版本的平台的 token 是不通用的。
```

## 运行

```bash
$ npm run dev
```

服务器启动默认端口为 3000, 若不想使用 3000 端口 , 可使用以下命令 :
Mac/Linux: `PORT=4000 npm run dev`
windows (git-bash/cmder): `set PORT=4000 && npm run dev`
windows (PowerShell): `$Env:PORT=4000; npm run dev`
服务器启动默认 host 为 localhost,如果需要更改:
Mac/Linux: `HOST=127.0.0.1 npm run dev`
windows (git-bash/cmder): `set HOST=127.0.0.1 && npm run dev`

## 免责声明

1. 本项目仅供学习使用，请尊重版权，请勿利用此项目从事商业行为及非法用途!
2. 使用本项目的过程中可能会产生版权数据。对于这些版权数据，本项目不拥有它们的所有权。为了避免侵权，使用者务必在 24 小时内清除使用本项目的过程中所产生的版权数据。
3. 由于使用本项目产生的包括由于本协议或由于使用或无法使用本项目而引起的任何性质的任何直接、间接、特殊、偶然或结果性损害由使用者负责。
4. 禁止在违反当地法律法规的情况下使用本项目。
5. 音乐平台不易，请尊重版权，支持正版。
6. 本项目仅用于对技术可行性的探索及研究，不接受任何商业合作及捐赠。
7. 如果官方音乐平台觉得本项目不妥，可联系本项目更改或移除。

## Vercel 部署

1. fork 此项目
2. 在 Vercel 官网点击 New Project
3. 点击 Import Git Repository 并选择你 fork 的此项目并点击 import
4. 点击 PERSONAL ACCOUNT 的 select
5. 直接点 Continue
6. 若需要部署版本为概念版（不需要该步骤可以跳过），在 Environment Variables 添加 key 为 `platform`，Value 为 `lite` 然后点击 Add
7. PROJECT NAME自己填,FRAMEWORK PRESET 选 Other 然后直接点 Deploy 接着等部署完成即可

---

## 接口文档

### 调用前须知

- 本项目不提供线上 demo，请不要轻易信任使用他人提供的公开服务，以免发生安全问题,泄露自己的账号和密码
- 为使用方便,降低门槛, 文档示例接口直接使用了 GET 请求,本项目同时支持 GET/POST 请按实际需求使用 (POST 请求 url 必须添加时间戳,使每次请求 url 不一样,不然请求会被缓存)
- 由于接口做了缓存处理 ( 缓存 2 分钟,), 相同的 url 会在两分钟内只向酷狗服务器发一次请求 , 如果遇到不需要缓存结果的接口 , 可在请求 url 后面加一个时间戳参数使 url 不同 , 例子 : `/personal/fm?timestamp=1691256061923`
- 不要频繁调登录接口,不然可能会被风控,登录状态还存在就不要重复调登录接口
- 如果是跨域请求 , 请在所有请求带上 `xhrFields: { withCredentials: true }` (axios 为 `withCredentials: true`, Fetch API 为 `fetch(url, { credentials: 'include' })`), 或直接手动传入 cookie。
- 本项目仅供学习使用,请尊重版权，请勿利用此项目从事商业行为或进行破坏版权行为

此项目接口已经通过vercel不部署且代理到我的域名:music_api.fanblog.top

### 登录

说明：登录有五个接口使用 `encodeURIComponent`对密码编码或者使用 `POST`请求，避免某些特殊字符无法解析,如#(#在 url 中会被识别为 hash,而不是 query)
不要频繁调登录接口,不然可能会被风控,登录状态还存在就不要重复调登录接口, **不同版本的 token 是不通用的**

#### 1.手机登录

**必选参数：**

- `mobile`: 手机号码
- `code`: 验证码，使用 `/captcha/sent`接口传入手机号获取验证码,调用此接口传入验证码,可使用验证码登录
  **可选参数**
- `userid`: 用户 id,当用户存在多个账户是时，必须加上需要登录的用户 id
  **接口地址：** `/login/cellphone`
  **调用例子：** `/login/cellphone?mobile=xxx&code=xxx`

#### 2. 用户名登录(该登录可能需要验证，不推荐使用)

**必选参数：**

- `username`: 用户名
- `password`: 密码
  **接口地址：** `/login`
  **调用例子：** `/login?username=xxx&password=yyy`

#### 3. 开放接口登录(目前仅支持微信登录)

说明: 该接口为第三方平台登录，目前仅支持微信登录
**必选参数：**

- `code`: 由微信扫码成功后生成
  **接口地址：** `/login/openplat`
  **调用例子：** `/login/openplat?code=xxx`

#### 4. 二维码登录

说明: 二维码登录涉及到 3 个接口,调用务必带上时间戳,防止缓存

- **1.二维码 key 生成接口**
  说明: 调用此接口可生成一个 key
  **接口地址：** `/login/qr/key`
- **2.二维码生成接口**
  说明: 调用此接口传入上一个接口生成的 key 可生成二维码图片的 base64 和二维码信息
  **必选参数：** `key`
  **可选参数：** `qrimg` (传入后会额外返回二维码图片 base64 编码)
  **接口地址：** `/login/qr/create`
- **3.二维码检测扫码状态接口**
  说明: 轮询此接口可获取二维码扫码状态,0 为二维码过期，1 为等待扫码，2 为待确认，4 为授权登录成功（4 状态码下会返回 token）
  **必选参数：** `key`
  **接口地址：** `/login/qr/check`

#### 5. 微信登录

说明：微信登录涉及到 2 个接口,调用务必带上时间戳,防止缓存

- **1. 二维码生成接口**
  说明：调用此接口可生成微信的 uuid, 包括二维码 Base64 和 二维码扫描链接, 注: 该接口请求的接口过多, 会出现返回较慢的情况
  **接口地址：** `/login/wx/create`
- **2.二维码检测扫码状态接口**
  说明：轮询此接口可获取二维码扫码状态, 408 为等待扫描，404 为已经扫描，403 为拒绝登录，405 为登录成功，402 为已过期(405 状态下登陆完成口会返回 wx_code,用于开放登陆 `/login/openplat`)
  **必选参数：** `uuid`
  **可选参数：** `timestamp` (建议传递，否则由于缓存会导致延迟)
  **接口地址：** `/login/wx/check`

### 刷新登录

说明 : 调用此接口，可刷新登录状态，可以延长 token 过期时间
**可选参数：**

- `token`: 登录后获取的 token
- `userid`: 用户 id
  **接口地址：** `/login/token`

### 发送验证码

说明: 调用此接口 ,传入手机号码, 可发送验证码
**必选参数：** `mobile`: 手机号码
**接口地址：** `/captcha/sent`

### dfid 获取

**接口地址：** `/register/dev`

### 获取用户额外信息

说明：登陆后调用此接口，可以获取用户额外信息
**接口地址：** `/user/detail`

### 获取用户 vip 信息

说明：登陆后调用此接口，可以获取用户 vip 信息
**接口地址：** `/user/vip/detail`

### 获取用户歌单

说明：登录后调用此接口，可以获取用户的所有创建以及收藏的歌单
**可选参数：** `page` (页数), `pagesize` (每页页数, 默认为 30)
**接口地址：** `/user/playlist`

### 获取用户关注歌手

说明：登录后调用此接口，可以获取用户的所有关注的歌手/用户
**接口地址：** `/user/follow`

### 获取用户云盘

说明：登录后调用此接口可以获取用户上传到云盘的音乐
**可选参数** `page`, `pagesize` (默认30)
**接口地址：** `/user/cloud`

### 获取用户云盘音乐 URL

说明：登录后调用此接口可以获取用户上传到云盘的音乐 URL，部分可以直接用 `/song/url` 直接获取 URL（目前获取到的文件大小都约为 10M 左右）
**必选参数：** `hash`
**可选参数：** `album_id`, `name`, `album_audio_id`
**接口地址：** `/user/cloud/url`

### 获取用户收藏的视频

说明：登录后调用此接口可以获取用户收藏的视频
**可选参数** `page`, `pagesize` (默认30)
**接口地址：** `/user/video/collect`

### 获取用户喜欢的视频

说明：登录后调用此接口可以获取用户喜欢的视频
**可选参数** `pagesize` (默认30)
**接口地址：** `/user/video/love`

### 获取用户听歌历史排行

说明：登录后调用此接口，可以获取用户听歌历史排行
**可选参数：** `type` (0 为获取最近一周前 120 首歌曲，1：获取全部累计前 120 首歌曲)
**接口地址：** `/user/listen`

### 获取用户最近听歌历史

说明：登录后调用此接口，可以近期的听歌历史记录
**可选参数：** `bp` (可以更加上一次返回值传入)
**接口地址：** `/user/history`

### 获取继续播放信息（对应手机版首页显示继续播放入口）

说明：登录后调用此接口，可以最后设备播放信息
**可选参数：** `pagesize` (默认30)
**接口地址：** `/lastest/songs/listen`

### 收藏歌单/新建歌单

说明 : 调用此接口, 可收藏歌单/新建歌单, 收藏成功后建议使用 `/playlist/tracks/add` 把原歌单下的歌曲添加到新的歌单
**必选参数：** `name`, `list_create_userid`, `list_create_listid`
**可选参数** `is_pri` (0公开 1隐私，仅创建时), `type` (1收藏 0创建，默认0), `list_create_gid`
**接口地址：** `/playlist/add`

### 取消收藏歌单/删除歌单

说明 : 调用此接口 , 取消收藏歌单
**必选参数：** `listid`
**接口地址：** `/playlist/del`

### 对歌单添加歌曲

说明 : 调用此接口 , 可以添加歌曲到歌单
**必选参数：** `listid`, `data` (格式为 歌曲名称|歌曲 hash|专辑 id|(mixsongid/album_audio_id)，最少需要歌曲名称以及歌曲hash，支持多个逗号分隔)
**接口地址：** `/playlist/tracks/add`

### 对歌单删除歌曲

说明 : 调用此接口 , 可以删除歌单某首歌曲
**必选参数：** `listid`, `fileids` (可多个逗号隔开)
**接口地址：** `/playlist/tracks/del`

### 新碟上架

说明: 调用此接口 , 可获取新碟上架列表
**可选参数：** `type` (1华语 2欧美 3日本 4韩国，默认空), `page`, `pagesize` (默认30)
**接口地址：** `/top/album`

### 专辑信息

说明: 调用此接口 ,传入专辑 id 可获取专辑相关信息
**必选参数：** `album_id` (可多个逗号分割)
**可选参数：** `fields` (如 trans_param, authors, album_name 等)
**接口地址：** `/album`

### 专辑详情

说明: 调用此接口 ,传入专辑 id 可获取专辑详情
**必选参数：** `id`
**接口地址：** `/album/detail`

### 专辑音乐列表

说明: 调用此接口 ,传入专辑 id 可获取专辑音乐列表
**必选参数：** `id`
**可选参数：** `page`, `pagesize` (默认30)
**接口地址：** `/album/songs`

### 获取音乐 URL

说明: 调用此接口, 传入的音乐 hash, 可以获取对应的音乐的 url, 未登录状态或者非会员可能会返回为空。
⚠️ 注意：因接口问题，目前获取 url 接口数据需要先调用 `/register/dev` 接口获取 dfid，否则会提示 `本次请求需要验证`
**必选参数：** `hash`
**可选参数：** `album_id`, `free_part`, `album_audio_id`, `quality`
**quality 支持的参数：** `piano`(钢琴), `acappella`(人声伴奏), `subwoofer`(骨笛), `ancient`(尤克里里), `surnay`(唢呐), `dj`, `128`(128码率mp3), `320`(320码率mp3), `flac`, `high`(无损), `viper_atmos`(蝰蛇全景声), `viper_clear`(蝰蛇超清音质), `viper_tape`(蝰蛇母带)
**接口地址：** `/song/url`

### 获取音乐 URL（新版）

说明: 调用此接口, 传入的音乐 hash, 可以获取对应的音乐的 url, 未登录状态或者非会员可能会返回为空，该接口会一次性返回支持的音质的音频 url, **但该接口存在音频加密（目前无法解码），请谨慎使用**
⚠️ 注意：需先调用 `/register/dev` 获取 dfid
**必选参数：** `hash`
**可选参数：** `album_audio_id`, `free_part`
**接口地址：** `/song/url/new`

### 获取歌曲高潮部分

说明: 调用此接口, 传入的音乐 hash, 可以获取对应的音乐的高潮时间
**必选参数：** `hash` (可多个逗号分割)
**接口地址：** `/song/climax`

### 搜索

说明: 调用此接口 , 传入搜索关键词可以搜索该音乐 / mv / 歌单 / 歌词 / 专辑 / 歌手
**必选参数：** `keywords`
**可选参数：** `page`, `pagesize` (默认30), `type` (默认单曲，special歌单，lyric歌词，song单曲，album专辑，author歌手，mv)
**接口地址：** `/search`

### 默认搜索关键词

说明 : 调用此接口 , 可获取默认搜索关键词
**接口地址：** `/search/default`

### 综合搜索

说明: 调用此接口, 传入搜索关键词可以获得综合搜索，搜索结果同时包含单曲 , 歌手 , 歌单等信息
**必选参数：** `keywords`
**可选参数：** `page`, `pagesize` (默认30)
**接口地址：** `/search/complex`

### 热搜列表

说明 : 调用此接口,可获取热门搜索列表
**接口地址：** `/search/hot`

### 搜索建议

说明 : 调用此接口 , 传入搜索关键词可获得搜索建议
**可选参数：** `albumTipCount`, `correctTipCount`, `mvTipCount`, `musicTipCount`
**接口地址：** `/search/suggest`

### 歌词搜索

说明: 调用此接口, 可以搜索歌词，该接口需配合 `/lyric` 使用。
**必选参数：** `keywords` 或 `hash` (二选一)
**可选参数：** `album_audio_id`, `man` (yes返回多个，no返回一个，默认no)
**接口地址：** `/search/lyric`

### 获取歌词

说明 : 调用此接口，可以获取歌词，调用该接口前则需要调用`/search/lyric` 获取完整参数
**必选参数：** `id`, `accesskey`
**可选参数：** `fmt` (lrc普通歌词，krc逐字歌词), `decode` (传入该参数返回解码后的歌词)
**接口地址：** `/lyric`

### 歌单分类

说明 : 调用此接口,可获取歌单分类,包含 category 信息
**接口地址：** `/playlist/tags`

### 歌单

说明 : 调用此接口 , 可获取歌单
**必选参数：** `category_id` (0推荐，11292 HI-RES，其他从tags接口获取)
**可选参数：** `withsong` (0不返回 1返回), `withtag` (0不返回 1返回)
**接口地址：** `/top/playlist`

### 主题歌单

说明 : 调用此接口 , 可获取主题歌单
**接口地址：** `/theme/playlist`

### 音效歌单

说明 : 调用此接口 , 可获取音效歌单
**可选参数：** `page`, `pagesize` (默认30)
**接口地址：** `/playlist/effect`

### 获取歌单详情

说明: 调用此接口 , 可获取歌单详细信息
**必选参数：** `ids` (歌单的 global_collection_id，可多个逗号分隔)
**接口地址：** `/playlist/detail`

### 获取歌单所有歌曲

说明 : 调用此接口，传入对应的歌单 global_collection_id，即可获得对应的所有歌曲
**必选参数：** `id`
**可选参数：** `page`, `pagesize` (默认30)
**接口地址：** `/playlist/track/all`

### 获取歌单所有歌曲(新版)

说明 : 调用此接口，传入对应的歌单 listid，即可获得对应的所有歌曲, 目前该接口仅支持 用户所创建及收藏的歌单
**必选参数：** `listid` (原文档写为lisdid)
**可选参数：** `page`, `pagesize` (默认30)
**接口地址：** `/playlist/track/all/new`

### 相似歌单

说明 : 调用此接口，根据歌单 id 获取相似歌单
**必选参数：** `ids` (global_collection_id，支持多个逗号分隔)
**接口地址：** `/playlist/similar`

### 获取主题歌单所有歌曲

**必选参数：** `theme_id`
**接口地址：** `/theme/playlist/track`

### 获取主题音乐

说明 : 调用此接口，可以获取主题音乐
**接口地址：** `/theme/music`

### 获取主题音乐详情

说明 : 调用此接口，传入对应的主题 id 可以获取主题音乐详情.
**必选参数：** `id`
**接口地址：** `/theme/music/detail`

### 歌曲推荐

说明 : 调用此接口，可以获取歌曲推荐.
**必选参数：** `card_id` (1精选好歌随心听 2经典怀旧金曲 3热门好歌精选 4小众宝藏佳作 5未知 6vip专属推荐)
**接口地址：** `/top/card`

### 歌曲推荐（概念版）

说明 : 调用此接口，可以获取歌曲推荐
**必选参数：** `card_id` (3006 VIP专属，3001 私人专属，3004 小众宝藏，3014 喜欢这首歌的TA也喜欢，3101 概念er新推，3005 潮流尝鲜)
**可选参数** `pagesize` (默认30)
**接口地址：** `/top/card/youth`

### 获取歌手和专辑图片

说明 : 调用此接口，可以获取歌手和专辑图片.
**必选参数：** `hash` (可多个逗号分开)
**可选参数：** `album_id`, `album_audio_id`, `count` (默认5)
**接口地址：** `/images`

### 获取歌手图片

说明 : 调用此接口，可以获取歌手图片.
**必选参数：** `hash` (可多个逗号分开)
**可选参数：** `audio_id`, `album_audio_id`, `filename`, `count` (默认5)
**接口地址：** `/images/audio`

### 获取音乐相关信息

说明：调用此接口，可以获取音乐相关信息
**必选参数：** `hash` (可多个逗号分开)
**接口地址：** `/audio`

### 获取更多音乐版本

说明：调用此接口，可以获取更多版本音乐
**必选参数：** `album_audio_id`
**可选参数：** `page`, `pagesize` (默认30), `show_type`, `sort` (all/hot/new), `type`, `show_detail` (0只返回总数)
**接口地址：** `/audio/related`

### 获取音乐伴奏信息

说明：调用此接口，可以获取最佳伴奏信息
**必选参数：** `hash`, `fileName`, `mixid`
**接口地址：** `/audio/accompany/matching`

### 获取音乐 K 歌数量

说明：调用此接口，可以获取音乐 K 歌数量，参数信息均来自获取音乐伴奏信息
**必选参数：** `songId`, `singerName`, `songHash`
**接口地址：** `/audio/ktv/total`

### 获取音乐详情

说明：调用此接口，可以获取音乐详情
**必选参数：** `hash` (可多个逗号分开)
**接口地址：** `/privilege/lite`

### 获取音乐专辑/歌手信息

说明：调用此接口，可以获取音乐专辑/歌手信息
**必选参数：** `album_audio_id` (可多个逗号分开)
**可选参数** `fields` (album_info, authors.base, base, audio_info, authors.ip, extra, tags, tagmap)
**接口地址：** `/krm/audio`

### 私人 FM(对应手机和 pc 端的猜你喜欢)

说明 : 私人 FM
**可选参数：** `hash`, `songid`, `playtime`, `mode` (normal发现/small小众/peak30s), `action` (play/garbage不喜欢), `song_pool_id` (0Alpha/1Beta/2Gamma), `is_overplay`, `remain_songcnt` (默认0，大于4不返回推荐)
**接口地址：** `/personal/fm`

### banner

说明 : 调用此接口 , 可获取 banner( 轮播图 ) 数据
**接口地址：** `/pc/diantai`

### 乐库 banner

说明 : 调用此接口 , 可获取 乐库 banner( 轮播图 ) 数据
**接口地址：** `/yueku/banner`

### 乐库电台

说明 : 调用此接口 , 可获取乐库电台数据
**接口地址：** `/yueku/fm`

### 乐库

说明 : 调用此接口 , 可获取手机端乐库数据
**接口地址：** `/yueku`

### 电台

说明 : 调用此接口 , 可获取所有电台数据
**接口地址：** `/fm/class`

### 电台 - 推荐

说明 : 调用此接口 , 可获取推荐电台
**接口地址：** `/fm/recommend`

### 电台 - 图片

说明 : 调用此接口 , 可获取对应电台的图片
**必选参数：** `fmid` (可多个逗号分割)
**接口地址：** `/fm/image`

### 电台 - 音乐列表

说明 : 调用此接口 , 可获取对应电台的音乐列表
**必选参数：** `fmid` (可多个逗号分割)
**可选参数：** `fmtype`, `fmoffset`, `fmsize`
**接口地址：** `/fm/songs`

### 编辑精选

说明 : 调用此接口 , 可获取编辑精选数据
**接口地址：** `/top/ip`

### 编辑精选数据

说明 : 调用此接口 , 可获取编辑对应数据
**必选参数：** `id`
**可选参数：** `type` (audios/albums/videos/author_list), `page`, `pagesize` (默认30)
**接口地址：** `/ip`

### 编辑精选歌单

说明：调用此接口，可获取编辑精选歌单数据
**必选参数：** `id`
**可选参数：** `page`, `pagesize` (默认30)
**接口地址：** `/ip/playlist`

### 编辑精选专区

说明：调用此接口，可获取编辑精选专区相关内容
**接口地址：** `/ip/zone`

### 编辑精选专区详情

说明：调用此接口，可获取编辑精选专区详情
**必选参数：** `id`
**接口地址：** `/ip/zone/home`

### 领取 VIP（需要登陆，该接口为测试接口,仅限概念版使用，该接口目前不可使用）

说明 : 调用此接口 , 每天可领取 1 天 VIP 时长，需要领取 8 次，每次增加 3 小时
**接口地址：** `/youth/vip`

### 领取一天 VIP（需要登陆，该接口为测试接口,仅限概念版使用）

说明 : 调用此接口 , 领取概念版 VIP，传入日期可领取改日期一天 VIP。注意：建议不要领太多天
**必选参数：** `receive_day` (格式为：2026-01-30)
**接口地址：** `/youth/day/vip`

### 升级概念版 VIP（需要登录，需要先领取一天 VIP，该接口为测试接口,仅限概念版使用）

说明 : 调用此接口 , 可以升级成畅听 VIP，该接口需要先领取一天 VIP
**接口地址：** `/youth/day/vip/upgrade`

### 获取当月已领取 VIP 天数（需要登陆，该接口为测试接口,仅限概念版使用）

说明 : 调用此接口 ,获取当月已领取 VIP 天数
**接口地址：** `/youth/month/vip/record`

### 获取已领取 VIP 状态（需要登陆，该接口为测试接口,仅限概念版使用）

说明 : 调用此接口 ,获取已领取 VIP 状态
**接口地址：** `/youth/union/vip`

### 获取歌手列表

说明 : 调用此接口，可以获取歌手列表.
**可选参数：** `sextypes` (0全部 1男 2女 3组合), `type` (0全部 1华语 2欧美 3日韩 4其他 5日本 6韩国), `musician` (3为音乐人 0默认), `hotsize` (默认30)
**接口地址：** `/artist/lists`

### 获取歌手详情

说明 : 调用此接口 , 传入歌手 id, 可获得歌手信息
**必选参数：** `id`
**接口地址：** `/artist/detail`

### 获取歌手专辑

说明 : 调用此接口 , 传入歌手 id, 可获得歌手专辑
**必选参数：** `id`
**可选参数：** `page`, `pagesize` (默认30), `sort` (hot热门 new最新)
**接口地址：** `/artist/albums`

### 获取歌手单曲

说明 : 调用此接口 , 传入歌手 id, 可获得歌手歌曲
**必选参数：** `id`
**可选参数：** `page`, `pagesize` (默认30), `sort` (hot热门 new最新)
**接口地址：** `/artist/audios`

### 获取歌手 MV

说明 : 调用此接口 , 传入歌手 id, 可获得歌手 MV
**必选参数：** `id`
**可选参数：** `page`, `pagesize` (默认30), `tag` (official官方/live现场/fan饭制/artist歌手发布/all全部)
**接口地址：** `/artist/videos`

### 关注歌手

说明：调用此接口, 传入歌手 id, 可以关注该歌手（需要登录）
**必选参数：** `id`
**接口地址：** `/artist/follow`

### 取消关注歌手

说明：调用此接口, 传入歌手 id, 可以取消关注该歌手（需要登录）
**必选参数：** `id`
**接口地址：** `/artist/unfollow`

### 获取关注歌手新歌

说明：调用此接口, 可以获取用户已关注的歌手新歌（需要登录）
**可选参数：** `last_album_id`, `pagesize` (默认30), `opt_sort` (1时间 2亲密度，默认1)
**接口地址：** `/artist/follow/newsongs`

### 获取视频 url

说明 : 传入的视频的 hash, 可以获取对应的视频的 url
**必选参数：** `hash`
**接口地址：** `/video/url`

### 获取歌曲 MV

说明 : 传入 album_audio_id/MixSongID 获取歌曲 相对应的 mv
**必选参数：** `album_audio_id` (可多个逗号分开)
**可选参数：** `fields` (mkv,tags,h264,h265,authors)
**接口地址：** `/kmr/audio/mv`

### 获取视频相关信息

说明 : 传入的视频的 hash, 可以获取对应的视频的相关信息
**必选参数：** `hash` (可多个逗号隔开)
**接口地址：** `/video/privilege`

### 获取视频详情

说明：调用此接口，可以获取视频详情，可以获取更高清的视频 hash
**必选参数：** `id`
**接口地址：** `/video/detail`

### 新歌速递

说明：调用此接口，可以获取新歌速递
**接口地址：** `/top/song`

### 场景音乐列表

说明：调用此接口，可以场景音乐列表
**接口地址：** `/scene/lists`

### 场景音乐详情

说明：调用此接口，可以场景音乐详情
**必选参数：** `id` (scene_id)
**接口地址：** `/scene/module`

### 获取场景音乐讨论区

说明：调用此接口，可以获取场景音乐讨论区
**必选参数** `id` (scene_id)
**可选参数：** `page`, `pagesize` (默认30), `sort` (rec推荐 hot热门 new最新，默认推荐)
**接口地址：** `/scene/list/v2`

### 获取场景音乐模块 Tag

说明：调用此接口，可以获取场景模块 Tag
**必选参数** `id` (scene_id), `module_id`
**接口地址：** `/scene/module/info`

### 获取场景音乐歌单列表

说明：调用此接口，可以获取场景音乐歌单列表
**必选参数** `tag_id`
**可选参数：** `page`, `pagesize` (默认30)
**接口地址：** `/scene/collection/list`

### 获取场景音乐视频列表

说明：调用此接口，可以获取场景音乐视频列表
**必选参数** `tag_id`
**可选参数：** `page`, `pagesize` (默认30)
**接口地址：** `/scene/video/list`

### 获取场景音乐音乐列表

说明：调用此接口，可以获取场景音乐音乐列表
**必选参数** `id` (scene_id), `module_id`, `tag`
**可选参数：** `page`, `pagesize` (默认30)
**接口地址：** `/scene/audio/list`

### 每日推荐

说明：调用此接口，可以获取每日推荐列表
**可选参数：** `platform` (默认ios，支持android和ios)
**接口地址：** `/everyday/recommend`

### 历史推荐

说明：调用此接口，可以获取历史推荐
**可选参数：** `mode` (list返回列表，song返回歌曲列表), `history_name` (mode为song时必选), `date` (mode为song时必选), `platform`
**接口地址：** `/everyday/history`

### 风格推荐

说明：调用此接口，可以获取风格推荐
**可选参数：** `platform`, `tagids` (支持多个逗号分隔)
**接口地址：** `/everyday/style/recommend`

### 排行列表

说明：调用此接口，可以获取排行榜列表
**可选参数：** `withsong` (是否返回歌曲部分)
**接口地址：** `/rank/list`

### 排行榜推荐列表

说明：调用此接口，可以获取排行榜推荐列表
**接口地址：** `/rank/top`

### 排行榜往期列表

说明：调用此接口，可以获取排行榜往期列表
**必选参数：** `rankid`
**可选参数：** `rank_cid`
**接口地址：** `/rank/vol`

### 排行榜信息

说明：调用此接口，可以获取排行榜信息
**必选参数：** `rankid`
**可选参数：** `rank_cid`, `album_img` (1返回 0不返回，默认返回), `zone`
**接口地址：** `/rank/info`

### 排行榜歌曲列表

说明：调用此接口，可以获排行榜歌曲列表
**必选参数：** `rankid`
**可选参数：** `rank_cid` (若需要返回往期歌曲列表，则该参数为必填), `page`, `pagesize` (默认30)
**接口地址：** `/rank/audio`

### 歌曲收藏数

说明 : 调用此接口 , 传入音乐 mixsongids 参数 , 可获得该音乐的收藏数( 不需要登录 )
**必选参数：** `mixsongids` (多个逗号分隔)
**接口地址：** `/favorite/count`

### 歌曲评论数

说明 : 调用此接口 , 传入音乐 hash/special_id 参数 , 可获得该音乐的评论数( 不需要登录 )
**必选参数：** `hash` 或 `special_id`
**接口地址：** `/comment/count`

### 歌曲评论

说明 : 调用此接口 , 传入音乐 mixsongid 参数 , 可获得该音乐的所有评论 ( 不需要登录 )
**必选参数：** `mixsongid`
**可选参数：** `page`, `pagesize` (默认30), `show_classify` (0不返回 1返回), `show_hotword_list` (0不返回 1返回)
**接口地址：** `/comment/music`

### 歌曲评论-根据分类返回

说明 : 调用此接口 , 传入音乐 mixsongid 和 type_id 参数 , 可获得该音乐的分类评论 ( 不需要登录 )
**必选参数：** `mixsongid`, `type_id`
**可选参数：** `page`, `pagesize` (默认30), `sort` (1正序 2倒序)
**接口地址：** `/comment/music/classify`

### 歌曲评论-根据热词返回

说明 : 调用此接口 , 传入音乐 mixsongid 和 hot_word 参数 , 可获得该音乐的热词评论 ( 不需要登录 )
**必选参数：** `mixsongid`, `hot_word`
**可选参数：** `page`, `pagesize` (默认30)
**接口地址：** `/comment/music/hotword`

### 楼层评论

说明 : 调用此接口 , 传入资源 special_id 和资源类型 tid 和资源 mixsongid 参数, 可获得该资源的歌曲楼层评论
**必选参数：** `special_id`, `mixsongid`, `tid`
**可选参数：** `page`, `pagesize` (默认30)
**接口地址：** `/comment/floor`

### 歌单评论

说明 : 调用此接口 , 传入歌单 id 参数 , 可获得该歌单的所有评论 ( 不需要登录 )
**必选参数：** `id` (global_collection_id)
**可选参数：** `page`, `pagesize` (默认30), `show_classify`, `show_hotword_list`
**接口地址：** `/comment/playlist`

### 专辑评论

说明 : 调用此接口 , 传入 专辑 id 参数 , 可获得该专辑的所有评论 ( 不需要登录 )
**必选参数：** `id`
**可选参数：** `page`, `pagesize` (默认30), `show_classify`, `show_hotword_list`
**接口地址：** `/comment/album`

### 歌曲曲谱

说明 : 调用此接口，传入歌曲 album_audio_id 可获得该歌曲的曲谱，注意：ai 曲谱为 xml 文件，需要自己解析
**必选参数：** `album_audio_id`
**可选参数：** `opern_type` (0全部 1钢琴 2吉他 3鼓 98简谱 99其他), `page`, `pagesize` (默认30)
**接口地址：** `/sheet/list`

### 曲谱详情

说明 : 调用此接口，传入曲谱 id 和 曲谱 source 可获得该曲谱详情，注意：ai 曲谱为 xml 文件
**必选参数：** `id`, `source`
**接口地址：** `/sheet/detail`

### 推荐曲谱

说明 : 调用此接口，可以获取推荐曲谱
**可选参数：** `opern_type` (1钢琴 2吉他 3鼓 98简谱 99其他)
**接口地址：** `/sheet/hot`

### 曲谱合集

说明 : 调用此接口，可以获取曲谱合集
**可选参数：** `position` (2精选谱单 3音乐教材 4古典钢琴)
**接口地址：** `/sheet/collection`

### 曲谱合集详情

说明 : 调用此接口，可以获取曲谱合集详情
**可选参数：** `collection_id`, `page`
**接口地址：** `/sheet/collection`

### 提交听歌历史

说明：提交听歌历史后，支持在其他设备上查看听歌历史
**必选参数：** `mxid` (专辑音乐 id)
**可选参数：** `ot` (当前时间戳, 秒级), `pc` (当前播放次数)
**接口地址：** `/playhistory/upload`

### 获取服务器时间

说明：获取服务器时间，返回服务器时间戳
**接口地址：** `/server/now`

### 刷刷

说明：获取刷刷视频
**接口地址：** `/brush`

### AI 推荐

说明：传入 album_audio_id/MixSongID 获取 AI 推荐歌曲
**必选参数：** `album_audio_id` (可多个逗号分开)
**接口地址：** `/ai/recommend`

### 频道 - 获取用户所有频道

说明：登录后调用此接口，可以获取用户所有订阅的频道
**可选参数：** `page`, `pagesize` (默认30)
**接口地址：** `/youth/channel/all`

### 频道 - 详情

说明：调用此接口，传入 global_collection_id / channel_id 可以获取频道详情
**必选参数：** `global_collection_id` (可多个逗号分开)
**接口地址：** `/youth/channel/detail`

### 频道 - 频道安利

说明：调用此接口，传入 global_collection_id / channel_id 可以获取频道安利
**必选参数：** `global_collection_id`
**接口地址：** `/youth/channel/amway`

### 频道 - 相似频道

说明：调用此接口，传入 global_collection_id / channel_id 可以获取相似频道
**必选参数：** `channel_id`
**接口地址：** `/youth/channel/similar`

### 频道 - 订阅

说明：登录后调用此接口， 传入 global_collection_id / channel_id 可订阅频道
**必选参数：** `global_collection_id`
**可选参数：** `t` (1订阅 0取消，默认订阅)
**接口地址：** `/youth/channel/sub`

### 频道 - 音乐故事

说明：调用此接口，传入 global_collection_id / channel_id 可以获取音乐故事
**必选参数：** `global_collection_id`
**可选参数：** `page`, `pagesize` (默认30)
**接口地址：** `/youth/channel/song`

### 频道 - 音乐故事详情

说明：调用此接口，传入 global_collection_id / channel_id 和 fileid 可以获取音乐故事详情
**必选参数：** `global_collection_id`, `fileid`
**接口地址：** `/youth/channel/song/detail`

### 动态 - 最常访问

说明：登录后调用此接口，可以获取经常访问的频道和用户
**接口地址：** `/youth/dynamic/recent`

### 获取用户公开的音乐

说明：调用此接口，可以获取用户公开的音乐
**必选参数：** `userid`
**可选参数：** `page`, `pagesize` (默认30)
**接口地址：** `/youth/user/song`

### 听书 - 每日推荐

**可选参数：** `page`, `pagesize` (默认30)
**接口地址：** `/longaudio/daily/recommend`

### 听书 - 排行榜推荐

**接口地址：** `/longaudio/rank/recommend`

### 听书 - VIP 推荐

**接口地址：** `/longaudio/vip/recommend`

### 听书 - 每周推荐

**接口地址：** `/longaudio/week/recommend`

### 听书 - 专辑详情

**必选参数：** `album_id` (可多个逗号分开)
**接口地址：** `/longaudio/album/detail`

### 听书 - 专辑音乐列表

**必选参数：** `album_id` (可多个)
**接口地址：** `/longaudio/album/audios`

### 歌曲详情 - 歌曲成绩单

说明：调用此接口，可以获取歌曲详情里面的歌曲成绩单信息
**必选参数：** `album_audio_id`
**接口地址：** `/song/ranking`

### 歌曲详情 - 歌曲成绩单详情

说明：登陆后调用此接口，可以获取更详细的歌曲成绩单信息
**必选参数：** `album_audio_id`
**可选参数：** `page`, `pagesize` (默认30)
**接口地址：** `/song/ranking/filter`

## License

The MIT License (MIT)
