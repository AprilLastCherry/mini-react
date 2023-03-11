/*
 * @Author: Leon
 * @Date: 2023-03-08 12:14:10
 * @LastEditors: 最后编辑
 * @LastEditTime: 2023-03-08 12:16:47
 * @description: 文件说明
 */
import { FiberNode } from './fiber';

export function renderWithHooks(wip: FiberNode) {
	const { type: Component, pendingProps } = wip;

	const children = Component(pendingProps);

	return children;
}
