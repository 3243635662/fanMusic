<template>
  <ClientOnly>
    <UModal
      v-model:open="isOpen"
      title="账号登录"
      description="验证码登录，开启极致听感"
      :ui="{
        overlay: 'bg-gray-900/50 backdrop-blur-sm',
        content:
          'bg-zinc-100/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-white/20 shadow-2xl',
      }"
    >
      <template #body>
        <!-- 未登录：登录表单 -->
        <div v-if="!userStore.isLogin" class="space-y-8">
          <!-- 头部品牌 -->
          <div class="text-center pt-2 pb-1">
            <div class="inline-flex p-4 rounded-[1.25rem] bg-primary/10 mb-5 ring-1 ring-primary/20 shadow-lg shadow-primary/5">
              <UIcon name="material-symbols:music-note-rounded" class="w-9 h-9 text-primary" />
            </div>
            <h3 class="text-[1.65rem] font-black text-zinc-800 dark:text-white tracking-tighter leading-tight">
              酷狗<span class="text-primary italic">概念版</span>
            </h3>
            <p class="text-zinc-400 dark:text-white/30 text-xs font-medium mt-1.5 tracking-wide">验证码登录 · 开启极致听感</p>
          </div>

          <!-- 手机号 -->
          <div class="space-y-2.5">
            <label class="text-[10px] font-bold text-zinc-400 dark:text-white/25 uppercase tracking-[0.2em] px-0.5">
              Mobile Number
            </label>
            <div class="relative group">
              <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-300 dark:text-white/20 group-focus-within:text-primary transition-colors duration-300">
                <UIcon name="lucide:smartphone" class="w-[18px] h-[18px]" />
              </div>
              <input
                v-model="mobile"
                type="tel"
                maxlength="11"
                placeholder="请输入 11 位手机号"
                class="login-input w-full bg-white/60 dark:bg-white/[0.04] border border-zinc-200 dark:border-white/[0.08] focus:border-primary/50 dark:focus:border-primary/40 focus:bg-white dark:focus:bg-white/[0.06] rounded-2xl py-3.5 pl-11 pr-4 text-zinc-800 dark:text-white/90 placeholder:text-zinc-300 dark:placeholder:text-white/20 outline-none transition-all duration-300"
              />
            </div>
          </div>

          <!-- 验证码 -->
          <div class="space-y-2.5">
            <label class="text-[10px] font-bold text-zinc-400 dark:text-white/25 uppercase tracking-[0.2em] px-0.5">
              Verification Code
            </label>
            <div class="flex gap-2.5">
              <div class="relative flex-1 group">
                <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-300 dark:text-white/20 group-focus-within:text-primary transition-colors duration-300">
                  <UIcon name="lucide:lock-keyhole" class="w-[18px] h-[18px]" />
                </div>
                <input
                  v-model="code"
                  type="text"
                  maxlength="6"
                  placeholder="6 位验证码"
                  class="login-input w-full bg-white/60 dark:bg-white/[0.04] border border-zinc-200 dark:border-white/[0.08] focus:border-primary/50 dark:focus:border-primary/40 focus:bg-white dark:focus:bg-white/[0.06] rounded-2xl py-3.5 pl-11 pr-4 text-zinc-800 dark:text-white/90 placeholder:text-zinc-300 dark:placeholder:text-white/20 outline-none transition-all duration-300 font-mono tracking-[0.25em]"
                />
              </div>
              <button
                :disabled="sendingCode || countdown > 0"
                class="rounded-2xl px-5 py-3.5 font-medium text-sm whitespace-nowrap flex items-center justify-center min-w-[112px] transition-all duration-300 disabled:cursor-not-allowed"
                :class="countdown > 0
                  ? 'bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-zinc-400 dark:text-white/30'
                  : sendingCode
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                    : 'bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500 hover:text-white hover:border-emerald-500 active:scale-[0.97]'"
                @click="sendOtp"
              >
                <svg v-if="countdown > 0" class="w-4 h-4 mr-1.5 -rotate-90" viewBox="0 0 36 36" fill="none">
                  <circle cx="18" cy="18" r="15" stroke="currentColor" stroke-width="2.5" opacity="0.2" />
                  <circle cx="18" cy="18" r="15" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"
                    :stroke-dasharray="`${(countdown / 60) * 94.25} 94.25`" />
                </svg>
                <UIcon v-else-if="sendingCode" name="lucide:loader-2" class="w-4 h-4 mr-1.5 animate-spin" />
                <UIcon v-else name="lucide:mail" class="w-4 h-4 mr-1.5" />
                {{ countdown > 0 ? `${countdown}s` : sendingCode ? '发送中' : '获取验证码' }}
              </button>
            </div>
          </div>

          <!-- 登录按钮 -->
          <div class="pt-1">
            <button
              :disabled="loading"
              class="w-full bg-primary hover:brightness-110 text-white rounded-2xl py-4 font-bold text-[0.95rem] shadow-xl shadow-primary/25 transition-all duration-300 flex items-center justify-center gap-2 group relative overflow-hidden disabled:opacity-80"
              :class="loading ? 'cursor-wait' : 'active:scale-[0.98]'"
              @click="handleLogin"
            >
              <UIcon v-if="loading" name="material-symbols:progress-activity" class="w-5 h-5 animate-spin" />
              <span v-else>立即登录</span>
              <div class="absolute inset-0 bg-linear-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.8s_infinite]"></div>
            </button>
          </div>

          <p class="text-center text-[11px] text-zinc-400 dark:text-white/15 leading-relaxed tracking-wide">
            登录即代表你同意并接受
            <a href="#" class="text-zinc-500 dark:text-white/25 hover:text-primary transition-colors duration-300">《服务协议》</a>
            与
            <a href="#" class="text-zinc-500 dark:text-white/25 hover:text-primary transition-colors duration-300">《隐私政策》</a>
          </p>
        </div>

        <!-- 已登录：用户信息 -->
        <div v-else class="flex flex-col items-center py-8 space-y-6">
          <div class="relative">
            <div class="w-20 h-20 rounded-full p-0.5 bg-gradient-to-tr from-primary to-purple-500 shadow-xl shadow-primary/20">
              <NuxtImg v-if="userStore.userInfo?.pic" :src="userStore.userInfo.pic" alt="Avatar"
                class="w-full h-full rounded-full object-cover border-3 border-white/10 dark:border-black/20" />
              <div v-else
                class="w-full h-full rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center border-3 border-white/10 dark:border-black/20">
                <UIcon :name="useIcon('user')" class="w-10 h-10 text-zinc-400 dark:text-white/20" />
              </div>
            </div>
            <div class="absolute -bottom-1 -right-1 bg-primary p-1 rounded-full border-2 border-zinc-100 dark:border-zinc-800 shadow-md">
              <UIcon :name="useIcon('success')" class="w-3.5 h-3.5 text-white" />
            </div>
          </div>

          <div class="text-center">
            <h3 class="text-xl font-bold text-zinc-800 dark:text-white mb-1">
              {{ userStore.userInfo?.nickname || '听歌爱好者' }}
            </h3>
            <p class="text-zinc-500 dark:text-white/40 text-sm">
              {{ userStore.userInfo?.mobile || '手机登录用户' }}
            </p>
          </div>

          <div class="w-full space-y-2.5 pt-2">
            <button
              class="w-full bg-primary hover:brightness-110 text-white rounded-2xl py-3.5 font-bold text-[0.9rem] shadow-lg shadow-primary/20 transition-all duration-300 active:scale-[0.98]"
              @click="isOpen = false"
            >
              返回
            </button>
            <button
              class="w-full bg-white/50 dark:bg-white/[0.04] hover:bg-white dark:hover:bg-white/[0.07] text-zinc-500 dark:text-white/40 hover:text-zinc-700 dark:hover:text-white/70 rounded-2xl py-3 font-semibold text-sm border border-zinc-200/60 dark:border-white/[0.06] transition-all duration-300 active:scale-[0.98]"
              @click="handleLogout"
            >
              退出登录
            </button>
          </div>
        </div>
      </template>
    </UModal>
  </ClientOnly>
