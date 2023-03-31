/*
 * @Author: Leon
 * @Date: 2023-02-25 21:28:28
 * @LastEditors: 最后编辑
 * @LastEditTime: 2023-03-31 16:23:35
 * @description: 文件说明
 */
import { Dispatch } from 'react/src/currentDispatcher';
import { Action } from 'shared/ReactTypes';
import { Lane } from './fiberLanes';

export interface Update<State> {
	action: Action<State>;
	lane: Lane;
	next: Update<State> | null;
}

export interface UpdateQueue<State> {
	shared: {
		pending: Update<State> | null;
	};
	dispatch: Dispatch<State> | null;
}

export const createUpdate = <State>(
	action: Action<State>,
	lane: Lane
): Update<State> => {
	return {
		action,
		lane,
		next: null
	};
};

export const createUpdateQueue = <State>() => {
	return {
		shared: {
			pending: null
		},
		dispatch: null
	} as UpdateQueue<State>;
};

// 更改update
export const enqueueUpdate = <State>(
	updateQueue: UpdateQueue<State>,
	update: Update<State>
) => {
	const pending = updateQueue.shared.pending;
	// 形成环状链表, pending最终指向最后update，最后的update指向第一个update，形成环
	if (pending === null) {
		update.next = update;
	} else {
		update.next = pending.next;
		pending.next = update;
	}
	updateQueue.shared.pending = update;
};

// 传入一个当前的state和一个要比较的state（pendingUpdate）， 返回一个新的state
export const processUpdateQueue = <State>(
	baseState: State,
	pendingUpdate: Update<State> | null,
	renderLane: Lane
): {
	memoizedState: State;
} => {
	// 旧的State赋值
	const result: ReturnType<typeof processUpdateQueue<State>> = {
		memoizedState: baseState
	};
	// 存在新的更新值，判断是函数还是新State，如果是函数，直接调用，否则直接赋值
	if (pendingUpdate !== null) {
		// 第一个lane
		const first = pendingUpdate.next;
		// 从第一个开始
		let pending = pendingUpdate.next as Update<any>;

		do {
			const updateLane = pending.lane;
			// 是当前传入的批处理任务类型
			if (updateLane === renderLane) {
				const action = pending.action;

				if (action instanceof Function) {
					// baseState 1 update () => {}
					baseState = action(baseState);
				} else {
					// baseState 1 update 2 -> memoizedState 2
					baseState = action;
				}
			} else {
				if (__DEV__) {
					console.warn('不应该进入lane');
				}
			}
			// 执行下一个update
			pending = pending.next as Update<State>;
		} while (pending !== first);
	}

	// 批处理后最终的结果
	result.memoizedState = baseState;
	// 没有新的更新值，保留旧的值
	return result;
};
