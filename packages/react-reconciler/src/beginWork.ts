/*
 * @Author: Leon
 * @Date: 2023-02-25 16:29:10
 * @LastEditors: 最后编辑
 * @LastEditTime: 2023-03-28 11:53:25
 * @description: 文件说明
 */
import { ReactElementType } from 'shared/ReactTypes';
import { mountChildFibers, reconcilerChildFibers } from './childFibers';
import { FiberNode } from './fiber';
import { renderWithHooks } from './fiberHooks';
import { Lane } from './fiberLanes';
import { processUpdateQueue, UpdateQueue } from './updateQueue';
import {
	FunctionComponent,
	HostComponent,
	HostRoot,
	HostText,
	Fragment
} from './workTags';

// 递归中的递阶段
export const beginWork = (wip: FiberNode, renderLane: Lane) => {
	// 比较，返回 wip 工作单元的子节点 childFiberNode
	switch (wip.tag) {
		case HostRoot:
			return updateHostRoot(wip, renderLane);
		case HostComponent:
			return updateHostComponent(wip);
		case HostText:
			return null;
		case FunctionComponent:
			return updateFunctionComponent(wip, renderLane);
		case Fragment:
			return updateFragment(wip);
		default:
			if (__DEV__) {
				console.warn('beginWork未实现的类型', wip.tag);
			}
			return null;
	}
};

function updateFragment(wip: FiberNode) {
	const nextChildren = wip.pendingProps;
	reconcilerChildren(wip, nextChildren);
	return wip.child;
}

// 根节点的子节点
function updateHostRoot(wip: FiberNode, renderLane: Lane) {
	const baseState = wip.memoizedState;
	const updateQueue = wip.updateQueue as UpdateQueue<Element>;
	const pending = updateQueue.shared.pending;

	updateQueue.shared.pending = null;

	// 新的pending值替换旧的baseState
	const { memoizedState } = processUpdateQueue(baseState, pending, renderLane);

	wip.memoizedState = memoizedState;

	const nextChildren = wip.memoizedState;

	// nextChildren 是 ReactElementType对象，生成fiberNode后赋值给wip.child
	reconcilerChildren(wip, nextChildren);

	return wip.child;
}

// 普通组件节点的子节点，存在于 props.children 当中
function updateHostComponent(wip: FiberNode) {
	// ReactElementType 中的 props
	const nextProps = wip.pendingProps;
	// 当前 fiberNode 中的 pendingProps是一个 ReactElementType ，取里面的 children ，也是一个 ReactElementType ，用来生成新的fiberNode
	const nextChildren = nextProps.children;
	reconcilerChildren(wip, nextChildren);

	return wip.child;
}

function updateFunctionComponent(wip: FiberNode, renderLane: Lane) {
	const nextChildren = renderWithHooks(wip, renderLane);
	reconcilerChildren(wip, nextChildren);

	return wip.child;
}

// 将表示DOM结构数据的JSX Object用于创建fiberNode，让创建的fiberNode与节点信息关联，通过判断wip的alternate存在与否得知当前是mount还是update
// hostRootFiber初始化时特殊处理过，一开始就存在alternate，因为hostRootFiber和FiberRootNode对应的DOM结果都是已经存在于html中的<div id="root">
function reconcilerChildren(wip: FiberNode, children?: ReactElementType) {
	const current = wip.alternate;

	if (current !== null) {
		// update
		// console.log('reconcilerChildren update', children);
		wip.child = reconcilerChildFibers(wip, current?.child, children);
	} else {
		// mount
		// console.log('reconcilerChildren mount', children);
		wip.child = mountChildFibers(wip, null, children);
	}
}
