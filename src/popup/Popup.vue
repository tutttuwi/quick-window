<script setup lang="ts">
import { sendMessage } from 'webext-bridge';
import { savedTabList } from '~/logic/storage'
import { getMessage } from '~/background/i18n'

import { Vue3Snackbar } from "vue3-snackbar";
import { useSnackbar } from "vue3-snackbar";
import 'bootstrap'
import 'popper.js'

const snackbar = useSnackbar();

const iframeScale: Ref<GLfloat> = ref(1.0);

watch(iframeScale, (next, prev) => {
  const shadowEl = document.querySelector("#iframe-content-shadow");
  const iframeEl = shadowEl ? shadowEl.shadowRoot.querySelector(".iframe-element") : document.querySelector(".iframe-element");
  console.log("iframeScale : ", iframeScale.value);
  iframeEl.style.transform = `scale(${iframeScale.value})`;
  iframeEl.style.transformOrigin = "0px 0px";
  iframeEl.style.width = `calc(100% / ${iframeScale.value})`;
  iframeEl.style.height = `calc(100% / ${iframeScale.value})`;

});

const parsedSavedTabList = computed<IframeTab[]>(() => {
  console.log("savedTabList", savedTabList);
  console.log("savedTabList.value", savedTabList.value);
  const parsedSavedTabList = JSON.parse(savedTabList.value);
  console.log("computed: ", parsedSavedTabList);
  if (parsedSavedTabList.length === 0) {
    parsedSavedTabList.push({
      uuid: crypto.randomUUID(),
      title: getMessage("newTabTitle"),
      url: 'about:blank',
      scale: 1,
      active: true
    });
  }
  let activeTab = parsedSavedTabList.find((tabItem: any) => tabItem.active);
  iframeScale.value = activeTab ? activeTab.scale : 1.0;

  if (!activeTab) {
    parsedSavedTabList[parsedSavedTabList.length - 1].active = true;
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
      scale: 1,
      isUnderEditTitle: false,
      url: fetchUrl,
      active: true
    });
  }
  const shadowEl = document.querySelector("#iframe-content-shadow");
  const iframeEl = shadowEl ? shadowEl.shadowRoot.querySelector(".iframe-element") : document.querySelector(".iframe-element");
  iframeEl.src += ''; // リロードさせる
  savedTabList.value = JSON.stringify(parsedSavedTabList.value);
  // activateDate.value = new Date();
  // nextTick(() => activateDate.value = new Date());
  // document.getElementById('iframeID').src += '';
  // document.getElementsByClassName(".iframe-element").item(0).src = "";
}

// const IFRAME_CONTENT_EL = `
// <iframe id="iframe-content" class="list-scroll iframe-element" :src="fetchUrl()" frameborder="0"
//             style="border: 0;width:100%;height:100%;"></iframe>
// `

function iframeReload() {
  const shadowEl = document.querySelector("#iframe-content-shadow");
  const inputValue = shadowEl ? shadowEl.shadowRoot.querySelector(".iframe-input-url").value : document.querySelector(".iframe-input-url").value;
  // const inputValue = document.getElementsByClassName("iframe-input-url")[0].value
  if (inputValue && shadowEl) {
    shadowEl.shadowRoot.getElementById("iframe-content").src = inputValue; // インプットで上書き
    shadowEl.shadowRoot.getElementById("iframe-content").src += ''; // リロードさせる
    // shadowEl.shadowRoot.getElementById("iframe-content").remove();
    // shadowEl.shadowRoot.getElementById("iframe-content-wrapper").innerHTML = IFRAME_CONTENT_EL;
  } else if (inputValue) {
    document.getElementById("iframe-content").src = inputValue; // インプットで上書き
    document.getElementById("iframe-content").src += ''; // リロードさせる
    // document.getElementById("iframe-content").remove();
    // document.getElementById("iframe-content-wrapper").innerHTML = IFRAME_CONTENT_EL;
  }
}
function openWindow() {
  const shadowEl = document.querySelector("#iframe-content-shadow");
  const inputValue = shadowEl ? shadowEl.shadowRoot.querySelector(".iframe-input-url").value : document.querySelector(".iframe-input-url").value;
  // const inputValue = document.getElementsByClassName("iframe-input-url")[0].value
  if (inputValue && shadowEl) {
    sendMessage('SHOW_POPUP_WINDOW', { url: inputValue });
  } else if (inputValue) {
    chrome.windows.create(
      {
        state: "maximized",
        url: inputValue,
        type: "popup"
      }
    )
  }
}

function toggleSideWindow() {
  sendMessage('TOGGLE_SIDE_WINDOW', {});
}




function deleteTab(deleteTab: IframeTab) {
  const deletedParsedSavedTabList = parsedSavedTabList.value.filter((tabItem: IframeTab) => tabItem.uuid !== deleteTab.uuid);
  savedTabList.value = JSON.stringify(deletedParsedSavedTabList);
}

function fetchUrl() {
  let activeTab = parsedSavedTabList.value.find(tabItem => tabItem.active);
  return activeTab ? activeTab.url : 'about:blank';
}

function createTab() {
  parsedSavedTabList.value.forEach(tabItem => tabItem.active = false);
  parsedSavedTabList.value.push({
    uuid: crypto.randomUUID(),
    title: getMessage("newTabTitle"),
    url: '',
    scale: 1,
    isUnderEditTitle: false,
    active: true
  });
  savedTabList.value = JSON.stringify(parsedSavedTabList.value);
}

