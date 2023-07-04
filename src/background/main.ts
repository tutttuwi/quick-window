import { onMessage, sendMessage } from 'webext-bridge';
import type { Tabs } from 'webextension-polyfill';
import { getMessage } from '~/background/i18n';
// import { Storage } from '~/logic/storage';
// const storage = new Storage();

// only on dev mode
if (import.meta.hot) {
  // @ts-expect-error for background HMR
  import('/@vite/client');
  // load latest content script
  import('./contentScriptHMR');
}

browser.runtime.onInstalled.addListener(async () => {
  // eslint-disable-next-line no-console
  console.log('Extension installed');
});

let previousTabId = 0;

// communication example: send previous tab title from background page
// see shim.d.ts for type declaration
browser.tabs.onActivated.addListener(async ({ tabId }) => {
  if (!previousTabId) {
    previousTabId = tabId;
    return;
  }

  let tab: Tabs.Tab;

  try {
    tab = await browser.tabs.get(previousTabId);
    previousTabId = tabId;
  } catch {
    return;
  }

  // eslint-disable-next-line no-console
  console.log('previous tab', tab);
  sendMessage('tab-prev', { title: tab.title }, { context: 'content-script', tabId });
});

onMessage('get-current-tab', async () => {
  try {
    const tab = await browser.tabs.get(previousTabId);
    return {
      title: tab?.title,
    };
  } catch {
    return {
      title: undefined,
    };
  }
});

async function getCurrentTab() {
  let queryOptions = { active: true, currentWindow: true };
  let [tab] = await chrome.tabs.query(queryOptions);
  return tab;
}

async function toggleSideWindow() {
  console.log('toggleSideWindow() START');
  getCurrentTab().then((tab) => {
    console.log(tab);
    sendMessage('TOGGLE_SIDE_WINDOW', {}, { context: 'content-script', tabId: tab.id || 0 });
  });
  console.log('toggleSideWindow() END');
}

const showWindowProperties: chrome.contextMenus.CreateProperties = {
  id: 'TOGGLE_SIDE_WINDOW',
  title: getMessage('toggleShowSideWindow'),
  type: 'normal',
  contexts: ['all'],
};

/**
 * インストール・更新時に実行
 */
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create(showWindowProperties);
  chrome.contextMenus.onClicked.addListener((info, tab) => {
    switch (info.menuItemId) {
      case 'TOGGLE_SIDE_WINDOW':
        toggleSideWindow();
        break;
      default:
        break;
    }
  });
});
