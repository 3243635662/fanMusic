<template>
  <div class="flex gap-2 p-4 items-center">
    <UButton @click="test">测试推荐列表</UButton>
    <UButton @click="showToast">测试提示</UButton>
    <UButton @click="test2">测试获取推荐列表中的歌曲</UButton>
    <UButton @click="test3">测试获取歌词id</UButton>
    <UButton @click="test4">测试获取歌词信息</UButton>
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

const test3 = async () => {
  const res = await $fetch("/api/music/getLyric?hash=67D227410DB966E5C10ACB3ED99213D6");
  console.log(res);
}

const test4 = async () => {
  const res = await $fetch("/api/music/getLyricInfo?id=126496252&accesskey=B4B60280CAC2CCBC66BA944005FA636E&fmt=krc&decode=true");
  console.log(res);
}
</script>

<style></style>