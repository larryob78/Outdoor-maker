import {defineConfig,devices} from '@playwright/test';
const port=Number(process.env.OUTDOOR_PORT??48273);
const url='http://127.0.0.1:'+port;
export default defineConfig({
  testDir:'./tests',testMatch:'*.spec.js',timeout:60000,workers:1,
  use:{baseURL:url,...devices['Desktop Chrome'],
    channel:process.env.OUTDOOR_CHROME?'chrome':undefined},
  webServer:{command:'npm run build && npm run preview -- --host 127.0.0.1 --port '+port+' --strictPort',
    url,timeout:30000},
});
