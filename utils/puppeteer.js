
import puppeteer from "puppeteer-extra";
import path from "path";
import { logger } from "./logger.js";
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import AdblockerPlugin from "puppeteer-extra-plugin-adblocker";
import AnonymizePlugin from 'puppeteer-extra-plugin-anonymize-ua';

puppeteer
	.use(StealthPlugin())
	.use(AnonymizePlugin())
	.use(AdblockerPlugin({
		blockTrackers: true,
		blockTrackersAndAnnoyances: true,
		cacheDir: path.resolve('./utils/puppeteer/cache/AdblockerPlugin/'),
	}))
;

// 扩展程序
const extensions = [
	// path.resolve('./utils/puppeteer/chromePlugins/SwitchyOmega/'),
	// path.resolve('./utils/puppeteer/chromePlugins/tampermonkey_beta/'),
];

// 启动浏览器
export const browser = await puppeteer.launch({
	// 无头模式
	headless: false,
	headless: 'new',
	userDataDir: path.resolve('./utils/puppeteer/chromeData/'),
	args: [
		// 加载扩展
		// `--disable-extensions-except=${extensions.join(',')}`,
		// `--load-extension=${extensions.join(',')}`,

		// `--user-agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36"`,
	],
	ignoreDefaultArgs: [ '--disable-extensions' ],
});

// 关闭浏览器
process.on('exit', async () => {
	if(browser){
		await browser.close();
		logger.mark(`[Puppeteer] 关闭浏览器`);
	}
});

logger.mark(`[Puppeteer] 加载完成`);
