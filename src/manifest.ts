import fs from 'fs-extra';
import type { Manifest } from 'webextension-polyfill';
import type PkgType from '../package.json';
import { r } from '../scripts/utils';

type ManifestV3 = Manifest.WebExtensionManifest & {
  host_permissions?: string[];
};

// v2, v3で共通のプロパティ
const getSharedManifest = async () => {
  const pkg = (await fs.readJSON(r('package.json'))) as typeof PkgType;
  const manifest: Partial<ManifestV3> = {
    // name: 'Tab Group Keeper',
    name: pkg.name,
    version: pkg.version,
    default_locale: 'en',
    description: pkg.description,
    options_ui: {
      page: './dist/options/index.html',
      open_in_tab: true,
    },
    icons: {
      16: './assets/icon-256.png',
      48: './assets/icon-256.png',
      128: './assets/icon-256.png',
    },
    // content_scripts: [
    //   {
    //     matches: ['https://qiita.com/*/items/*'],
    //     js: ['./dist/contentScripts/index.global.js'],
    //   },
    // ],
    content_security_policy: {
      extension_pages: "script-src 'self'; object-src 'self';",
      sandbox:
        "sandbox allow-scripts allow-forms allow-popups allow-modals; script-src 'self' 'unsafe-inline' 'unsafe-eval'; child-src 'self';",
    },
  };

  return manifest;
};

export async function getManifest() {
  const manifest = await getSharedManifest();
  const browserAction = {
    default_icon: './assets/icon-256.png',
    default_popup: './dist/popup/index.html',
  };
  const permissions = {
    type: ['storage', 'tabs', 'favicon'],
    host: ['http://*/', 'https://*/'],
  };

  // v2はコメントアウト
  // if (isDev) {
  //   // デバッグビルド
  //   return {
  //     ...manifest,
  //     manifest_version: 2,
  //     browser_action: browserAction,
  //     background: {
  //       page: './dist/background/index.html',
  //       persistent: false,
  //     },
  //     permissions: [...permissions.type, ...permissions.host, 'webNavigation'],
  //     options_ui: {
  //       ...manifest.options_ui,
  //       chrome_style: false,
  //     },
  //     content_security_policy: `script-src \'self\' http://localhost:${port}; object-src \'self\'`,
  //   };
  // } else {

  // リリースビルド (ViteでHMRを使っているが、chrome manifest v3 では外部リソースを読み込めないためnodemonでビルドさせる)
  return {
    ...manifest,
    manifest_version: 3,
    action: browserAction,
    background: {
      service_worker: './dist/background/index.global.js',
    },
    permissions: permissions.type,
    // host_permissions: permissions.host,
    web_accessible_resources: [
      {
        resources: ['assets/*', 'dist/*', '_favicon/*'],
        matches: ['http://*/*', 'https://*/*'],
      },
    ],
    // };
  };
}
