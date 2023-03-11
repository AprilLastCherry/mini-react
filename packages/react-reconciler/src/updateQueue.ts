/*
 * @Author: Leon
 * @Date: 2023-02-25 21:28:28
 * @LastEditors: 最后编辑
 * @LastEditTime: 2023-03-11 19:19:45
 * @description: 文件说明
 */
import { Dispatch } from 'react/src/currentDispatcher';
import { Action } from 'shared/ReactTypes';

export interface Update<State> {
	action: Action<State>;
}

export interface UpdateQueue<State> {
	shared: {
		pending: Update<State> | null;
	};
	dispatch: Dispatch<State> | null;
}

export const createUpdate = <State>(action: Action<State>): Update<State> => {
	return {
		action
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
	updateQueue.shared.pending = update;
};

// 传入一个当前的state和一个要比较的state（pendingUpdate）， 返回一个新的state
export const processUpdateQueue = <State>(
	baseState: State,
	pendingUpdate: Update<State> | null
): {
	memoizedState: State;
} => {
	// 旧的State赋值
	const result: ReturnType<typeof processUpdateQueue<State>> = {
		memoizedState: baseState
	};

	// 存在新的更新值，判断是函数还是新State，如果是函数，直接调用，否则直接赋值
	if (pendingUpdate !== null) {
		const action = pendingUpdate.action;
		if (action instanceof Function) {
			// baseState 1 update () => {}
			result.memoizedState = action(baseState);
		} else {
			// baseState 1 update 2 -> memoizedState 2
			result.memoizedState = action;
		}
	}

	// 没有新的更新值，保留旧的值
	return result;
};
