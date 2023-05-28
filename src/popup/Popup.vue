<script setup lang="ts">

const tabList: Ref<Array<IframeTab>> = ref([]);
const iframeUrl: Ref<string> = ref("");

</script>

<template>
  <div class="popup-container">
    <div class="tabs-container">
      <template v-if="tabList.length > 0">
        <template v-for="tab of tabList">
          <div class="tab-item-container m-2">
            <div class="tab-item px-2 py-1">
              <div class="tab-item-title">{{ tab.title }}</div>
              <div class="cursor-pointer">
                <material-symbols:close />
              </div>
            </div>
          </div>

          <div class="tools-container d-flex flex-row align-items-center px-2">
            <div class="iframe-reload cursor-pointer mx-3">
              <tabler:reload />
            </div>
            <div class="iframe-url w-100">
              <input class="form-control iframe-input-url" type="text" name="input-url" :value="tab.url">
            </div>
          </div>
        </template>
      </template>
      <template v-else>
        <div class="tab-item-container m-2">
          <div class="tab-item px-2 py-1 d-flex flex-row justify-content-between">
            <div class="tab-item-title">新しいタブ</div>
            <div class="cursor-pointer">
              <material-symbols:close />
            </div>
          </div>
        </div>
        <div class="tools-container d-flex flex-row align-items-center px-2">
          <div class="iframe-reload cursor-pointer mx-3">
            <tabler:reload />
          </div>
          <div class="iframe-url w-100">
            <input class="form-control iframe-input-url" type="text" name="input-url">
          </div>
        </div>
      </template>
    </div>

    <div class="iframe-body">
      <iframe class="list-scroll" :src="iframeUrl" frameborder="0" style="border: 0" width="650" height="500"
        scrolling="no"></iframe>
    </div>

  </div>
</template>
