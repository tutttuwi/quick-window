<script setup lang="ts">
// import { useToggle } from '@vueuse/core'
import 'uno.css'
import '../style.css'

// const [show, toggle] = useToggle(false)
const isShow = ref<ValueOf<typeof Boolean>>(true);

function getAccountProfileUrl() {
  return window.location.href.replaceAll(/\/items\/.*/g, "");
}

function showToggle(e: Event) {
  e.stopPropagation();
  isShow.value = !isShow.value;
}

function closeWindow() {
  isShow.value = false;
}

</script>

<template>
  <div class="fixed qiita-window-container m-5 z-100 flex items-start justify-end font-sans select-none leading-1em">
    <template v-if="isShow">
      <div class="qiita-window-inner" @click="closeWindow()">
      </div>
      <div class="bg-white text-gray-800 rounded-lg shadow w-max h-min z-100" p="x-1 y-1" m="r-4 l-4"
        transition="opacity duration-300">
        <iframe class="list-scroll" :src="getAccountProfileUrl()" frameborder="0" style="border: 0" width="500"
          height="800" scrolling="no"></iframe>
      </div>
    </template>
    <div class="flex w-10 h-10 rounded-full shadow cursor-pointer" @click="showToggle($event)">
      <img title="[Qiitaノ窓]プロフィールを覗く(/ω・＼)ﾁﾗｯ" src="../../assets/icon-16.png" />
    </div>
  </div>
</template>
