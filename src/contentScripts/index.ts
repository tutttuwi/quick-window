import { onMessage } from 'webext-bridge';
import { createApp } from 'vue';
import App from './views/App.vue';
import PopupApp from '../popup/Popup.vue';
import '../styles';
import { setupApp } from '~/logic/common-setup';
import { SnackbarService } from 'vue3-snackbar';
import 'vue3-snackbar/styles';

// const iframeContainerWidth = ref<number>(0);
// const showIframeContainer = ref<boolean>(true);

let iframeContainerWidth = 0;
let showIframeContainer = true;
let defaultBodyWidth = document.body.style.width;
const defaultSideWindowWidth = 300;
function resizeWindow() {
  document.body.style.width = `${
    window.innerWidth - (defaultSideWindowWidth + defaultSideWindowWidth * 0.1)
  }px`;
  // document.body.style.margin = '0px';
}

function resize(e: any) {
  iframeContainerWidth = e.x;
  const size = `${window.innerWidth - e.x - 8}`; // 8 = スプリッタの幅の半分
  document.getElementById('quick-framer-container').style.width = `${size}px`;
  console.log('size', size);
  console.log(
    '`${window.innerWidth - (size + size * 0.1)}px`',
    `${window.innerWidth - (size + size * 0.1)}px`
  );
  document.body.style.width = `${window.innerWidth - size}px`;
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
    showIframeContainer = !showIframeContainer;
    document.getElementById('quick-framer-container').style.display = showIframeContainer
      ? 'block'
      : 'none';
    if (!showIframeContainer) {
      document.body.style.width = defaultBodyWidth ? defaultBodyWidth : '';
    } else {
      const size = `${window.innerWidth - iframeContainerWidth - 8}`; // 8 = スプリッタの幅の半分
      document.body.style.width = `${window.innerWidth - size}px`;
    }
  });

  // mount component to context window
  const container = document.createElement('div');
  container.id = 'quick-framer-container';
  container.style.display = 'flex';
  container.style.position = 'fixed';
  container.style.width = '300px';
  container.style.height = '100%';
  container.style.background = 'red';
  container.style.top = '0px';
  container.style.right = '0px';
  container.style.zIndex = '1000';

  const splitBarEl = document.createElement('div');
  splitBarEl.style.width = '10px';
  splitBarEl.style.height = '100%';
  splitBarEl.style.background = 'blue';
  splitBarEl.style.cursor = 'col-resize';
  const shadowEl = document.createElement('div');
  const root = document.createElement('div');
  const styleEl = document.createElement('link');
  // const shadowDOM = container.attachShadow?.({ mode: __DEV__ ? 'open' : 'closed' }) || container;
  const shadowDOM = shadowEl.attachShadow?.({ mode: 'open' }) || shadowEl;
  styleEl.setAttribute('rel', 'stylesheet');
  styleEl.setAttribute('href', browser.runtime.getURL('dist/contentScripts/style.css'));
  shadowDOM.appendChild(styleEl);
  shadowDOM.appendChild(root);

  container.appendChild(splitBarEl);
  container.appendChild(shadowEl);

  // change body width
  window.onresize = resizeWindow;
  resizeWindow();

  splitBarEl.addEventListener('mousedown', (event) => {
    document.addEventListener('mousemove', resize, false);
    document.addEventListener(
      'mouseup',
      () => {
        document.removeEventListener('mousemove', resize, false);
      },
      false
    );
  });

  document.body.appendChild(container);
  const popupApp = createApp(PopupApp);
  setupApp(popupApp);
  popupApp.use(SnackbarService);
  popupApp.mount(root);
})();
