import { logger } from "../logger.js";
import { browser } from "../puppeteer.js";
import { retry } from "../retryCode.js";



export const getWolframAlphaImage = async (query, _cfg = {}) => {

	// 创建一个页面
	const page = await browser.newPage();

	try{
		// 设置浏览器视窗
		page.setViewport({
			width: 1280,
			height: 720 * 4,
			deviceScaleFactor: 2,
		});

		// 输入网页地址
		let stat = await retry(async () => {
			await page.goto(`https://zh.wolframalpha.com/input?i=${encodeURIComponent(query)}`, {
				timeout: 15 * 1000,
				waitUntil: 'networkidle2',
			});
			return true;
		}, 2);
		if(!stat){
			logger.warn(`[getWolframAlphaImage] 启动失败`);
			return null;
		}

		await page.evaluate(() => new Promise((resolve, reject) => {
			try{

				const on = () => {
					// 等待这个元素里只剩一个 div 的时候
					// 调整网页样式
					const main = document.querySelector('body > div > div > main > main > div > div > div > section');
					document.querySelector('body > div > div > main > main > div > div > div > section > div').style = `display: none;`;
					main.style = `padding: 30px; border-radius: 0; margin: 50px -30px;`;
					main.id = 'screenshot';

					Array.from(main.querySelectorAll('section')).at(-1).style = 'border-color: #3d3d3d;'
					resolve();
				};

				const awaitLoad = () => {
					setTimeout(() => {
						const main = document.querySelector('body > div > div > main > main > div > div > div > section');
						if(main){
							const divEls = Array.from(main.querySelectorAll('section ~ div'));
							if(divEls.length === 1){
								on();
							}else{
								awaitLoad();
							}
						}

					}, 1000);
				};

				let timer = null;
				const observer = new MutationObserver((mutationsList, observer) => {
					if(timer !== null){
						clearTimeout(timer);
					}
					timer = setTimeout(() => {
						observer.disconnect();
						awaitLoad();
					}, 3000);
				});
				observer.observe(document.body, { attributes: true, childList: true, subtree: true });
				
			}catch(err){
				resolve(err);
			}
		}));

		const imagePath = `./data/temp/puppeteer/${Date.now()}.png`;
		const screenshot = await page.$('#screenshot');
		await screenshot.screenshot({
			path: imagePath,
			omitBackground: true,
			optimizeForSpeed: true,
			fullPage: false,
		});

		const textList = await page.evaluate(() => new Promise(async (resolve, reject) => {
			try{

				const tool = {

					sleep: async (time) => new Promise((resolve) => {setTimeout(resolve, time)}),

					sendTouchEvent: (x, y, element, eventType) => { // sendTouchEvent(5, 5, li, 'touchstart');
						const touchObj = new Touch({
							identifier: Date.now(),
							target: element,
							clientX: x,
							clientY: y,
							radiusX: 2.5,
							radiusY: 2.5,
							rotationAngle: 10,
							force: 0.5,
						});
						const touchEvent = new TouchEvent(eventType, {
							cancelable: true,
							bubbles: true,
							touches: [touchObj],
							targetTouches: [],
							changedTouches: [touchObj],
							shiftKey: true,
						});
						element.dispatchEvent(touchEvent);
					},
				};

				const main = document.querySelector('body > div > div > main > main > div > div > div > section');

				const outList = [];
				
				const sectionList = Array.from(main.querySelectorAll('section'));
				for(const li of sectionList){
					tool.sendTouchEvent(5, 5, li, 'touchstart');

					await tool.sleep(50);

					const btnList = Array.from(li.querySelectorAll('ul > li > button'));
					for(const btn of btnList){
						if(btn.innerText !== 'Plain Text'){
							continue;
						}

						btn.click();
						await tool.sleep(50);

						const textBtn = main.querySelector('section > div > div > button[tabindex="0"]');
						if(textBtn){
							
							outList.push({
								title: li.querySelector('h2').innerText,
								text: textBtn.innerText,
							});

							// li.querySelector('section > header > button[aria-label="Close"]').click();
						}
					}
				}

				resolve(outList);
			}catch(err){
				resolve(err);
			}
		}));
		

		// 关闭页面
		// await
		page.close();

		return {
			path: imagePath,
			textList: textList,
		};
	}catch(err){
		logger.error(`[Puppeteer]`, err);
	}

	page.close();
	return null;
};

// console.log(await getWolframAlphaImage(`y''+3x*y'+6y=exp(3x)*sin(2x+π/6)`));
