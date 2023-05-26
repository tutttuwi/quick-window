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

  console.log('Init Alarm [START]');
  // Reset all alarm
  console.log('clear alarms before', await chrome.alarms.getAll());
  await chrome.alarms.clearAll();
  console.log('clear alarms after', await chrome.alarms.getAll());
  const isAutoSaveTabGroup: boolean = (await storage.getItem('isAutoSaveTabGroup')) === 'true';
  const autoSaveTabGroupPerMinites: number = Number(
    await storage.getItem('autoSaveTabGroupPerMinites')
  );
  console.log(isAutoSaveTabGroup, autoSaveTabGroupPerMinites);
  if (isAutoSaveTabGroup && autoSaveTabGroupPerMinites) {
    // Create an alarm
    chrome.alarms.create('auto-save-tab-group', {
      delayInMinutes: 1,
      periodInMinutes: autoSaveTabGroupPerMinites,
    });
  }
  console.log('Init Alarm [END]');
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

const QueryInWindow = {
  windowId: chrome.windows.WINDOW_ID_NONE,
  // windowId: 132293679,
};

// Run something when the alarm goes off
chrome.alarms.onAlarm.addListener(async function (alarm) {
  // console.log(windowList);
  if (alarm.name == 'auto-save-tab-group') {
    console.log('auto save tabgroup [START] ' + new Date().toLocaleString());
    const showNotificationWhenAutoSaveTabGroup: boolean =
      (await storage.getItem('showNotificationWhenAutoSaveTabGroup')) === 'true';
    try {
      const windowList: chrome.windows.Window[] = await chrome.windows.getAll();
      console.log('windowList', windowList);
      for (const windowItem of windowList) {
        const tabList: Array<any> = await fetchCurrentTabs(windowItem.id || 0);
        const tabListGroups = tabList.filter((tabItem) => tabItem.isGroup);
        // console.log('tabListGroups', tabListGroups);
        for (const tabGroup of tabListGroups) {
          console.log('tabGroup', tabGroup);
          await saveTabGroup(tabGroup);
        }
      }
      if (showNotificationWhenAutoSaveTabGroup) {
        chrome.notifications.getAll((notifications) => {
          console.log('notifications', notifications);
          Object.keys(notifications).forEach((id) => {
            chrome.notifications.clear(id);
          });
        });
        chrome.notifications.create('', {
          iconUrl: '../../assets/icon-256.png',
          message: getMessage('notifyAutoSaveTabGroupsSuccessMessage'),
          type: 'basic', //"basic" | "image" | "list" | "progress";
          title: getMessage('notifyAutoSaveTabGroupsSuccessTitle'),
        });
      }
    } catch (error) {
      console.log('AutoSaveTabGroups Failed..');
      console.log(error);
      chrome.notifications.getAll((notifications) => {
        console.log('notifications', notifications);
        Object.keys(notifications).forEach((id) => {
          chrome.notifications.clear(id);
        });
      });
      chrome.notifications.create('', {
        iconUrl: '../../assets/icon-256.png',
        message: getMessage('notifyAutoSaveTabGroupsErrorMessage'),
        type: 'basic', //"basic" | "image" | "list" | "progress";
        title: getMessage('notifyAutoSaveTabGroupsErrorTitle'),
        contextMessage: '',
        // priority?: number | undefined;
        // eventTime?: number | undefined;
        // buttons?: ButtonOptions[] | undefined;
        // items?: ItemOptions[] | undefined;
        // progress?: number | undefined;
        // isClickable?: boolean | undefined;
        // appIconMaskUrl?: string | undefined;
        // imageUrl?: string | undefined;
        // requireInteraction?: boolean,
        // silent?: boolean
      });
    }
    console.log('auto save tabgroup [END]');
  }
});

