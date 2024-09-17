import { logger } from "./logger.js";


/**
 * 具有重试和错误回调的出错时重试方法
 * @param {Function} fn - 需要运行并在出错时重试的函数
 * @param {Number} [retries=4] - 最大重试次数
 * @param {Function} [errCallback=() => {}] - 错误回调函数
 */
export const retry = async (fn, retries = 4, errCallback = () => {}) => {
	let count = 0;

	while(true){
		if(count >= retries){
			break;
		}

		try{
			let v = await fn();
			return v;
		}catch(err){
			logger.warn(`[Retry] [${count}]`, err);
			await errCallback(err, count);
		}
		
		count++;
	}

	return null;
};
