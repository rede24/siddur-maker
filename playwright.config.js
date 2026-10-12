import {defineConfig} from '@playwright/test';
export default defineConfig({
  testDir:'./tests/browser',timeout:60000,workers:2,
  reporter:[['list']],
  use:{baseURL:'http://127.0.0.1:4173',viewport:{width:390,height:844},hasTouch:true,deviceScaleFactor:2,serviceWorkers:'block',screenshot:'only-on-failure',trace:'retain-on-failure'},
  projects:[{name:'chromium',use:{browserName:'chromium'}},{name:'webkit',use:{browserName:'webkit'}}],
  webServer:{command:'python3 -m http.server 4173 --directory public',port:4173,reuseExistingServer:!process.env.CI}
});
