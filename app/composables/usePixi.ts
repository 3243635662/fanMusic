import { Application } from "pixi.js";
const pixiApp = shallowRef<Application | null>(null);

export const usePixi = () => {
  const initApp = async (option: any) => {
    if (pixiApp.value) return pixiApp.value;
    const app = new Application();
    await app.init(option);
    pixiApp.value = app;
    return app;
  };

  const destroyApp = async () => {
    if (pixiApp.value) {
      pixiApp.value.destroy(true, { children: true, texture: true });
      pixiApp.value = null;
    }
  };

  return {
    pixiApp,
    initApp,
    destroyApp,
  };
};
