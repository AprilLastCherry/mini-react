/*
 * @Author: Leon
 * @Date: 2023-02-20 23:54:14
 * @LastEditors: 最后编辑
 * @LastEditTime: 2023-04-02 14:48:40
 * @description: 文件说明
 */
import { Dispatcher, resolveDispatcher } from './src/currentDispatcher';
import currentDispatcher from './src/currentDispatcher';
import { jsx, isValidElement as isValidElementFn } from './src/jsx';

export const useState: Dispatcher['useState'] = (initialState) => {
	/**
	 * 1. 创建FiberNode的时候，会将组件待执行的useState方法存放到dispatcher中
	 * 2. FiberNode.type是函数组件的待执行函数f App(){}, 执行后，会执行内部定义的各种Hook，并返回 jsx
	 * 3. 执行内部定义的 Hook时就会执行本函数，取出dispatcher存放的代执行函数，生成Hook
	 */
	const dispatcher = resolveDispatcher();

	return dispatcher.useState(initialState);
};

export const useEffect: Dispatcher['useEffect'] = (create, deps) => {
	const dispatcher = resolveDispatcher();

	return dispatcher.useEffect(create, deps);
};

// 内部数据共享层
export const __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = {
	currentDispatcher
};

export const version = '0.0.0-bate';

// TODO 根据环境区分使用 jsx/jsxDEV
export const createElement = jsx;
export const isValidElement = isValidElementFn;
