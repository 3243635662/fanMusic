// store/user.ts
import { defineStore } from "pinia";

export const useUserStore = defineStore(
  "user",
  () => {
    const isLogin = ref(false);
    const userInfo = ref<any>(null);
    const token = ref<string | null>(null);

    const kugouCookie = useCookie("kugou_cookie", {
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
      watch: true, // 关键：确保状态改变时立即同步到浏览器
      sameSite: "lax",
    });

    const loginSuccess = (loginData: any) => {
      isLogin.value = true;
      userInfo.value = loginData.data;
      token.value = loginData.token;
      // 存储缝合好的超级字符串，需要 encode 避免分号截断
      kugouCookie.value = encodeURIComponent(loginData.superCookie);
    };

    const logout = () => {
      isLogin.value = false;
      userInfo.value = null;
      token.value = null;
      kugouCookie.value = null;
      navigateTo("/login");
    };

    return { isLogin, userInfo, token, kugouCookie, loginSuccess, logout };
  },
  {
    // 修正这里：将 paths 改为 pick
    persist: {
      key: "fan-music:user_state",
      pick: ["isLogin", "userInfo", "token"], // 只持久化这三个状态到 localStorage
    },
  },
);
