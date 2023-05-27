<script setup lang="ts">

const tabList: Ref<Array<any>> = ref([]);
const iframeUrl: Ref<string> = ref("");

</script>

<template>
  <div class="popup-container">
    <div class="tabs-container">
      <template v-for="tab of tabList">
        <div class="tab-item">
          <div>{{ tab.name }}</div>
        </div>

        <div class="tools-container">
          <div class="iframe-reload">
          </div>
          <div class="iframe-url">
            <input class="form-control" type="text" name="input-url" :value="tab.url">
          </div>
        </div>
      </template>
    </div>

    <div class="iframe-body">
      <iframe class="list-scroll" :src="iframeUrl" frameborder="0" style="border: 0" width="500" height="800"
        scrolling="no"></iframe>
    </div>

  </div>
</template>
