/*
 * @Author: Leon
 * @Date: 2023-02-25 16:31:52
 * @LastEditors: 最后编辑
 * @LastEditTime: 2023-03-31 16:33:59
 * @description: 文件说明
 */
import { scheduleMicroTask } from 'hostConfig';
import { beginWork } from './beginWork';
import { commitMutationEffects } from './commitWork';
import { completeWork } from './completeWork';
import { createWorkInProgress, FiberNode, FiberRootNode } from './fiber';
import { MutationMask, NoFlags } from './fiberFlags';
import {
	getHighestPriorityLane,
	Lane,
	markRootFinished,
	mergeLanes,
	NoLane,
	SyncLane
} from './fiberLanes';
import { flushSyncCallbacks, scheduleSyncCallback } from './syncTaskQueue';
import { HostRoot } from './workTags';

let workInProgress: FiberNode | null = null;
let wipRootRenderLane: Lane = NoLane;

// 生成一个正在进行调度的fiberNode节点内容
function prepareFreshStack(root: FiberRootNode, lane: Lane) {
	workInProgress = createWorkInProgress(root.current, {});
	wipRootRenderLane = lane;
}

export function scheduleUpdateOnFiber(fiber: FiberNode, lane: Lane) {
	// TODO 调度功能

	// 找到 fiberRootNode
	const root = markUpdateFromFiberToRoot(fiber);
	// 标记lane到root上
	markRootUpdated(root, lane);
	ensureRootIsScheduled(root);
}

// 调度阶段入口
function ensureRootIsScheduled(root: FiberRootNode) {
	const updateLane = getHighestPriorityLane(root.pendingLanes);

	// 当前的优先级，最高位都是Nolane说明没有需要执行的事情了
	if (updateLane === NoLane) {
		return;
	}

	if (updateLane === SyncLane) {
		// 同步优先级 用微任务调度
		if (__DEV__) {
			console.log('在微任务中调度，优先级：', updateLane);
		}
		// performSyncWorkOnRoot直接调用就执行了，这里要传入一个callback待执行，所以使用bind
		// 存待执行的调度函数到 syncQueue 数组中
		scheduleSyncCallback(performSyncWorkOnRoot.bind(null, root, updateLane));
		// 将执行syncQueue数组中存入的函数的方法放入微任务队列中
		scheduleMicroTask(flushSyncCallbacks);
	} else {
		// 其他优先级 用宏任务调度
	}
}

// 标记lane
function markRootUpdated(root: FiberRootNode, lane: Lane) {
	root.pendingLanes = mergeLanes(root.pendingLanes, lane);
}

// 找到根节点并返回
function markUpdateFromFiberToRoot(fiber: FiberNode) {
	let node = fiber;
	// 父节点
	let parent = node.return;

	// 寻找父节点，一直找到根节点
	while (parent !== null) {
		node = parent;
		parent = node.return;
	}

	// HostRoot是hostRootFiber，再往上返回就是 fiberRootNode 根节点
	if (node.tag === HostRoot) {
		return node.stateNode;
	}

	// 没有找到直接返回 null
	return null;
}

// 根节点
function performSyncWorkOnRoot(root: FiberRootNode, lane: Lane) {
	const nextLane = getHighestPriorityLane(root.pendingLanes);

	if (nextLane !== SyncLane) {
		// 其他比SyncLane低的优先级
		// NoLane
		ensureRootIsScheduled(root);
		return;
	}
	// 初始化
	prepareFreshStack(root, lane);

	do {
		try {
			workLoop();
			break;
		} catch (e) {
			if (__DEV__) {
				console.warn('workLoop error', e);
			}
			workInProgress = null;
		}
		// eslint-disable-next-line no-constant-condition
	} while (true);

	const finishedWord = root.current.alternate;
	root.finishedWord = finishedWord;
	root.finishedLane = lane;
	wipRootRenderLane = NoLane;
	// wip fiberNode树 树中的flags
	commitRoot(root);
}

function commitRoot(root: FiberRootNode) {
	const finishedWork = root.finishedWord;

	if (finishedWork === null) {
		//不存在commit阶段
		return;
	}
	if (__DEV__) {
		console.warn('commit阶段开始', finishedWork);
	}
	const lane = root.finishedLane;

	if (lane === NoLane && __DEV__) {
		console.error('commit阶段不应该是Nolane');
	}

	// 重置，数据已经存放到变量 finishedWork 中
	root.finishedWord = null;
	root.finishedLane = NoLane;

	// 移除pendingLanes中对应的批处理标记，这里移除了，那么同一个优先级的批处理就执行完了
	markRootFinished(root, lane);

	// 判断root本身flags和root的subtreeFlags
	const subtreeHasEffect =
		(finishedWork.subtreeFlags & MutationMask) !== NoFlags;
	const rootHasEffect = (finishedWork.flags & MutationMask) !== NoFlags;

	// 有变化，需要跟新dom
	if (subtreeHasEffect || rootHasEffect) {
		// beforeMutation
		// mutation Placement
		commitMutationEffects(finishedWork);
		// 会在mutation和layout之间切换fiberNode树
		root.current = finishedWork;

		// layout
	} else {
		root.current = finishedWork;
	}
}

function workLoop() {
	while (workInProgress !== null) {
		performUnitOfWork(workInProgress);
	}
}

// 递归的递阶段
function performUnitOfWork(fiber: FiberNode) {
	// 节点递阶段处理后返回的当前节点的下一个节点（子节点）
	const next = beginWork(fiber, wipRootRenderLane);
	// 当前节点已经处理过了，新的Props变成旧值
	fiber.memoizedProps = fiber.pendingProps;

	// 下一个节点不存在了就开始归阶段，否则替换 wip 开始新一轮的递阶段
	if (next === null) {
		completeUnitOfWork(fiber);
	} else {
		workInProgress = next;
	}
}

// 递归的归阶段
function completeUnitOfWork(fiber: FiberNode) {
	let node: FiberNode | null = fiber;

	do {
		// 完成当前节点的归阶段逻辑
		completeWork(node);
		// 完成后查看是否存在兄弟节点，存在则将兄弟进入下一个递阶段
		const sibling = node.sibling;
		if (sibling !== null) {
			workInProgress = sibling;
			return;
		} else {
			// 找不到兄弟节点，开始往上找父节点，父节点存在就执行归阶段，一直到没有父节点
			node = node.return;
			// 找到根节点的时候node就是null， workInProgress = null,就会结束workLoop循环
			workInProgress = node;
		}
	} while (node !== null);
}
