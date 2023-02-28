/*
 * @Author: Leon
 * @Date: 2023-02-28 23:41:29
 * @LastEditors: 最后编辑
 * @LastEditTime: 2023-03-01 00:05:20
 * @description: 文件说明
 */
import { Container } from 'hostConfig';
import { ReactElementType } from 'shared/ReactTypes';
import { FiberNode, FiberRootNode } from './fiber';
import {
	createUpdate,
	createUpdateQueue,
	enqueueUpdate,
	UpdateQueue
} from './updateQueue';
import { scheduleUpdateOnFiber } from './workLoop';
import { HostRoot } from './workTags';

// ReactDOM.createRoot(rootElement) 中的 createRoot 调用
export function createContainer(container: Container) {
	const hostRootFiber = new FiberNode(HostRoot, {}, null);
	const root = new FiberRootNode(container, hostRootFiber);

	hostRootFiber.updateQueue = createUpdateQueue();

	return root;
}

// ReactDOM.createRoot(rootElement).render(<App />) 的 render 调用
export function updateContainer(
	element: ReactElementType | null,
	root: FiberRootNode
) {
	const hostRootFiber = root.current;
	const update = createUpdate<ReactElementType | null>(element);

	// 队列中加入创建好的updateQueue
	enqueueUpdate(
		hostRootFiber.updateQueue as UpdateQueue<ReactElementType | null>,
		update
	);

	scheduleUpdateOnFiber(hostRootFiber);

	return element;
}
