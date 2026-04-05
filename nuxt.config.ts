export default defineNuxtConfig({
  modules: [
    "@nuxt/ui",
    "@pinia/nuxt",
    "@pinia-plugin-persistedstate/nuxt",
    "@nuxt/image",
  ],
  future: {
    compatibilityVersion: 4, // 开启 Nuxt 4 模式
  },
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  devServer: {
    port: 5173, // 将端口改为你想要的，例如 5173
  },
  css: ["@/assets/css/main.css"],
  runtimeConfig: {
    api: {
      kugouApiSource: "",
    },
  },
  pinia: {
    storesDirs: ["./stores/**"],
  },
  piniaPersistedstate: {
    storage: "localStorage",
  },
  app: {
    pageTransition: { name: "switch", mode: "out-in" },
  },
  vite: {
    optimizeDeps: {
      include: ["@vueuse/core", "pixi-filters", "pixi.js"],
    },
  },
});