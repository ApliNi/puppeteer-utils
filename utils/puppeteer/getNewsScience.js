import { logger } from "../logger.js";
import { browser } from "../puppeteer.js";
import { retry } from "../retryCode.js";


export const getNewsScience = async () => {

	// 创建一个页面
	const page = await browser.newPage();

	try{
		// 设置浏览器视窗
		page.setViewport({
			width: 1280,
			height: 720,
		});

		await retry(async () => {
			await page.goto(`https://www.science.org/news/all-news`, {
				timeout: 30 * 1000,
				waitUntil: 'networkidle2',
				referer: 'https://www.google.com.hk/',
			});
		}, 10);

		const data = await page.evaluate(() => {

			const data = [];

			const newsList = Array.from(document.querySelectorAll('.titles-results > article'));
			for(const news of newsList){
				try{
					const time = new Date(news.querySelector('div.card-meta > time').innerText.trim()).getTime();
					const title = news.querySelector('h3.card__title').innerText.trim();
					const desc = news.querySelector('.card-body')?.innerText?.trim() || '';
					const link = news.querySelector('h3.card__title > a').href;

					data.push({ time, title, desc, link, type: 'Science' });
				}catch(ignoreError){}
			}

			return data;
		});

		// 关闭页面
		// await
		page.close();

		return data;
	}catch(err){
		logger.error(`[Puppeteer]`, err);
	}

	page.close();
	return null;
};

export const getNewsBodyScience = async (link) => {


	// 创建一个页面
	const page = await browser.newPage();

	try{
		// 设置浏览器视窗
		page.setViewport({
			width: 1280,
			height: 720,
		});

		await retry(async () => {
			await page.goto(link, {
				timeout: 30 * 1000,
				waitUntil: 'networkidle0',
				referer: `https://www.science.org/news/all-news`,
			});
		}, 10);

		const textList = await page.evaluate(() => {

			const setList = new Set();

			const mainDom = document.querySelector("#pb-page-content main div div div div article > div.bodySection");
			if(mainDom){
				setList.add(mainDom.textContent.trim().replace(/\s+/, ' '));
			}else{
				const list = Array.from(document.querySelectorAll('p, h1, h2, h3, h4, h5, h6'));
				for(const li of list){
					setList.add(li.textContent.trim().replace(/\s+/, ' '));
				}
			}

			return Array.from(setList);
		});

		// 关闭页面
		page.close();

		const bodyStr = textList.join('\n');

		return bodyStr;
	}catch(err){
		logger.error(`[Puppeteer]`, err);
	}

	page.close();
	return null;
};
