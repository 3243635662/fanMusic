<template>
  <div class="flex gap-2 p-4 items-center">
    <UButton @click="test">测试推荐列表</UButton>
    <UButton @click="showToast">测试提示</UButton>
    <UButton @click="test2">测试获取推荐列表中的歌曲</UButton>

  </div>
</template>

<script lang="ts" setup>
const toast = useToast()
const test = async () => {
  const res = await $fetch("/api/music/recommendation");
  console.log(res);
}

const showToast = () => {
  toast.add({
    icon: useIcon('error'),
    title: "Success",
    description: "This is a success toast",
    color: 'primary'
  });
}

const test2 = async () => {
  const res = await $fetch("/api/music/recommendationTrack?theme_id=5");
  console.log(res);
}

</script>

<style></style>