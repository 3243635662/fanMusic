// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ["@nuxt/ui", "@pinia/nuxt", "@pinia-plugin-persistedstate/nuxt"],
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  devServer: {
    port: 5173, // 将端口改为你想要的，例如 5173
  },
  css: ["@/assets/css/main.css"],
  runtimeConfig: {
    public: {
      apiKey: "",
      apiBearerToken: "",
    },
  },
  vite: {
    optimizeDeps: {
      include: ["@audius/sdk"],
    },
  },
  pinia: {
    storesDirs: ["./stores/**"],
  },
  piniaPersistedstate: {
    storage: "localStorage",
  },
});
