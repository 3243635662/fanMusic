<script setup lang="ts">
import { useUserStore } from "@/stores/user";
const toast = useToast()
const userStore = useUserStore();
const mobile = ref("");
const code = ref("");
const loading = ref(false);
const sendingCode = ref(false);
const countdown = ref(0);
let timer: any = null;

// 发送验证码
const sendOtp = async () => {
  if (!mobile.value || !/^1[3-9]\d{9}$/.test(mobile.value)) {
    toast.add({
      icon: 'i-solar:close-circle-bold',
      title: '错误',
      description: '请输入正确的手机号',
      color: 'error',
    })
    return;
  }

  sendingCode.value = true;
  try {
    const res: any = await $fetch("/api/auth/send-code", {
      method: "POST",
      body: { mobile: mobile.value },
    });

    if (res.status === 1) {
      toast.add({
        icon: 'i-solar:check-circle-bold',
        title: '成功',
        description: '验证码已发送，请查收',
        color: 'success',
      })
      startCountdown();
    } else {
      toast.add({
        icon: 'i-solar:close-circle-bold',
        title: '错误',
        description: res.msg || "获取验证码失败",
        color: 'error',
      })
    }
  } catch (error: any) {
    toast.add({
      icon: 'i-solar:close-circle-bold',
      title: '错误',
      description: error.statusMessage || "验证码发送异常",
      color: 'error',
    })
  } finally {
    sendingCode.value = false;
  }
};

// 倒计时逻辑
const startCountdown = () => {
  countdown.value = 60;
  if (timer) clearInterval(timer);
  timer = setInterval(() => {
    if (countdown.value > 0) {
      countdown.value--;
    } else {
      clearInterval(timer);
    }
  }, 1000);
};

// 登录逻辑
const handleLogin = async () => {
  if (!mobile.value || !code.value) {
    toast.add({
      icon: 'i-solar:close-circle-bold',
      title: '错误',
      description: '请完善登录信息',
      color: 'error',
    })
    return;
  }

  loading.value = true;
  try {
    const res: any = await $fetch("/api/auth/login", {
      method: "POST",
      body: { mobile: mobile.value, code: code.value },
    });

    if (res.status === 1 || res.data?.token) {
      // 这里的 API 可能会把关键结果放在 data 里或根目录
      userStore.loginSuccess(res);

      toast.add({
        icon: 'i-solar:check-circle-bold',
        title: '成功',
        description: '登录成功，正在跳转...',
        color: 'success',
      })
      setTimeout(() => navigateTo("/"), 1000);
    } else {
      toast.add({
        icon: 'i-solar:close-circle-bold',
        title: '错误',
        description: res.msg || "登录失败，请核对验证码",
        color: 'error',
      })
    }
  } catch (error: any) {
    toast.add({
      icon: 'i-solar:close-circle-bold',
      title: '错误',
      description: error.statusMessage || "登录操作异常",
      color: 'error',
    })
  } finally {
    loading.value = false;
  }
};

onUnmounted(() => {
  if (timer) clearInterval(timer);
});
</script>

