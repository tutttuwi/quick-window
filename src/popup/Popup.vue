<script setup lang="ts">
import { savedTabList } from '~/logic/storage'

const parsedSavedTabList = computed<any[]>(() => JSON.parse(savedTabList.value));

// const tabList: Ref<Array<IframeTab>> = ref([]);
const iframeUrl: Ref<string> = ref("");

console.log(parsedSavedTabList);
function fetchIframe(event: any) {
  const fetchUrl: string = event.target.value;
  iframeUrl.value = fetchUrl;
  const fetchDomain = fetchUrl.replaceAll(/http.*?\/\//g, "").replaceAll(/\/.*/g, "");
  crypto.randomUUID();
  parsedSavedTabList.value.push({
    uuid: crypto.randomUUID(),
    title: fetchDomain,
    url: fetchUrl
  });
  savedTabList.value = JSON.stringify(parsedSavedTabList.value);
  // document.getElementsByClassName(".iframe-element").item(0).src = "";
}

</script>

<template>
  <div class="popup-container">
    <div class="tabs-container">

      <!-- 1件以上登録されている場合 -->
      <template v-if="parsedSavedTabList.length > 0">
        <div class="tab-item-container m-2 d-flex">

          <template v-for="tab of parsedSavedTabList">
            <div class="tab-item px-2 py-1 d-flex justify-content-between">
              <div class="tab-item-title text-truncate cursor-pointer">{{ tab.title }}</div>
              <div class="cursor-pointer">
                <material-symbols:close />
              </div>
            </div>
          </template>

        </div>
      </template>

      <!-- 1件も登録されていない場合 -->
      <template v-else>
        <div class="tab-item-container m-2">
          <div class="tab-item px-2 py-1 d-flex flex-row justify-content-between">
            <div class="tab-item-title text-truncate cursor-pointer">新しいタブ</div>
            <div class="cursor-pointer">
              <material-symbols:close />
            </div>
          </div>
        </div>
      </template>

      <!-- iframe要素 -->
      <div class="tools-container d-flex flex-row align-items-center px-2 my-2">
        <div class="iframe-reload cursor-pointer mx-3">
          <tabler:reload />
        </div>
        <div class="iframe-url w-100 align-items-center">
          <ri:chrome-fill class="iframe-favicon" />
          <input class="form-control iframe-input-url" type="text" name="input-url" value=""
            v-on:keydown.enter="fetchIframe($event)">
        </div>
      </div>

    </div>

    <div class="iframe-body">
      <iframe class="list-scroll iframe-element" :src="iframeUrl" frameborder="0" style="border: 0" width="650"
        height="500"></iframe>
    </div>

  </div>
</template>
