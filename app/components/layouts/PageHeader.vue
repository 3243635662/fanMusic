<template>
  <div class="flex items-center mb-4 gap-4">
    <button @click="router.back()" class="text-white/45 hover:text-white/80 transition-colors flex items-center justify-center rounded-md hover:bg-white/10 w-7 h-7">
      <UIcon name="line-md:chevron-small-left" class="w-5 h-5" />
    </button>
    <UBreadcrumb :items="breadcrumbItems" :ui="{
      list: 'gap-2',
      item: 'text-[13px] transition-colors',
      link: 'text-white/45 hover:text-white/80 font-medium aria-[current=page]:text-white aria-[current=page]:font-semibold data-[active=true]:text-white data-[active=true]:font-semibold',
      linkLeadingIcon: 'w-4 h-4',
      separatorIcon: 'w-3 h-3 text-white/30'
    }" />
  </div>
</template>

<script lang="ts" setup>
import type { BreadcrumbItem } from '@nuxt/ui'

const route = useRoute()
const router = useRouter()
const { pageMap } = useMenu()

const breadcrumbItems = computed<BreadcrumbItem[]>(() => {
  const items: BreadcrumbItem[] = [
    {
      label: 'Fan音乐',
      icon: 'line-md:folder-music',
    },
  ]

  const current = pageMap.value[route.path]
  if (current) {
    items.push({
      label: current.label,
      icon: current.icon,
      to: route.path,
    })
  }

  return items
})
</script>
