/*
 * @Author: Leon
 * @Date: 2023-02-20 23:54:14
 * @LastEditors: 最后编辑
 * @LastEditTime: 2023-03-13 19:22:32
 * @description: 文件说明
 */
import { Dispatcher, resolveDispatcher } from './src/currentDispatcher';
import currentDispatcher from './src/currentDispatcher';
import { jsx, jsxDEV, isValidElement as isValidElementFn } from './src/jsx';

export const useState: Dispatcher['useState'] = (initialState) => {
	const dispatcher = resolveDispatcher();

	return dispatcher.useState(initialState);
};

// 内部数据共享层
export const __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = {
	currentDispatcher
};

export const version = '0.0.0-bate';

// TODO 根据环境区分使用 jsx/jsxDEV
export const createElement = jsx;
export const isValidElement = isValidElementFn;
