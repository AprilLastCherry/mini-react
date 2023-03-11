/*
 * @Author: Leon
 * @Date: 2023-02-28 23:41:29
 * @LastEditors: 最后编辑
 * @LastEditTime: 2023-03-07 16:32:30
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

// ReactDOM.createRoot(rootElement) 中的 createRoot 调用会触发，
export function createContainer(container: Container) {
	const hostRootFiber = new FiberNode(HostRoot, {}, null);
	// 将 FiberRootNode 和 hostRootFiber 联系起来
	const root = new FiberRootNode(container, hostRootFiber);

	hostRootFiber.updateQueue = createUpdateQueue(); // 创建一个update队列，值为null { shared: { pending: null } }

	return root;
}

// ReactDOM.createRoot(rootElement).render(<App />) 的 render 调用
export function updateContainer(
	element: ReactElementType | null,
	root: FiberRootNode
) {
	// 将 hostRootFiber 和普通 fiberNode 联系起来
	const hostRootFiber = root.current;
	// 为传入的reactElement创建一个update
	console.log('传入的', element, root);
	const update = createUpdate<ReactElementType | null>(element);

	// 队列中加入创建好的update，即hostRootFiber.updateQueue.shared.pending = update;
	enqueueUpdate(
		hostRootFiber.updateQueue as UpdateQueue<ReactElementType | null>,
		update
	);

	scheduleUpdateOnFiber(hostRootFiber);

	return element;
}