async function saveTabGroup(tab: any) {
  const savedTabList = await storage.getItem('savedTabList');
  const houseKeepTabGroupCount: number = Number(await storage.getItem('houseKeepTabGroupCount'));
  const parsedSavedTabList: Array<any> = JSON.parse(savedTabList);
  let tmpTabList: any = [];
  tmpTabList = parsedSavedTabList;

  tab.updateDate = new Date().toLocaleString();
  tab.uuid = crypto.randomUUID();
  tab.collapsed = true; // 開いた状態で保存すると見づらいため、閉じた状態で保存する
  // const findedTab = parsedSavedTabList.value.find((savedTab) => savedTab.isGroup && savedTab.title === tab.title);
  const findedTabs: Array<any> = [];
  parsedSavedTabList.forEach((savedTab: any) => {
    if (savedTab.isGroup && savedTab.title === tab.title) {
      findedTabs.push(savedTab);
    }
  });

  let findedTabGroupsIds: Array<string> = [];
  findedTabs.forEach((tabItem) => {
    findedTabGroupsIds.push(tabItem.childTabs.map((childTabItem: any) => childTabItem.id).join(''));
  });
  let targetSaveTabGroupsId = tab.childTabs.map((childTabItem: any) => childTabItem.id).join('');
  console.log(
    'check already saved tabgroups by confirm same id strings',
    findedTabGroupsIds,
    targetSaveTabGroupsId
  );
  if (findedTabGroupsIds.includes(targetSaveTabGroupsId)) {
    console.log('skip auto save tab groups! already same saved tabgroups info');
    return; // 保存されている子タブと同じなため保存をスキップ
  }

  // console.log('findedTabs', findedTabs);
  if (findedTabs && findedTabs.length >= houseKeepTabGroupCount) {
    findedTabs.sort((a, b) => new Date(b.updateDate).getTime() - new Date(a.updateDate).getTime());
    // console.log('findedTabs sorted', findedTabs);
    const targetDeleteTabs = findedTabs.slice(houseKeepTabGroupCount - 1);
    const targetDeleteTabsUUIDs = targetDeleteTabs.map((tabItem) => tabItem.uuid);
    tmpTabList = parsedSavedTabList.filter(
      (tabItem: any) => !targetDeleteTabsUUIDs.includes(tabItem.uuid)
    );
    // Object.keys(findedTab).forEach(key => delete findedTab[key]);
    // Object.assign(findedTab, tab);
    tmpTabList.push(tab);
    console.log('tmpTabList findedTabs', tmpTabList);
  } else {
    tmpTabList.push(tab);
    console.log('tmpTabList not findedTabs', tmpTabList);
  }
  storage.setItem('savedTabList', JSON.stringify(tmpTabList));
}

async function fetchCurrentTabs(targetWindowId: number) {
  if (!targetWindowId) {
    return []; // 指定されていない場合リターン
  }
  let tabList: Array<any> = [];
  let tabGroups: Array<chrome.tabGroups.TabGroup> = [];
  // tabGroups = await chrome.tabGroups.query(QueryInWindow);
  tabGroups = await chrome.tabGroups.query({ windowId: targetWindowId });
  let tabs: Array<chrome.tabs.Tab> = [];
  // tabs = await chrome.tabs.query(QueryInWindow);
  tabs = await chrome.tabs.query({ windowId: targetWindowId });
  // console.log(tabs);
  // console.log('tabList before', tabList);
  tabList.splice(0, tabList.length); // 初期化
  // console.log('tabList after', tabList);
  for (const tab of tabs) {
    let tabObj: any = tab;
    // console.log(tab);
    let tabGroup = tabGroups.find((tabGroup) => tabGroup.id === tab.groupId);
    if (tabGroup) {
      // console.log('タブグループ');
      // タブグループ配下
      let tabGroupObj: any = tabGroup;
      let findedTabGroup: any = tabList.find(
        (tabItem: any) => tabItem.id === (tabGroup && tabGroup.id)
      );
      if (findedTabGroup) {
        // console.log('タブグループ追加済み');
        findedTabGroup.index = tabObj.index;
        Object.assign(findedTabGroup, tabGroup);
        // 既にタブグループを追加している場合
        let findedChildTabItem = findedTabGroup.childTabs.find(
          (tabItem: any) => tabItem.id === tabObj.id
        );
        if (findedChildTabItem) {
          Object.assign(findedChildTabItem, tabObj);
        } else {
          findedTabGroup.childTabs.push(tabObj);
        }
      } else {
        // console.log('タブグループ未追加');
        // タブグループがまだ追加されていない場合
        tabGroupObj.isGroup = true;
        tabGroupObj.index = tabObj.index;
        tabGroupObj.childTabs = [];
        tabGroupObj.childTabs.push(tabObj);
        tabList.push(tabGroupObj);
      }
    } else {
      // グループ以外
      // console.log('グループ以外');
      let findedTabItem = tabList.find((tabItem: any) => tabItem.id === tabObj.id);
      if (findedTabItem) {
        // console.log('タブ存在する', findedTabItem);
        Object.assign(findedTabItem, tabObj);
      } else {
        // console.log('タブ存在しない');
        tabList.push(tabObj);
      }
    }
  }
  // console.log('tabList after', tabList);
  return tabList;
}

/**
 * ストレージクラス<br/>
 * データ保存用クラス、chromeストレージAPIをラップ、キー情報管理
 */
class Storage {
  constructor() {
    // NOP
  }

  /**
   * ストレージ保存.
   * @param {string} key
   * @param {any} value
   */
  async setItem(key: string, value: any) {
    chrome.storage.local.set({ [key]: value }).then(() => {
      // console.log(`Set key: ${key} - value: ${value}`);
    });
  }

  /**
   * ストレージ情報取得.
   * @param {string} key
   * @returns - 返却データ
   */
  async getItem(key: string) {
    const item = await chrome.storage.local.get([key]).then((result) => {
      // console.log(`Get key: ${key} - value: ${result[key]}`);
      return result[key];
    });
    return item;
  }

  /**
   * ストレージ情報全削除.
   */
  clearAllItem() {
    chrome.storage.local.clear(() => {
      console.log(`Clear All Items`);
    });
  }
}
const storage = new Storage();
