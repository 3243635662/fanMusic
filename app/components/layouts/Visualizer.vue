<template>
  <div ref="containerRef" class="fixed inset-0 z-0 overflow-hidden pointer-events-none">
    <canvas ref="canvasRef" />
  </div>
</template>

<script setup lang="ts">
import { ShockwaveFilter } from 'pixi-filters';
import { Application, Assets, Container, DisplacementFilter, Sprite, type Filter } from 'pixi.js';
import { useAppLoading } from '@/composables/useAppLoading';

const canvasRef = useTemplateRef('canvasRef')
const containerRef = useTemplateRef('containerRef')
const { initApp, destroyApp } = usePixi()

let resizeHandler: (() => void) | null = null
let clickHandler: (() => void) | null = null

const activeWaves = ref<ShockwaveFilter[]>([])

// 创建新震波函数
const createNewWave = (app: Application, x?: number, y?: number) => {
  const wave = new ShockwaveFilter({
    center: {
      x: x !== undefined ? x : Math.random() * app.screen.width,
      y: y !== undefined ? y : Math.random() * app.screen.height,
    },
    speed: 400 + Math.random() * 200, // 增加速度变化
    amplitude: 8, // 增加振幅
    wavelength: 20 + Math.random() * 10, // 增加波长变化
    brightness: 1.05,
    radius: 300 + Math.random() * 200, // 增加半径变化
    time: 0,
  })
  return wave
}

onUnmounted(() => {
  if (resizeHandler) window.removeEventListener('resize', resizeHandler)
  if (clickHandler) window.removeEventListener('click', clickHandler)

  destroyApp()
})

onMounted(async () => {
  if (!canvasRef.value || !containerRef.value) return

  const app = await initApp({
    canvas: canvasRef.value,
    resizeTo: containerRef.value,
    backgroundAlpha: 0,
  })
  const container = new Container()

  try {
    const texture = await Assets.load('/background.jpg')
    const sprite = new Sprite(texture)
    let displacementSprite: Sprite | null = null

    sprite.anchor.set(0.5, 0.5)


    // 背景缩放工具函数
    const resizeBackground = () => {
      // 强制重设 renderer 尺寸以应对浏览器底部折叠等异步尺寸变化
      if(app && app.renderer) {
        app.resize()
      }

      const screenWidth = app.screen.width
      const screenHeight = app.screen.height
      const textureWidth = texture.width
      const textureHeight = texture.height

      const scale = Math.max(screenWidth / textureWidth, screenHeight / textureHeight)
      sprite.scale.set(scale)
      sprite.x = screenWidth / 2
      sprite.y = screenHeight / 2

      if (displacementSprite) {
        displacementSprite.width = screenWidth
        displacementSprite.height = screenHeight
      }
    }

    resizeBackground()

    // 滤波涟漪
    const displacementTexture = await Assets.load('https://cdn.pixelpunk.cc/f/f4dce9a410e043c9/image.png')
    displacementSprite = new Sprite(displacementTexture)
    displacementSprite.texture.source.addressMode = 'repeat'
    displacementSprite.width = app.screen.width
    displacementSprite.height = app.screen.height
    const displacementFilter = new DisplacementFilter({
      sprite: displacementSprite,
      scale: { x: 50, y: 50 },
    })
    displacementFilter.blendMode = 'screen'
    container.filters = [displacementFilter]
    app.stage.addChild(container)
    container.addChild(sprite)
    container.addChild(displacementSprite)

    // 一开始创建许多波纹
    const initialWaveCount = 12
    for (let i = 0; i < initialWaveCount; i++) {
      const wave = createNewWave(app)

      wave.time = Math.random() * (wave.radius / wave.speed) * 0.8
      activeWaves.value.push(wave)
    }

    // 所有视觉资源和滤镜完全就位，关闭加载屏
    setTimeout(() => {
      const appLoading = useAppLoading()
      appLoading.value = false
    }, 100)

    app.ticker.add((ticker) => {
      displacementSprite.x += 1.3
      displacementSprite.y += 1.3

      if (Math.random() < 0.008 && activeWaves.value.length < 15) {
        activeWaves.value.push(createNewWave(app))
      }

      for (let i = activeWaves.value.length - 1; i >= 0; i--) {
        const wave = activeWaves.value[i]
        if (wave) {
          wave.time += ticker.deltaTime / 60
          const duration = wave.radius / wave.speed

          if (wave.time > duration) {
            activeWaves.value.splice(i, 1)
          }
        }
      }
      container.filters = [displacementFilter, ...activeWaves.value] as any[]
    })

    // 监听窗口调整
    resizeHandler = resizeBackground
    window.addEventListener('resize', resizeHandler)
  } catch (err) {
    console.error('Visualizer error:', err)
  }
})
</script>