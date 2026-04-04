<template>
  <div ref="containerRef" class="fixed inset-0 z-0 overflow-hidden pointer-events-none">
    <canvas ref="canvasRef" />
  </div>
</template>

<script setup lang="ts">
import { ShockwaveFilter } from 'pixi-filters';
import { Assets, Container, DisplacementFilter, Sprite } from 'pixi.js';

const canvasRef = useTemplateRef('canvasRef')
const containerRef = useTemplateRef('containerRef')
const { initApp, destroyApp } = usePixi()

let resizeHandler: (() => void) | null = null

onUnmounted(() => {
  if (resizeHandler) {
    window.removeEventListener('resize', resizeHandler)
  }
  destroyApp()
})

onMounted(async () => {
  if (!canvasRef.value || !containerRef.value) return

  const app = await initApp({
    canvas: canvasRef.value,
    resizeTo: window,
    backgroundAlpha: 0,
  })
  const container = new Container()

  try {
    console.log('Loading texture: /background.png')
    const texture = await Assets.load('/background.png')
    console.log('Background texture loaded:', texture.width, 'x', texture.height)
    const sprite = new Sprite(texture)

    sprite.anchor.set(0.5, 0.5)

    const resizeBackground = () => {
      const screenWidth = app.screen.width
      const screenHeight = app.screen.height
      const textureWidth = texture.width
      const textureHeight = texture.height

      const scale = Math.max(screenWidth / textureWidth, screenHeight / textureHeight)
      sprite.scale.set(scale)
      sprite.x = screenWidth / 2
      sprite.y = screenHeight / 2
    }

    resizeBackground()

    // 滤波涟漪
    const displacementTexture = await Assets.load('https://pixijs.com/assets/pixi-filters/displacement_map_repeat.jpg')
    const displacementSprite = new Sprite(displacementTexture)
    displacementSprite.texture.source.addressMode = 'repeat'
    displacementSprite.width = app.screen.width
    displacementSprite.height = app.screen.height
    const displacementFilter = new DisplacementFilter({
      sprite: displacementSprite,
      scale: { x: 50, y: 50 },
    })
    const shockWaveFilter = new ShockwaveFilter({
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

    const shockwaveDuration = shockWaveFilter.radius / shockWaveFilter.speed
    container.filters = [displacementFilter, shockWaveFilter]
    app.stage.addChild(container)
    container.addChild(sprite)
    container.addChild(displacementSprite)

    // 当前震波扩散完毕，重置到新的随机位置
    const createNewWavePosition = () => {
      if (shockWaveFilter.time > shockwaveDuration) {
        shockWaveFilter.time = 0
        shockWaveFilter.center = {
          x: Math.random() * app.screen.width,
          y: Math.random() * app.screen.height,
        }
      }
    }

    app.ticker.add((ticker) => {
      displacementSprite.x += 1.5
      displacementSprite.y += 1.5
      // 用 deltaTime 让动画帧率无关
      shockWaveFilter.time += ticker.deltaTime / 60
      createNewWavePosition()
    })

    // 监听窗口调整
    resizeHandler = resizeBackground
    window.addEventListener('resize', resizeHandler)
  } catch (err) {
    console.error('Visualizer error:', err)
  }
})
</script>