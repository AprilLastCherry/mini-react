import { FiberNode } from 'react-reconciler/src/fiber';
import { HostComponent, HostText } from 'react-reconciler/src/workTags';
import { Props } from 'shared/ReactTypes';
import { DOMElement, updateFiberProps } from './SyntheticEvent';

/*
 * @Author: Leon
 * @Date: 2023-03-06 17:23:23
 * @LastEditors: 最后编辑
 * @LastEditTime: 2023-03-24 23:03:30
 * @description: 文件说明
 */
export type Container = Element;
export type Instance = Element;
export type TextInstance = Text;

// 模拟创建离屏dom , todo props
export const createInstace = (type: string, props: Props): Instance => {
	// TODO 处理props
	const element = document.createElement(type) as unknown;
	updateFiberProps(element as DOMElement, props);
	return element as DOMElement;
};

// 模拟创建插入dom
export const appendInitialChild = (
	parent: Instance | Container,
	child: Instance
) => {
	parent.appendChild(child);
};

// 模拟创建插入dom
export const createTextInstace = (content: string) => {
	return document.createTextNode(content);
};

export const appendChildToContainer = appendInitialChild;

export function commitUpdate(fiber: FiberNode) {
	switch (fiber.tag) {
		case HostText: {
			const text = fiber.memoizedProps?.content;
			return commitTextUpdate(fiber.stateNode, text);
		}
		case HostComponent:
			// updateFiberProps(fiber.stateNode);
			return;
		default:
			if (__DEV__) {
				console.warn('为实现的Update类型', fiber);
			}
			break;
	}
}

export function commitTextUpdate(textInstance: TextInstance, content: string) {
	textInstance.textContent = content;
}

export function removeChild(
	child: Instance | TextInstance,
	container: Container
) {
	container.removeChild(child);
}

export function insertChildToContainer(
	child: Instance,
	container: Container,
	before: Instance
) {
	container.insertBefore(child, before);
}

// 创建微任务，实在没有创建宏任务
export const scheduleMicroTask =
	typeof queueMicrotask === 'function'
		? queueMicrotask
		: typeof Promise === 'function'
		? (callback: (...arg: any) => void) => Promise.resolve(null).then(callback)
		: setTimeout;