function activateTab(e: Event, tab: IframeTab) {
  e.stopPropagation();
  parsedSavedTabList.value.forEach(tabItem => {
    if (tab.uuid === tabItem.uuid) {
      tabItem.active = true;
      iframeScale.value = tabItem.scale ? tabItem.scale : 1; //scaleがない場合はデフォルト設定
    } else {
      tabItem.active = false;
    }
  });
  const shadowEl = document.querySelector("#iframe-content-shadow");
  const iframeEl = shadowEl ? shadowEl.shadowRoot.querySelector(".iframe-element") : document.querySelector(".iframe-element");
  if (iframeEl.src !== "about:blank" && !iframeEl.src) {
    iframeEl.src += ''; // リロードさせる
  }
  savedTabList.value = JSON.stringify(parsedSavedTabList.value);
}

function getExtensionPath(path: string) {
  return chrome.runtime.getURL(path);
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

// function setIframe() {
//   if (!parsedSavedTabList.value) return;
//   console.log("parsedSavedTabList.value", parsedSavedTabList.value);
//   let activeTab = parsedSavedTabList.value.find(tabItem => tabItem.active);
//   const iframeEl = document.querySelector(".iframe-element");
//   console.log("activeTab", activeTab);
//   const scale = activeTab ? activeTab.scale : 1;
//   console.log(scale);
//   console.log(iframeEl.style);
//   iframeEl.style.transform = `scale(${scale})`;
//   iframeEl.style.transformOrigin = "0px 0px";
//   iframeEl.style.width = `calc(650px / ${scale})`;
//   iframeEl.style.height = `calc(500px / ${scale})`;
//   console.log(iframeEl.style);
// }

const MAX_ZOOM_IN = 1.4;
const MAX_ZOOM_OUT = 0.6;

function zoomIn() {
  const activeTab = parsedSavedTabList.value.find(tabItem => tabItem.active);
  if (MAX_ZOOM_IN <= activeTab.scale) {
    snackbar.add({ type: 'warning', text: getMessage("zoomInMaxText") + (Math.round(activeTab.scale * 100)) + ' %' });
    return;
  }
  activeTab.scale = ((activeTab.scale * 10) + (0.1 * 10)) / 10;
  savedTabList.value = JSON.stringify(parsedSavedTabList.value);
  // alert("change scale : " + activeTab.scale);
  snackbar.add({ type: 'success', text: Math.round(activeTab.scale * 100) + ' %' });
  // setIframe();
  iframeScale.value = activeTab.scale;
}

function zoomOut() {
  const activeTab = parsedSavedTabList.value.find(tabItem => tabItem.active);
  if (MAX_ZOOM_OUT >= activeTab.scale) {
    snackbar.add({ type: 'warning', text: getMessage("zoomOutMinText") + (Math.round(activeTab.scale * 100)) + ' %' });
    return;
  }
  activeTab.scale = ((activeTab.scale * 10) - (0.1 * 10)) / 10;
  savedTabList.value = JSON.stringify(parsedSavedTabList.value);
  // alert("change scale : " + activeTab.scale);
  snackbar.add({ type: 'success', text: Math.round(activeTab.scale * 100) + ' %' });
  // setIframe();
  iframeScale.value = activeTab.scale;
}

function getTabScale() {
  const activeTab = parsedSavedTabList.value.find(tabItem => tabItem.active);
  if (activeTab) {
    return ((activeTab?.scale * 10) * 100) / 10;
  }
  return 1 * 100;
}

function init() {
  // 初期化
  parsedSavedTabList.value.forEach(tabItem => {
    tabItem.scale = tabItem.scale ? tabItem.scale : 1;
  });
  console.log(parsedSavedTabList.value);
  savedTabList.value = JSON.stringify(parsedSavedTabList.value);
  activateDate.value = new Date();
}
init();

// テンプレート初期化後実行処理
onMounted(() => {
  // setIframe();
  // let activeTab = parsedSavedTabList.value.find(tabItem => tabItem.active);
  // if (activeTab) {
  //   parsedSavedTabList.value[0].active = true;
  // }
});

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
                    :src="tab.url ? getExtensionPath(`/_favicon/?pageUrl=${encodeURIComponent(tab.url)}`) : ''">
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
        <div class="iframe-open-window cursor-pointer ms-2 me-2" @click="openWindow()"
          :title="getMessage('openWindowText')">
          <icomoon-free:new-tab />
        </div>
        <div class="iframe-open-window cursor-pointer ms-2 me-2" @click="toggleSideWindow()"
          :title="getMessage('toggleShowSideWindow')">
          <zondicons:show-sidebar />
        </div>
        <div class="iframe-open-window cursor-pointer ms-2 me-2" @click="zoomIn()" :title="getMessage('zoomInText')">
          <ri:zoom-in-line />
        </div>
        <div class="iframe-open-window cursor-pointer ms-2 me-2" @click="zoomOut()" :title="getMessage('zoomOutText')">
          <ri:zoom-out-line />
        </div>
        <div id="zoomScale" class="zoomScale ms-2 me-3">
          {{ getTabScale() + '%' }}
        </div>
        <div class="iframe-url w-100 align-items-center">
          <ri:chrome-fill class="iframe-favicon" />
          <input class="form-control iframe-input-url" type="text" name="input-url" :value="fetchUrl()"
            v-on:keydown.enter="fetchIframe($event)">
        </div>
      </div>

    </div>

    <div class="iframe-body m-1" v-if="activateDate.getTime() > 0">
      <div style="width:100%;height:100%;overflow-x:hidden;">
        <div id="iframe-content-wrapper" style="width:100%;height:100%;overflow:hidden;">
          <iframe id="iframe-content" class="list-scroll iframe-element" :src="fetchUrl()" frameborder="0"
            style="border: 0;width:100%;height:100%;"></iframe>
        </div>
      </div>
    </div>

  </div>
  <vue3-snackbar bottom center :duration="1000"></vue3-snackbar>
</template>
