
import { logger } from "../logger.js";
import { browser } from "../puppeteer.js";



export const itDogPingImage = async (func = 'ping', host, ipv6 = false) => {

	// 创建一个页面
	const page = await browser.newPage();

	try{
		// 设置浏览器视窗
		page.setViewport({
			width: 1280,
			height: 720,
			deviceScaleFactor: 1.5,
		});

		if(['ping', 'tcp', 'http'].includes(func)){

			if(func === 'tcp'){
				func = 'tcping';
			}

			await page.goto(`https://www.itdog.cn/${func}${ipv6 ? '_ipv6' : ''}/`, {
				timeout: 15 * 1000,
				waitUntil: 'networkidle0',	// 500 毫秒后, 不再有网络连接时触发
				referer: 'https://www.google.com.hk/',
			});

			await page.locator('.page-wrapper input[type="text"]').fill(host);

			await page.click('.page-wrapper button.btn-primary');

			await page.waitForNavigation({ waitUntil: 'load' });
			await page.waitForSelector('.page-wrapper');

			// 等待进度条完成
			await page.evaluate(() => new Promise((resolve, reject)  => {
				const interval = setInterval(() => {
					const schedule = document.querySelector('.page-wrapper #complete_progress');
					if(schedule){
						if(schedule.innerText.includes('100%')){
							clearInterval(interval);
							resolve();
						}
					}
				}, 200);
				setTimeout(() => {
					clearInterval(interval);
					resolve();
				}, 20 * 1000);
			}));

			// 编辑页面, 使其易于截图
			await page.evaluate(() => {

				// 关闭所有广告, 这里使用官方的方法
				document.querySelectorAll('.gg_link').forEach(el => el.remove());

				// 移除顶部导航栏
				document.querySelector('.page-wrapper .page-header').remove();
				// 移除截图按钮
				document.querySelector('.page-wrapper #takeScreenshot')?.remove();
				// 点击查看错误数据的按钮
				document.querySelector('.page-wrapper .float-left input[value="6"]')?.click();

				// 添加样式
				document.querySelector('.page-wrapper').style = `
					padding: 20px 5px;
					width: calc(100% + 10px);
				`;
			});
		}

		const imagePath = `./data/temp/puppeteer/${Date.now()}.png`;


		// 截图
		const screenshot = await page.$('.page-wrapper');
		await screenshot.screenshot({
			path: imagePath,
			omitBackground: true,
			optimizeForSpeed: true,
			fullPage: false,
		});

		// await sleep(100 * 1000);
	
		page.close();

		return imagePath;
	}catch(err){
		logger.error(`[Puppeteer]`, err);
	}

	page.close();
	return null;
};
