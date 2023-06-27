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
  <div class="flex items-start justify-end font-sans select-none leading-1em">
    HELLO WORLD!!
  </div>
</template>
