import { logger } from "../logger.js";
import { browser } from "../puppeteer.js";
import { retry } from "../retryCode.js";


export const getNewsNature = async () => {

	// 创建一个页面
	const page = await browser.newPage();

	try{
		// 设置浏览器视窗
		page.setViewport({
			width: 1280,
			height: 720,
		});

		await retry(async () => {
			await page.goto(`https://www.nature.com/news`, {
				timeout: 30 * 1000,
				waitUntil: 'networkidle2',
				referer: 'https://www.google.com.hk/',
			});
		}, 10);

		const data = await page.evaluate(() => {

			const data = [];

			const newsList = Array.from(document.querySelectorAll('.c-card__container'));
			for(const news of newsList){
				try{
					const time = new Date(news.querySelector('span.c-card__date').innerText.trim()).getTime();
					const title = news.querySelector('h3.c-card__title').innerText.trim();
					const desc = news.querySelector('.c-card__standfirst')?.innerText?.trim() || '';
					const link = news.querySelector('.c-card__container > a').href;
	
					data.push({ time, title, desc, link, type: 'Nature' });
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

export const getNewsBodyNature = async (link) => {


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
				referer: `https://www.nature.com/news`,
			});
		}, 10);

		const textList = await page.evaluate(() => {

			const setList = new Set();

			const mainDom = document.querySelector("#content > div.container-type-article > main > article > div.c-article-body.main-content");
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
