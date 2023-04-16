/*
 * @Author: Leon
 * @Date: 2023-03-11 15:21:03
 * @LastEditors: 最后编辑
 * @LastEditTime: 2023-04-02 14:48:29
 * @description: 文件说明
 */

import { Action } from 'shared/ReactTypes';

export type Dispatch<State> = (action: Action<State>) => void;

export interface Dispatcher {
	useState: <T>(initialState: (() => T) | T) => [T, Dispatch<T>];
	useEffect: (callback: () => void, deps: any[] | void) => void;
}

const currentDispatcher: { current: Dispatcher | null } = {
	current: null
};

export const resolveDispatcher = (): Dispatcher => {
	const dispatcher = currentDispatcher.current;

	// 直接使用useState时没有值的，currentDispatcher.current在函数组件FunctionCompent创建的时候才会被赋值，才会有值
	if (dispatcher === null) {
		throw new Error('hook只能在函数组件中执行');
	}

	return dispatcher;
};

export default currentDispatcher;
