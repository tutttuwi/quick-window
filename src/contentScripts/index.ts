import { onMessage } from 'webext-bridge';
import { createApp } from 'vue';
import App from './views/App.vue';
import PopupApp from '../popup/Popup.vue';
import '../styles';
import { setupApp } from '~/logic/common-setup';
import { SnackbarService } from 'vue3-snackbar';
import 'vue3-snackbar/styles';
import 'bootstrap';
import { Dropdown } from 'bootstrap';
import 'popper.js';
import Popper from 'popper.js';

// const iframeContainerWidth = ref<number>(0);
// const showIframeContainer = ref<boolean>(true);

let iframeContainerWidth = 500;
let showIframeContainer = false;
let defaultBodyWidth = document.body.style.width;
// const defaultSideWindowWidth = 300;
function resizeWindow() {
  if (!showIframeContainer) {
    return; // iFrameコンテナが表示されてなかったらサイズ変更しない
  }
  // document.body.style.width = `${
  //   window.innerWidth - (iframeContainerWidth + iframeContainerWidth * 0.1)
  //   // window.innerWidth - (window.innerWidth - iframeContainerWidth)
  // }px`;
  // document.body.style.margin = '0px';
  const size: any = `${window.innerWidth - iframeContainerWidth - 8}`; // 8 = スプリッタの幅の半分
  document.body.style.width = `${size}px`;
}

function toggleShadowCover(showCoverEl: boolean) {
  const shadowContainerEl = document.getElementById('iframe-content-shadow-cover');
  if (showCoverEl && shadowContainerEl) {
    return;
  }

  console.log('showCoverEl', showCoverEl);
  if (showCoverEl && !shadowContainerEl) {
    // mountSideWindow();
    const shadowCoverEl = document.createElement('div');
    shadowCoverEl.id = 'iframe-content-shadow-cover';
    shadowCoverEl.style.position = 'absolute';
    shadowCoverEl.style.top = '0px';
    shadowCoverEl.style.left = '0px';
    shadowCoverEl.style.width = '100%';
    shadowCoverEl.style.height = '100%';
    const shadowContainerEl = document.getElementById('iframe-content-shadow-container');
    shadowContainerEl?.appendChild(shadowCoverEl);
  } else {
    // removeSideWindow();
    const shadowContainerEl = document.getElementById('iframe-content-shadow-cover');
    if (shadowContainerEl) {
      shadowContainerEl.remove();
    }
  }
}

function resize(e: any) {
  const shadowCoverEl = document.getElementById('iframe-content-shadow-cover');
  shadowCoverEl.style.display = 'block';
  const containerEl = document.getElementById('quick-framer-container');
  iframeContainerWidth = e.x;
  const size = `${window.innerWidth - e.x - 8}`; // 8 = スプリッタの幅の半分
  containerEl.style.width = `${size}px`;
  console.log('size', size);
  console.log(
    '`${window.innerWidth - (size + size * 0.1)}px`',
    `${window.innerWidth - (size + size * 0.1)}px`
  );
  document.body.style.width = `${window.innerWidth - size}px`;
}

function removeSideWindow() {
  console.log('removeSideWindow() START');
  const container = document.querySelector('#quick-framer-container');
  if (!container) {
    console.log('container is null!!');
    return;
  }
  container.innerHTML = '';
  console.log('removeSideWindow() END');
}

