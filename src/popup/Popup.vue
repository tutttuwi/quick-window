<script setup lang="ts">
import { savedTabList } from '~/logic/storage'

const parsedSavedTabList = computed<IframeTab[]>(() => JSON.parse(savedTabList.value));

// const tabList: Ref<Array<IframeTab>> = ref([]);
const activeUrl: Ref<string> = ref("");
const activateDate: Ref<Date> = ref(new Date());


console.log(parsedSavedTabList);
function fetchIframe(event: any) {
  const activeTab: IframeTab | undefined = parsedSavedTabList.value.find(tabItem => tabItem.active);
  const fetchUrl: string = event.target.value;
  const fetchDomain = fetchUrl.replaceAll(/http.*?\/\//g, "").replaceAll(/\/.*/g, "");
  if (activeTab) {
    activeTab.active = true;
    activeTab.url = fetchUrl;
    activeTab.title = fetchDomain;
    parsedSavedTabList.value.forEach(tabItem => {
      if (tabItem.uuid === activeTab.uuid) {
        tabItem = activeTab;
      }
    });
  } else {
    crypto.randomUUID();
    parsedSavedTabList.value.push({
      uuid: crypto.randomUUID(),
      title: fetchDomain,
      url: fetchUrl,
      active: true
    });
  }
  savedTabList.value = JSON.stringify(parsedSavedTabList.value);
  // activateDate.value = new Date();
  // nextTick(() => activateDate.value = new Date());
  // document.getElementById('iframeID').src += '';
  document.getElementById("iframe-content").src += ''; // リロードさせる
  // document.getElementsByClassName(".iframe-element").item(0).src = "";
}

function iframeReload() {
  document.getElementById("iframe-content").src += ''; // リロードさせる
}

function deleteTab(deleteTab: IframeTab) {
  const deletedParsedSavedTabList = parsedSavedTabList.value.filter((tabItem: IframeTab) => tabItem.uuid !== deleteTab.uuid);
  savedTabList.value = JSON.stringify(deletedParsedSavedTabList);
}

function fetchUrl() {
  let activeTab = parsedSavedTabList.value.find(tabItem => tabItem.active);
  return activeTab ? activeTab.url : '';
}

function init() {
  let activeTab = parsedSavedTabList.value.find(tabItem => tabItem.active);
  if (activeTab) {
    parsedSavedTabList.value[0].active = true;
  }
  savedTabList.value = JSON.stringify(parsedSavedTabList.value);
  activateDate.value = new Date();
}
init();
</script>

<template>
  <div class="popup-container">
    <div class="tabs-container">

      <!-- 1件以上登録されている場合 -->
      <template v-if="parsedSavedTabList.length > 0">
        <div class="tab-item-container m-1 d-flex">

          <template v-for="tab of parsedSavedTabList">
            <div class="tab-item px-2 py-1 d-flex justify-content-between">
              <div class="tab-item-title text-truncate cursor-pointer" :class="tab.active ? 'tab-active' : ''">{{
                tab.title }}</div>
              <div class="cursor-pointer" @click="deleteTab(tab)">
                <material-symbols:close />
              </div>
            </div>
          </template>

        </div>
      </template>

      <!-- 1件も登録されていない場合 -->
      <template v-else>
        <div class="tab-item-container m-1">
          <div class="tab-item px-2 py-1 d-flex flex-row justify-content-between">
            <div class="tab-item-title text-truncate cursor-pointer">新しいタブ</div>
          </div>
        </div>
      </template>

      <!-- iframe要素 -->
      <div class="tools-container d-flex flex-row align-items-center px-2 my-2">
        <div class="iframe-reload cursor-pointer mx-3" @click="iframeReload()">
          <tabler:reload />
        </div>
        <div class="iframe-url w-100 align-items-center">
          <ri:chrome-fill class="iframe-favicon" />
          <input class="form-control iframe-input-url" type="text" name="input-url" :value="fetchUrl()"
            v-on:keydown.enter="fetchIframe($event)">
        </div>
      </div>

    </div>

    <div class="iframe-body" v-if="activateDate.getTime() > 0">
      <iframe id="iframe-content" class="list-scroll iframe-element" :src="fetchUrl()" frameborder="0" style="border: 0"
        width="650" height="500"></iframe>
    </div>

  </div>
</template>
