// store/user.ts
import { defineStore } from "pinia";
import { type ApiResponse } from "#shared/types/api";
export const useUserStore = defineStore(
  "user",
  () => {
    const isLogin = ref(false);
    const userInfo = ref<any>(null);
    const token = ref<string | null>(null);

    const kugouCookie = useCookie("kugou_cookie", {
      maxAge: 60 * 60 * 12,
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

    const refreshTokenAction = async () => {
      if (!token.value || !userInfo.value?.userid) {
        throw new Error("您还未登录！");
      }
      try {
        const res:any = await $fetch("/api/auth/refresh", {
          query: {
            token: token.value,
            userid: userInfo.value.userid,
          },
        });
        if (res.code === 0) {
          kugouCookie.value = encodeURIComponent(res.result.superCookie);
          if (res.result.token) {
            token.value = res.result.token;
          }
        } else {
        }
      } catch (err) {
        console.error("自动续期失败", err);
      }
    };

    return {
      isLogin,
      userInfo,
      token,
      kugouCookie,
      loginSuccess,
      logout,
      refreshTokenAction,
    };
  },
  {
    persist: {
      key: "fan-music:user_state",
      pick: ["isLogin", "userInfo", "token"], // 只持久化这三个状态到 localStorage
    },
  },
);
