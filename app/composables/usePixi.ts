import { Application, Container } from "pixi.js";

// 全局单例，确保整个 App 只有一个 WebGL 上下文，彻底解决 BindGroup 冲突
const globalApp = shallowRef<Application | null>(null);
const atmosphereLayer = shallowRef<Container | null>(null);

// 持久化 canvas：程序化创建，不依赖 Vue 模板生命周期，布局切换时不会销毁
let persistentCanvas: HTMLCanvasElement | null = null;

export const usePixi = () => {
  const pixiApp = shallowRef<Application | null>(null);

  /**
   * 获取持久化的 canvas 元素，如果不存在则创建
   * 该 canvas 独立于 Vue 组件生命周期，在布局切换时不会被销毁
   */
  const getPersistentCanvas = (): HTMLCanvasElement => {
    if (!persistentCanvas) {
      persistentCanvas = document.createElement('canvas');
      persistentCanvas.style.position = 'absolute';
      persistentCanvas.style.top = '0';
      persistentCanvas.style.left = '0';
      persistentCanvas.style.width = '100%';
      persistentCanvas.style.height = '100%';
    }
    return persistentCanvas;
  };

  /** 全局 App 是否已初始化 */
  const isGlobalReady = () => !!globalApp.value;

  /**
   * 将持久化 canvas 挂载到指定的 DOM 容器中
   * 如果 canvas 已在别处挂载，会自动移动到新容器
   */
  const mountCanvas = (container: HTMLElement) => {
    const canvas = getPersistentCanvas();
    if (canvas.parentElement && canvas.parentElement !== container) {
      canvas.parentElement.removeChild(canvas);
    }
    if (canvas.parentElement !== container) {
      container.appendChild(canvas);
    }
  };

  const initApp = async (option: any) => {
    // 如果是请求全局实例
    if (option.isGlobal) {
      // 已初始化：只需重新挂载 canvas 到新容器并 resize
      if (globalApp.value) {
        if (option.resizeTo) {
          mountCanvas(option.resizeTo);
          // 同步 renderer 的 resizeTo，确保后续 resize 事件正确响应
          (globalApp.value.renderer as any).resizeTo = option.resizeTo;
          globalApp.value.renderer.resize(option.resizeTo.clientWidth, option.resizeTo.clientHeight);
        }
        return globalApp.value;
      }

      // 首次初始化：使用持久化 canvas 代替模板 canvas
      const canvas = getPersistentCanvas();
      const app = new Application();
      await app.init({
        ...option,
        canvas,
      });
      globalApp.value = app;

      // 创建专门的特效层，但先不 addChild，由 Master (Visualizer) 控制层级顺序
      const layer = new Container();
      layer.label = 'AtmosphereLayer';
      atmosphereLayer.value = layer;

      return app;
    }

    // 局部实例 (如歌词页、播放器面板)
    const app = new Application();
    await app.init(option);
    pixiApp.value = app;
    return app;
  };

  const destroyApp = async () => {
    // 只销毁局部实例
    if (pixiApp.value) {
      // 关键：texture: false。这样局部组件销毁时只释放自己的资源，不会销毁全局纹理缓存
      // 否则全局背景的纹理会被误杀导致黑屏
      pixiApp.value.destroy(true, { children: true, texture: false });
      pixiApp.value = null;
    }
  };

  return {
    pixiApp,
    globalApp,
    atmosphereLayer,
    isGlobalReady,
    initApp,
    destroyApp,
    mountCanvas,
  };
};