function mountSideWindow() {
  console.log('mountSideWindow() START');

  const container = document.querySelector('#quick-framer-container');
  if (!container) {
    console.log('container is null!!');
    return;
  }

  const splitBarEl = document.createElement('div');
  splitBarEl.style.minWidth = '16px';
  splitBarEl.style.height = '100%';
  splitBarEl.style.background = '#ccc';
  splitBarEl.style.backgroundImage = `url(${chrome.runtime.getURL('../assets/drag.svg')})`;
  splitBarEl.style.backgroundPosition = 'center';
  splitBarEl.style.backgroundRepeat = 'no-repeat';
  splitBarEl.style.cursor = 'col-resize';
  const shadowContainerEl = document.createElement('div');
  shadowContainerEl.id = 'iframe-content-shadow-container';
  shadowContainerEl.style.width = '100%';
  shadowContainerEl.style.height = '100%';
  shadowContainerEl.style.position = 'relative';

  const shadowEl = document.createElement('div');
  shadowEl.style.width = '100%';
  shadowEl.style.height = '100%';
  shadowEl.id = 'iframe-content-shadow';
  const root = document.createElement('div');
  root.style.height = '100%';
  const styleEl = document.createElement('link');
  // const shadowDOM = container.attachShadow?.({ mode: __DEV__ ? 'open' : 'closed' }) || container;
  const shadowDOM = shadowEl.attachShadow?.({ mode: 'open' }) || shadowEl;
  shadowContainerEl.appendChild(shadowEl);

  styleEl.setAttribute('rel', 'stylesheet');
  styleEl.setAttribute('href', browser.runtime.getURL('dist/contentScripts/style.css'));
  // const scriptEl = document.createElement('script');
  // scriptEl.setAttribute('src', browser.runtime.getURL('dist/contentScripts/index.global.js'));
  // scriptEl.setAttribute('async', '');
  shadowDOM.appendChild(styleEl);
  shadowDOM.appendChild(root);
  // shadowDOM.appendChild(scriptEl);
  // new Dropdown(shadowDOM.querySelector('#zoomRatio'));

  container.appendChild(splitBarEl);
  container.appendChild(shadowContainerEl);

  // change body width
  window.onresize = resizeWindow;
  // resizeWindow();

  splitBarEl.addEventListener('mousedown', (event) => {
    toggleShadowCover(true);
    document.addEventListener('mousemove', resize, false);
    document.body.addEventListener(
      'mouseup',
      () => {
        const shadowContainerEl = document.getElementById('iframe-content-shadow-cover');
        if (!shadowContainerEl) {
          return;
        }
        // document.removeEventListener('mousemove', resize, false);
        // const shadowCoverEl = document.getElementById('iframe-content-shadow-cover');
        // shadowCoverEl.style.display = 'none';
        toggleShadowCover(false);
        if (window.getSelection) {
          window.getSelection().removeAllRanges();
        }
      },
      false
    );
  });

  const popupApp = createApp(PopupApp);
  setupApp(popupApp);
  popupApp.use(SnackbarService);
  popupApp.mount(root);

  // setTimeout(() => {
  //   const shadowElFetched = document.querySelector('#iframe-content-shadow');
  //   new Dropdown(shadowElFetched?.getElementsByClassName('zoomRatio')[0]);
  // }, 1000);
  console.log('mountSideWindow() END');
}

// Firefox `browser.tabs.executeScript()` requires scripts return a primitive value
(() => {
  console.info('[vitesse-webext] Hello world from content script');

  // communication example: send previous tab title from background page
  onMessage('tab-prev', ({ data }) => {
    console.log(`[vitesse-webext] Navigate from page "${data.title}"`);
  });

  //
  onMessage('TOGGLE_SIDE_WINDOW', ({ data }) => {
    console.log('showIframeContainer', showIframeContainer);
    console.log('window.innerWidth', window.innerWidth);
    console.log('iframeContainerWidth', iframeContainerWidth);
    showIframeContainer = !showIframeContainer;
    document.getElementById('quick-framer-container').style.display = showIframeContainer
      ? 'flex'
      : 'none';
    if (!showIframeContainer) {
      removeSideWindow();
      document.body.style.width = defaultBodyWidth ? defaultBodyWidth : '';
    } else {
      mountSideWindow();
      const size: any = `${window.innerWidth - iframeContainerWidth - 8}`; // 8 = スプリッタの幅の半分
      document.body.style.width = `${size}px`;
    }
    console.log('document.body.style.width', document.body.style.width);
  });

  // mount component to context window
  const container = document.createElement('div');
  container.id = 'quick-framer-container';
  container.style.zIndex = '2147483647'; //2147483647
  container.style.display = 'none';
  container.style.position = 'fixed';
  container.style.width = '500px';
  container.style.height = '100%';
  container.style.background = 'white';
  container.style.top = '0px';
  container.style.right = '0px';
  container.style.fontSize = '16px';
  container.style.color = '#333';

  document.body.append(container);
})();
