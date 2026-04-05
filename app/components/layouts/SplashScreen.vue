<script setup lang="ts">
import { Application, Graphics, Text, TextStyle } from 'pixi.js'
import { useAppLoading } from '@/composables/useAppLoading'

const isLoading = useAppLoading()
const canvasRef = useTemplateRef('canvasRef')

onMounted(async () => {
  if (!import.meta.client || !canvasRef.value) return

  const app = new Application()
  await app.init({
    canvas: canvasRef.value,
    resizeTo: canvasRef.value.parentElement || window,
    backgroundColor: 0x050505, // 深邃暗色背景
  })

  // === 青春灵动音乐柱特效 ===
  const bars: Graphics[] = []
  const barCount = 9
  const barWidth = 6
  const spacing = 12
  const totalWidth = barCount * barWidth + (barCount - 1) * spacing
  
  for (let i = 0; i < barCount; i++) {
    const bar = new Graphics()
    app.stage.addChild(bar)
    bars.push(bar)
  }

  // === 品牌文字 ===
  const textStyle = new TextStyle({
    fontFamily: 'Inter, system-ui, sans-serif',
    fontSize: 22,
    fontWeight: '900',
    fill: '#ffffff',
    letterSpacing: 10,
    dropShadow: {
      alpha: 0.3,
      blur: 8,
      color: 0x1DB954,
    }
  })
  const text = new Text({ text: 'FAN MUSIC', style: textStyle })
  text.anchor.set(0.5)
  app.stage.addChild(text)

  let time = 0
  app.ticker.add((ticker) => {
    time += ticker.deltaTime * 0.15

    const cx = app.screen.width / 2
    const cy = app.screen.height / 2
    const startX = cx - totalWidth / 2

    // 动态音乐跳动
    bars.forEach((bar, i) => {
      bar.clear()
      // 正弦波形跳动逻辑
      const height = 15 + Math.abs(Math.sin(time + i * 0.6)) * 25 + Math.random() * 8
      
      bar.roundRect(0, -height, barWidth, height * 2, 4)
      bar.fill({ color: 0x1DB954, alpha: 0.9 })
      
      bar.x = startX + i * (barWidth + spacing)
      bar.y = cy - 20
    })

    text.x = cx + 5 // 补偿 letterSpacing
    text.y = cy + 50
  })

  // 当加载完成后，停止 ticker 动画即可，避免跨应用销毁导致全局共享的 WebGL 上下文崩溃
  watch(isLoading, (val) => {
    if (!val) {
      setTimeout(() => {
        app.ticker.stop()
        app.stage.alpha = 0
      }, 1500)
    }
  })
})
</script>

<template>
  <Transition name="splash-fade">
    <div v-show="isLoading" class="fixed inset-0 z-9999 flex items-center justify-center pointer-events-none bg-[#050505]">
      <canvas ref="canvasRef" class="absolute inset-0 z-0"></canvas>
    </div>
  </Transition>
</template>

<style scoped>
.splash-fade-enter-active {
  transition: opacity 0.3s ease;
}
.splash-fade-leave-active {
  transition: opacity 0.8s cubic-bezier(0.4, 0, 0.2, 1);
}
.splash-fade-enter-from,
.splash-fade-leave-to {
  opacity: 0;
  transform: scale(1.05);
}
</style>
