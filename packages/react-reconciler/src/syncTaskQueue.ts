/*
 * @Author: Leon
 * @Date: 2023-03-24 22:52:55
 * @LastEditors: 最后编辑
 * @LastEditTime: 2023-03-31 21:28:22
 * @description: 文件说明
 */
let syncQueue: ((...arg: any) => void)[] | null = null;
let isFlushingSyncQueue = false;

// 把更新的触发事件，暂存起来
export function scheduleSyncCallback(callback: (...arg: any) => void) {
	if (syncQueue === null) {
		syncQueue = [callback];
	} else {
		syncQueue.push(callback);
	}
}

export function flushSyncCallbacks() {
	if (!isFlushingSyncQueue && syncQueue) {
		isFlushingSyncQueue = true;
		try {
			// 待执行的调度函数
			syncQueue.forEach((cb) => cb());
		} catch (e) {
			if (__DEV__) {
				console.error('flushSyncCallbacks报错', e);
			}
		} finally {
			isFlushingSyncQueue = false;
			syncQueue = null;
		}
	}
}
