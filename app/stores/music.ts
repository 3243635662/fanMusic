import { defineStore } from 'pinia'

export const useMusicStore = defineStore('music', () => {
  const currentTrack = ref<any>(null)
  const isPlaying = ref(false)
  const hotSongs = ref<any[]>([])
  const lastSearchKeyword = ref('')

  function setHotSongs(songs: any[], keyword: string) {
    hotSongs.value = songs
    lastSearchKeyword.value = keyword
  }

  function playTrack(track: any) {
    currentTrack.value = track
    isPlaying.value = true
  }

  function togglePlay() {
    isPlaying.value = !isPlaying.value
  }

  return {
    currentTrack,
    isPlaying,
    hotSongs,
    lastSearchKeyword,
    setHotSongs,
    playTrack,
    togglePlay
  }
})
