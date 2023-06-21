<script setup lang="ts">
import { savedTabList } from '~/logic/storage'
import { getMessage } from '~/background/i18n'

const parsedSavedTabList = computed<IframeTab[]>(() => {
  const parsedSavedTabList = JSON.parse(savedTabList.value);
  console.log(parsedSavedTabList);
  if (parsedSavedTabList.length === 0) {
    parsedSavedTabList.push({
      uuid: crypto.randomUUID(),
      title: getMessage("newTabTitle"),
      url: '',
      active: true
    });
  }
  return parsedSavedTabList;
});

// const tabList: Ref<Array<IframeTab>> = ref([]);
const activateDate: Ref<Date> = ref(new Date());


console.log(parsedSavedTabList);
function fetchIframe(event: any) {
  const activeTab: IframeTab | undefined = parsedSavedTabList.value.find(tabItem => tabItem.active);
  const fetchUrl: string = event.target.value;
  if (!fetchUrl) {
    return; // URLが空なのでリターン、何もしない
  }
  const fetchDomain = fetchUrl.replaceAll(/http.*?\/\//g, "").replaceAll(/\/.*/g, "");
  if (activeTab) {
    activeTab.active = true;
    activeTab.url = fetchUrl;
    activeTab.title = activeTab.title ? activeTab.title : fetchDomain;
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
  const inputValue = document.getElementsByClassName("iframe-input-url")[0].value
  if (inputValue) {
    document.getElementById("iframe-content").src = inputValue; // インプットで上書き
    document.getElementById("iframe-content").src += ''; // リロードさせる
  }
}
function openWindow() {
  const inputValue = document.getElementsByClassName("iframe-input-url")[0].value
  if (inputValue) {
    chrome.windows.create(
      {
        state: "maximized",
        url: inputValue,
        type: "popup"
      }
    )
  }
}


function deleteTab(deleteTab: IframeTab) {
  const deletedParsedSavedTabList = parsedSavedTabList.value.filter((tabItem: IframeTab) => tabItem.uuid !== deleteTab.uuid);
  savedTabList.value = JSON.stringify(deletedParsedSavedTabList);
}

function fetchUrl() {
  let activeTab = parsedSavedTabList.value.find(tabItem => tabItem.active);
  return activeTab ? activeTab.url : '';
}

function createTab() {
  parsedSavedTabList.value.forEach(tabItem => tabItem.active = false);
  parsedSavedTabList.value.push({
    uuid: crypto.randomUUID(),
    title: getMessage("newTabTitle"),
    url: '',
    active: true
  });
  savedTabList.value = JSON.stringify(parsedSavedTabList.value);
}

function activateTab(e: Event, tab: IframeTab) {
  e.stopPropagation();
  parsedSavedTabList.value.forEach(tabItem => {
    if (tab.uuid === tabItem.uuid) {
      tabItem.active = true;
    } else {
      tabItem.active = false;
    }
  });
  savedTabList.value = JSON.stringify(parsedSavedTabList.value);
}

async function editTitle(tab: IframeTab) {
  savedTabList.value = JSON.stringify(parsedSavedTabList.value.map((tabItem) => {
    if (tabItem.uuid === tab.uuid) {
      tabItem.isUnderEditTitle = true;
    }
    return tabItem;
  }));
  let editTitleInput = document.getElementById("tab-title-" + tab.uuid);
  if (editTitleInput) {
    await nextTick();
    editTitleInput.focus();
  }
}

function bindTitle(tab: IframeTab) {
  savedTabList.value = JSON.stringify(parsedSavedTabList.value.map((tabItem) => {
    if (tabItem.uuid === tab.uuid) {
      tabItem.isUnderEditTitle = false;
    }
    return tabItem;
  }));
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

      <template v-if="parsedSavedTabList.length > 0">
        <div class="tab-item-container scroll_bar d-flex">

          <template v-for="tab of parsedSavedTabList">
            <div class="tab-item px-2 py-1 d-flex justify-content-between"
              :class="tab.active ? 'tab-active' : 'tab-passive'" @click="activateTab($event, tab)"
              @dblclick="editTitle(tab)">
              <div class="d-flex align-items-center">
                <span class="me-1">
                  <img v-if="tab.url" class="tabs-favicon me-1"
                    :src="tab.url ? `/_favicon/?pageUrl=${encodeURIComponent(tab.url)}` : ''">
                </span>
                <div v-if="!tab.isUnderEditTitle" class="tab-item-title text-truncate cursor-pointer">{{
                  tab.title }}</div>
              </div>
              <input :class="tab.isUnderEditTitle ? '' : 'd-none'" class="me-2 tab-title-input" type="text"
                :id="'tab-title-' + tab.uuid" v-model="tab.title" v-on:keydown.enter="bindTitle(tab)"
                v-on:blur="bindTitle(tab)">
              <div class="cursor-pointer" @click="deleteTab(tab)" v-if="tab.active">
                <material-symbols:close />
              </div>
            </div>
            <div class="d-flex align-items-center item-border-box">
              <div class="item-border"></div>
            </div>
          </template>
          <div class="tab-plus px-2 py-1 d-flex justify-content-between">
            <div class="tab-item-title text-truncate cursor-pointer" @click="createTab()">
              <ic:baseline-plus />
            </div>
          </div>

        </div>
      </template>

      <!-- iframe要素 -->
      <div class="tools-container d-flex flex-row align-items-center px-2 my-2">
        <div class="iframe-reload cursor-pointer mx-2" @click="iframeReload()" :title="getMessage('reloadText')">
          <tabler:reload />
        </div>
        <div class="iframe-open-window cursor-pointer ms-2 me-3" @click="openWindow()"
          :title="getMessage('openWindowText')">
          <icomoon-free:new-tab />
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
