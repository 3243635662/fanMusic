<template>
  <div ref="containerRef" class="fixed inset-0 z-[-1] overflow-hidden pointer-events-none bg-[#050505]"></div>
</template>

<script setup lang="ts">
import { Application, Assets, Container, DisplacementFilter, Sprite } from 'pixi.js';
import { ShockwaveFilter } from 'pixi-filters';
import { useAppLoading } from '@/composables/useAppLoading';

const containerRef = useTemplateRef('containerRef')
const { initApp, globalApp, atmosphereLayer, mountCanvas } = usePixi()

// 滤镜实例引用，模块级持久化，不会随组件重建
let bgContainer: Container | null = null
let displacementFilter: DisplacementFilter | null = null
let displacementSprite: Sprite | null = null
let shockWaveFilter: ShockwaveFilter | null = null
let visualizerTickerFn: ((ticker: any) => void) | null = null

onMounted(async () => {
  if (!containerRef.value) return

  // 将持久化 canvas 挂载到当前容器
  mountCanvas(containerRef.value)

  const app = await initApp({
    resizeTo: containerRef.value,
    backgroundAlpha: 0,
    antialias: true,
    isGlobal: true,
  })

  // 已初始化过（布局切换后重新挂载），只需恢复特效层级
  if (bgContainer && app.stage.children.includes(bgContainer)) {
    if (atmosphereLayer.value && !app.stage.children.includes(atmosphereLayer.value)) {
      app.stage.addChild(atmosphereLayer.value)
    }
    return
  }

  bgContainer = new Container()
  bgContainer!.label = 'BackgroundLayer'

  try {
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

    // 水波纹位移滤镜
    const disTex = await Assets.load('https://pixijs.com/assets/pixi-filters/displacement_map_repeat.jpg')
    displacementSprite = new Sprite(disTex)
    displacementSprite.texture.source.addressMode = 'repeat'
    displacementSprite.width = app.screen.width
    displacementSprite.height = app.screen.height

    displacementFilter = new DisplacementFilter({
      sprite: displacementSprite,
      scale: { x: 50, y: 50 },
    })

    // 震波滤镜
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

    // 确保特效层也在 stage 中
    if (atmosphereLayer.value && !app.stage.children.includes(atmosphereLayer.value)) {
      app.stage.addChild(atmosphereLayer.value)
    }

    setTimeout(() => {
      useAppLoading().value = false
    }, 100)

  } catch (err) {
    console.error('Visualizer error:', err)
  }
})
</script>