</template>

<script lang="ts" setup>
const toast = useToast()
const userStore = useUserStore()
const settingsStore = useSettingsStore()

const { showLoginModal } = storeToRefs(settingsStore)

const isOpen = computed({
  get: () => showLoginModal.value,
  set: (val) => { showLoginModal.value = val },
})

const mobile = ref("")
const code = ref("")
const loading = ref(false)
const sendingCode = ref(false)
const countdown = ref(0)
let timer: any = null

const sendOtp = async () => {
  if (!mobile.value || !/^1[3-9]\d{9}$/.test(mobile.value)) {
    toast.add({
      icon: useIcon('error'),
      title: '错误',
      description: '请输入正确的手机号',
      color: 'error',
    })
    return
  }

  sendingCode.value = true
  try {
    const res: any = await $fetch("/api/auth/send-code", {
      method: "POST",
      body: { mobile: mobile.value },
    })

    if (res.status === 1) {
      toast.add({
        icon: useIcon('success'),
        title: '成功',
        description: '验证码已发送，请查收',
        color: 'success',
      })
      startCountdown()
    } else {
      toast.add({
        icon: useIcon('error'),
        title: '错误',
        description: res.msg || "获取验证码失败",
        color: 'error',
      })
    }
  } catch (error: any) {
    toast.add({
      icon: useIcon('error'),
      title: '错误',
      description: error.statusMessage || "验证码发送异常",
      color: 'error',
    })
  } finally {
    sendingCode.value = false
  }
}

const startCountdown = () => {
  countdown.value = 60
  if (timer) clearInterval(timer)
  timer = setInterval(() => {
    if (countdown.value > 0) {
      countdown.value--
    } else {
      clearInterval(timer)
    }
  }, 1000)
}

const handleLogin = async () => {
  if (!mobile.value || !code.value) {
    toast.add({
      icon: useIcon('error'),
      title: '错误',
      description: '请完善登录信息',
      color: 'error',
    })
    return
  }

  loading.value = true
  try {
    const res: any = await $fetch("/api/auth/login", {
      method: "POST",
      body: { mobile: mobile.value, code: code.value },
    })

    if (res.status === 1 || res.data?.token) {
      userStore.loginSuccess(res)

      toast.add({
        icon: useIcon('success'),
        title: '成功',
        description: '登录成功，欢迎回来！',
        color: 'success',
      })

      isOpen.value = false
      mobile.value = ""
      code.value = ""
    } else {
      toast.add({
        icon: useIcon('error'),
        title: '错误',
        description: res.msg || "登录失败，请核对验证码",
        color: 'error',
      })
    }
  } catch (error: any) {
    toast.add({
      icon: useIcon('error'),
      title: '错误',
      description: error.statusMessage || "登录操作异常",
      color: 'error',
    })
  } finally {
    loading.value = false
  }
}

const handleLogout = () => {
  userStore.logout()
  isOpen.value = false
  toast.add({
    icon: useIcon('success'),
    title: '已退出',
    description: '您已成功退出登录',
    color: 'success',
  })
}

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<style scoped>
.login-input {
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}

.login-input:focus {
  box-shadow: 0 0 0 3px rgba(var(--color-primary-500), 0.1), 0 1px 2px rgba(0, 0, 0, 0.04);
}

input::placeholder {
  font-family: system-ui, sans-serif;
  letter-spacing: normal;
}
</style>
