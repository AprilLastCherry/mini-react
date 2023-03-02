/*
 * @Author: Leon
 * @Date: 2023-02-22 20:58:47
 * @LastEditors: 最后编辑
 * @LastEditTime: 2023-03-02 15:48:39
 * @description: 文件说明
 */
import { Props, Key, Ref, ReactElementType } from 'shared/ReactTypes';
import { FunctionComponent, HostComponent, WorkTag } from './workTags';
import { Flags, NoFlags } from './fiberFlags';
import { Container } from 'hostConfig';

export class FiberNode {
	type: any;
	tag: WorkTag;
	pendingProps: Props;
	key: Key;
	stateNode: any;
	ref: Ref;

	return: FiberNode | null;
	sibling: FiberNode | null;
	child: FiberNode | null;
	index: number;

	memoizedProps: Props | null;
	memoizedState: any;
	alternate: FiberNode | null;
	flags: Flags;
	updateQueue: unknown;

	constructor(tag: WorkTag, pendingProps: Props, key: Key) {
		this.tag = tag;
		this.key = key;
		this.ref = null;

		// HostComponent <div> div Dom
		this.stateNode = null;
		// FiberNode类型 FunctionComponent () => {}
		this.type = null;

		/** 构成树状结构 */
		// 指向父FiberNode
		this.return = null;
		// 指向兄弟FiberNode
		this.sibling = null;
		// 指向子FiberNode
		this.child = null;
		// 同级的FiberNode, 当前的FiberNode是下标
		this.index = 0;

		/** 作为工作单元 */
		this.pendingProps = pendingProps;
		this.memoizedProps = null;
		this.memoizedState = null;
		this.alternate = null;
		this.updateQueue = null;

		// 副作用
		this.flags = NoFlags;
	}
}

// 根节点，将 FiberRootNode 和 hostRootFiber 联系起来
export class FiberRootNode {
	container: Container;
	current: FiberNode;
	finishedWord: FiberNode | null; //？？
	constructor(container: Container, hostRootFiber: FiberNode) {
		this.container = container;
		// FiberRootNode的子节点事hostRootFiber，用current联系起来
		this.current = hostRootFiber;
		// hostRootFiber的stateNode表示父节点，用来联系FiberRootNode
		hostRootFiber.stateNode = this;
		this.finishedWord = null;
	}
}

export const createWorkInProgress = (
	current: FiberNode,
	pendingProps: Props
): FiberNode => {
	let wip = current.alternate;

	// 首屏渲染的时候 workInProgress 为 null
	if (wip === null) {
		// mount
		wip = new FiberNode(current.tag, pendingProps, current.key); // hostRootFiber
		wip.type = current.type;
		wip.stateNode = current.stateNode;

		wip.alternate = current;
		current.alternate = wip;
	} else {
		// update
		wip.pendingProps = pendingProps;
		// 副作用的东西清楚掉，是上一次遗留的内容
		wip.flags = NoFlags;
	}

	wip.type = current.type;
	wip.updateQueue = current.updateQueue;
	wip.child = current.child;
	wip.memoizedProps = current.memoizedProps;
	wip.memoizedState = current.memoizedState;

	return wip;
};

// 用reactElement创建fiberNode
export function createFiberFromElement(element: ReactElementType) {
	const { type, key, props } = element;
	let fiberTag: WorkTag = FunctionComponent;
	if (typeof type === 'string') {
		// <div> type 'div'
		fiberTag = HostComponent;
	} else if (typeof type !== 'function' && __DEV__) {
		console.warn('为定义的type类型', element);
	}

	const fiber = new FiberNode(fiberTag, props, key);
	fiber.type = type;
	return fiber;
}
