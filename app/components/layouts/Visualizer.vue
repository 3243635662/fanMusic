<template>
  <div ref="containerRef" class="fixed inset-0 z-[-1] overflow-hidden pointer-events-none bg-[#050505]">
    <!-- Pixi canvas 降级兜底：如果 PixJS 初始化失败，至少显示渐变背景 -->
    <div class="absolute inset-0 bg-gradient-to-br from-[#0f1923] via-[#0a0f1a] to-[#050505] opacity-60"></div>
  </div>
</template>

<script setup lang="ts">
import { Application, Assets, Container, DisplacementFilter, Sprite } from 'pixi.js';
import { ShockwaveFilter } from 'pixi-filters';
import { useAppLoading } from '@/composables/useAppLoading';

const containerRef = useTemplateRef('containerRef')
const { initApp, globalApp, atmosphereLayer, mountCanvas } = usePixi()

let bgContainer: Container | null = null
let displacementFilter: DisplacementFilter | null = null
let displacementSprite: Sprite | null = null
let shockWaveFilter: ShockwaveFilter | null = null
let visualizerTickerFn: ((ticker: any) => void) | null = null

onMounted(async () => {
  if (!containerRef.value) return

  mountCanvas(containerRef.value)

  const app = await initApp({
    resizeTo: containerRef.value,
    backgroundAlpha: 0,
    antialias: true,
    isGlobal: true,
  })

  if (bgContainer && app.stage.children.includes(bgContainer)) {
    if (atmosphereLayer.value && !app.stage.children.includes(atmosphereLayer.value)) {
      app.stage.addChild(atmosphereLayer.value)
    }
    return
  }

  bgContainer = new Container()
  bgContainer!.label = 'BackgroundLayer'

  try {
    // 1. 先加载并渲染背景图（核心）
    const texture = await Assets.load('/background.jpg')
    const sprite = new Sprite(texture)
    sprite.anchor.set(0.5)

    const resizeBackground = () => {
      if (!app.renderer) return
      const scale = Math.max(app.screen.width / texture.width, app.screen.height / texture.height)
      sprite.scale.set(scale)
      sprite.x = app.screen.width / 2
      sprite.y = app.screen.height / 2
    }

    app.stage.addChildAt(bgContainer!, 0)
    bgContainer!.addChild(sprite)
    resizeBackground()
    window.addEventListener('resize', resizeBackground)
  } catch (err) {
    console.error('背景图加载失败，使用纯色兜底:', err)
    if (bgContainer) {
      app.stage.addChildAt(bgContainer!, 0)
    }
  }

  try {
    // 2. 滤镜独立加载，失败不影响背景显示
    const disTex = await Assets.load('/displacement_map.jpg')
    displacementSprite = new Sprite(disTex)
    displacementSprite.texture.source.addressMode = 'repeat'
    displacementSprite.width = app.screen.width
    displacementSprite.height = app.screen.height

    displacementFilter = new DisplacementFilter({
      sprite: displacementSprite,
      scale: { x: 50, y: 50 },
    })

    shockWaveFilter = new ShockwaveFilter({
      center: {
        x: Math.random() * app.screen.width,
        y: Math.random() * app.screen.height,
      },
      speed: 400,
      amplitude: 5,
      wavelength: 20,
      brightness: 1,
      radius: 400,
      time: 0,
    })

    bgContainer!.addChild(displacementSprite)
    bgContainer!.filters = [displacementFilter, shockWaveFilter]

    const shockwaveDuration = shockWaveFilter.radius / shockWaveFilter.speed

    const createNewWavePosition = () => {
      if (shockWaveFilter!.time > shockwaveDuration) {
        shockWaveFilter!.time = 0
        shockWaveFilter!.center = {
          x: Math.random() * app.screen.width,
          y: Math.random() * app.screen.height,
        }
      }
    }

    visualizerTickerFn = (ticker: any) => {
      if (!app.renderer || (app as any)._destroyed) return

      displacementSprite!.x += 1.5 * ticker.deltaTime
      displacementSprite!.y += 1.5 * ticker.deltaTime
      shockWaveFilter!.time += ticker.deltaTime / 60
      createNewWavePosition()
    }

    app.ticker.add(visualizerTickerFn)
  } catch (err) {
    console.warn('滤镜加载失败，背景将静态显示:', err)
  }

  if (atmosphereLayer.value && !app.stage.children.includes(atmosphereLayer.value)) {
    app.stage.addChild(atmosphereLayer.value)
  }

  setTimeout(() => {
    useAppLoading().value = false
  }, 100)
})
</script>
