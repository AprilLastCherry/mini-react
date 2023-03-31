/*
 * @Author: Leon
 * @Date: 2023-02-22 20:58:47
 * @LastEditors: 最后编辑
 * @LastEditTime: 2023-03-24 22:16:05
 * @description: 文件说明
 */
import { Props, Key, Ref, ReactElementType } from 'shared/ReactTypes';
import {
	Fragment,
	FunctionComponent,
	HostComponent,
	WorkTag
} from './workTags';
import { Flags, NoFlags } from './fiberFlags';
import { Container } from 'hostConfig';
import { Lane, Lanes, NoLane, NoLanes } from './fiberLanes';

// 介于ReactElment和DomELement之间的数据FiberNode，FiberNode用来关联两者，Reconciler算法操作fiberNode去调度协调两者
export class FiberNode {
	type: any;
	tag: WorkTag;
	pendingProps: Props;
	key: Key;
	// 真实dom数据
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
	subtreeFlags: Flags;
	deletions: FiberNode[] | null;
	updateQueue: unknown;

	constructor(tag: WorkTag, pendingProps: Props, key: Key) {
		this.tag = tag;
		this.key = key || null;
		this.ref = null;

		// 对于HostComponent来说，比如jsx的<div>中的stateNode保存的就是div的Dom
		this.stateNode = null;
		// FiberNode类型， 对于FunctionComponent来说，表示本身() => {}
		this.type = null;

		/** 构成树状结构 */
		// 指向父FiberNode
		this.return = null;
		// 指向兄弟FiberNode
		this.sibling = null;
		// 指向子FiberNode
		this.child = null;
		// 同级的FiberNode, 当前FiberNode的下标
		this.index = 0;

		/** 作为工作单元 */
		// 作为工作单元，刚开始工作的时候的Props
		this.pendingProps = pendingProps;
		// 工作完成后确定下来的Props
		this.memoizedProps = null;
		this.memoizedState = null;
		// 用于真实UI树，和wip树的切换，如果当前是current当前的FiberNode树，指向Wip的FiberNode，反之亦然，双缓存技术
		this.alternate = null;
		this.updateQueue = null;

		// 副作用
		this.flags = NoFlags;
		this.subtreeFlags = NoFlags;
		this.deletions = null;
	}
}

// 根节点，将 FiberRootNode 和 hostRootFiber 联系起来
export class FiberRootNode {
	container: Container;
	current: FiberNode;
	finishedWord: FiberNode | null; //？？
	pendingLanes: Lanes;
	finishedLane: Lane;
	constructor(container: Container, hostRootFiber: FiberNode) {
		this.container = container;
		// FiberRootNode的子节点事hostRootFiber，用current联系起来
		this.current = hostRootFiber;
		// hostRootFiber的stateNode表示父节点，用来联系FiberRootNode
		hostRootFiber.stateNode = this;
		this.finishedWord = null;
		this.pendingLanes = NoLanes;
		this.finishedLane = NoLane;
	}
}

/**
 * 使用原有的fiberNode，传入新的props值，创建一个新的fiberNode作为工作单元判断更新逻辑，命名为workInProgress
 * @param current root.current就是hostRootFiber
 * @param pendingProps 更新的值
 * @returns hostRootFiber 的工作单元 wip（FiberNode）
 */
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

		// 当前的节点，创建出新的fiberNode，当前fiberNode就是过去式了
		wip.alternate = current;
		// 双缓存绑定
		current.alternate = wip;
	} else {
		// update
		wip.pendingProps = pendingProps;
		// 副作用的东西清除掉，是上一次遗留的内容
		wip.flags = NoFlags;
		wip.subtreeFlags = NoFlags;
		wip.deletions = null;
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
		// 比如<div>的type就是'div'
		fiberTag = HostComponent;
	} else if (typeof type !== 'function' && __DEV__) {
		console.warn('为定义的type类型', element);
	}

	const fiber = new FiberNode(fiberTag, props, key);
	fiber.type = type;
	return fiber;
}

export function createFiberFromFragment(elements: any[], key: Key): FiberNode {
	const fiber = new FiberNode(Fragment, elements, key);
	return fiber;
}
