import { logger } from "../logger.js";
import { browser } from "../puppeteer.js";



export const webSearch = async (searchText) => {

	// 创建一个页面
	const page = await browser.newPage();

	try{
		// 设置浏览器视窗
		page.setViewport({
			width: 1280,
			height: 720,
		});

		// 输入网页地址
		try{
			await page.goto(`https://cn.bing.com/search?q=${encodeURIComponent(searchText)}`, {
				timeout: 15 * 1000,
				waitUntil: 'networkidle2',
			});
		}catch(err){
			logger.warn(`[Puppeteer] 等待超时:`, err.message);
		}

		const data = await page.evaluate(() => new Promise((resolve, reject) => {

			// 平滑滚动到底部, 使页面内容正确渲染
			window.scrollTo({
				left: 0,
				top: document.documentElement.scrollHeight - window.innerHeight,
				behavior:'smooth'
			});

			setTimeout(() => {

				const data = {
					// summarize: '',
					// list: [
					// 	{title: '', describe: '', url: ''}
					// ],
				};

				const summarize = document.querySelector("#b_context > li:nth-child(1) > div.b_entityTP > div.b_sideBleed > div")?.innerText;
				if(summarize){
					data.summarize = summarize;
				}

				const list = Array.from(document.querySelector("#b_results").querySelectorAll('li.b_algo'));
				if(list){
					data.list = [];
					for(const li of list){
						if(li.querySelector('span.algoSlug_icon')){
							li.querySelector('span.algoSlug_icon').remove();
						}
						const url = li.querySelector('a.tilk')?.href;
						if(!url){
							continue;
						}
						data.list.push({
							title: li.querySelector('h2').innerText,
							describe: li.querySelector('div.b_caption').innerText,
							url: url,
						});
					}
				}

				resolve(data);
			}, 700);
		}));
		
		page.close();

		return data;
	}catch(err){
		logger.error(`[Puppeteer]`, err);
	}

	page.close();
	return null;
};

// logger.info(await webSearch('你好'));