<template>
  <div
    class="login-page-wrapper min-h-screen bg-[#050505] flex items-center justify-center p-6 relative overflow-hidden">
    <div
      class="glass-panel w-full max-w-md p-10 rounded-[2.5rem] border border-white/10 shadow-2xl backdrop-blur-3xl bg-neutral-900/60 relative z-10 overflow-hidden">
      <!-- 内部光影 -->
      <div class="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-transparent via-white/20 to-transparent"></div>

      <!-- 登录表单内容 -->
      <div v-if="!userStore.isLogin">
        <div class="text-center mb-12 relative">
          <div class="inline-block p-4 rounded-2xl bg-primary/10 mb-6 ring-1 ring-primary/20">
            <UIcon name="material-symbols:music-note-rounded" class="w-10 h-10 text-primary" />
          </div>
          <h3 class="text-4xl font-black text-white mb-3 tracking-tighter">
            酷狗<span class="text-primary italic">概念版</span>
          </h3>
          <p class="text-white/40 text-sm font-medium tracking-wide">验证码登录 · 开启极致听感</p>
        </div>

        <div class="space-y-7">
          <!-- 手机号输入 -->
          <div class="space-y-3">
            <label class="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] px-1">Mobile Number</label>
            <div class="relative group">
              <div
                class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/20 group-focus-within:text-primary transition-all duration-300">
                <UIcon name="material-symbols:smartphone-rounded" class="w-5 h-5" />
              </div>
              <input v-model="mobile" type="tel" maxlength="11" placeholder="请输入 11 位手机号"
                class="w-full bg-black/40 border border-white/5 focus:border-primary/50 focus:bg-black/60 rounded-2xl py-4.5 pl-12 pr-4 text-white placeholder:text-white/20 outline-none transition-all duration-500 ring-0 focus:ring-4 focus:ring-primary/10" />
            </div>
          </div>

          <!-- 验证码输入 -->
          <div class="space-y-3">
            <label class="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] px-1">Verification
              Code</label>
            <div class="flex gap-3">
              <div class="relative flex-1 group">
                <div
                  class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/20 group-focus-within:text-primary transition-all duration-300">
                  <UIcon name="material-symbols:lock-person-rounded" class="w-5 h-5" />
                </div>
                <input v-model="code" type="text" maxlength="6" placeholder="6位验证码"
                  class="w-full bg-black/40 border border-white/5 focus:border-primary/50 focus:bg-black/60 rounded-2xl py-4.5 pl-12 pr-4 text-white placeholder:text-white/20 outline-none transition-all duration-500 ring-0 focus:ring-4 focus:ring-primary/10 font-mono tracking-[0.3em]" />
              </div>
              <button @click="sendOtp" :disabled="sendingCode || countdown > 0"
                class="rounded-2xl px-6 font-bold text-sm bg-white/5 border border-white/10 text-white hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 flex items-center justify-center min-w-[120px]">
                {{ countdown > 0 ? `${countdown}s` : '获取验证码' }}
              </button>
            </div>
          </div>

          <!-- 登录按钮 -->
          <div class="pt-4">
            <button @click="handleLogin" :disabled="loading"
              class="w-full bg-primary hover:bg-primary-hover text-white rounded-2xl py-4.5 font-bold text-lg shadow-2xl shadow-primary/20 transition-all duration-500 flex items-center justify-center gap-2 group relative overflow-hidden"
              :class="{ 'opacity-80 active:scale-95': !loading, 'cursor-wait': loading }">
              <div v-if="loading" class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin">
              </div>
              <span v-else class="relative z-10">立即登录</span>
              <div
                class="absolute inset-0 bg-linear-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer">
              </div>
            </button>
          </div>

          <NuxtLink to="/"
            class="block text-center text-white/20 hover:text-white/40 text-sm transition-all duration-300 font-medium py-2">
            暂不登录，返回首页
          </NuxtLink>
        </div>

        <!-- 底部协议 -->
        <div class="mt-12 text-center border-t border-white/5 pt-8">
          <p class="text-[11px] text-white/20 leading-relaxed tracking-wide">
            登录即代表你同意并接受<br />
            <a href="#" class="text-white/40 hover:text-primary transition-colors duration-300">《服务协议》</a>
            <span class="mx-1">与</span>
            <a href="#" class="text-white/40 hover:text-primary transition-colors duration-300">《隐私政策》</a>
          </p>
        </div>
      </div>

      <!-- 已登录状态内容 -->
      <div v-else class="flex flex-col items-center py-4">
        <div class="relative mb-8">
          <div
            class="w-24 h-24 rounded-full p-1 bg-linear-to-tr from-primary to-purple-500 shadow-2xl shadow-primary/30">
            <img v-if="userStore.userInfo?.pic" :src="userStore.userInfo.pic" alt="Avatar"
              class="w-full h-full rounded-full object-cover border-4 border-black/20" />
            <div v-else
              class="w-full h-full rounded-full bg-neutral-800 flex items-center justify-center border-4 border-black/20">
              <UIcon name="material-symbols:person-rounded" class="w-12 h-12 text-white/20" />
            </div>
          </div>
          <div class="absolute -bottom-1 -right-1 bg-primary p-1.5 rounded-full border-2 border-neutral-900 shadow-lg">
            <UIcon name="material-symbols:check-circle-rounded" class="w-4 h-4 text-white" />
          </div>
        </div>

        <div class="text-center mb-10">
          <h3 class="text-3xl font-black text-white mb-2 tracking-tight">欢迎回来</h3>
          <p class="text-white font-bold text-xl mb-1">{{ userStore.userInfo?.nickname || '听歌爱好者' }}</p>
          <p class="text-white/40 text-sm font-medium">账户：{{ userStore.userInfo?.mobile || '手机登录用户' }}</p>
        </div>

        <div class="w-full space-y-4">
          <button @click="navigateTo('/')"
            class="w-full bg-primary hover:bg-primary-hover text-white rounded-2xl py-4.5 font-bold text-base shadow-xl shadow-primary/20 transition-all active:scale-95">
            进入首页
          </button>

          <button @click="userStore.logout()"
            class="w-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white rounded-2xl py-4 font-bold text-sm border border-white/5 hover:border-white/10 transition-all active:scale-95">
            退出登录
          </button>
        </div>

        <div class="mt-12 text-[9px] font-black text-white/10 uppercase tracking-[0.3em]">
          Authenticated Session
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.glass-panel {
  box-shadow:
    0 40px 100px -20px rgba(0, 0, 0, 0.8),
    inset 0 1px 1px rgba(255, 255, 255, 0.05);
}

.animate-shimmer {
  animation: shimmer 2s infinite;
}

@keyframes shimmer {
  100% {
    transform: translateX(100%);
  }
}

.bg-primary-hover {
  background-color: rgb(var(--color-primary-600));
}

input::placeholder {
  font-family: sans-serif;
  letter-spacing: normal;
}
</style>
