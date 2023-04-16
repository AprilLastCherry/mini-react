/*
 * @Author: Leon
 * @Date: 2023-03-08 12:14:10
 * @LastEditors: 最后编辑
 * @LastEditTime: 2023-04-06 14:45:49
 * @description: 文件说明
 */
import { Dispatch, Dispatcher } from 'react/src/currentDispatcher';
import internals from 'shared/internals';
import { Action } from 'shared/ReactTypes';
import { FiberNode } from './fiber';
import { Flags, PassiveEffect } from './fiberFlags';
import { Lane, NoLane, requestUpdateLanes } from './fiberLanes';
import { HookHasEffect, Passive } from './hookEffectTags';
import {
	createUpdate,
	createUpdateQueue,
	enqueueUpdate,
	processUpdateQueue,
	UpdateQueue
} from './updateQueue';
import { scheduleUpdateOnFiber } from './workLoop';

let currentlyRenderingFiber: FiberNode | null = null;
let workInProgressHook: Hook | null = null;
let currentHook: Hook | null = null;
let renderLane: Lane = NoLane;
// 公共数据集
const { currentDispatcher } = internals;

interface Hook {
	// 存放数据
	memoizedState: any;
	// 存放更新的方法
	updateQueue: unknown;
	// 下一个Hook
	next: Hook | null;
}

export interface Effect {
	tag: Flags;
	create: EffectCallback | void;
	destory: EffectCallback | void;
	deps: EffectDeps;
	next: Effect | null;
}

// FiberNode上加属性lastEffect指向最后的effect
export interface FCUpdateQueue<State> extends UpdateQueue<State> {
	lastEffect: Effect | null;
}

// useEffect(EffectCallback, EffectDeps)
type EffectCallback = () => void;
type EffectDeps = any[] | null;

// 函数组件JSX转FiberNode
export function renderWithHooks(wip: FiberNode, lane: Lane) {
	// 赋值操作
	currentlyRenderingFiber = wip;
	// 重置 hooks 链表
	wip.memoizedState = null;
	// 重置 effect 链表
	wip.updateQueue = null;
	renderLane = lane;

	const current = wip.alternate;
	if (current !== null) {
		// update
		currentDispatcher.current = HooksDispatcherOnUpdate;
	} else {
		// mount
		// 创建一个hook 赋值到公共数据集下，赋值后证明是在函数组件下了useState了，使用useState就不会报错
		currentDispatcher.current = HooksDispatcherOnMount;
	}

	const { type: Component, pendingProps } = wip;
	// 函数组件执行就是在 Component 调用的时候运行的
	const children = Component(pendingProps);

	// 重置操作
	currentlyRenderingFiber = null;
	renderLane = NoLane;

	return children;
}

const HooksDispatcherOnMount: Dispatcher = {
	useState: mountState,
	useEffect: mountEffect
};

const HooksDispatcherOnUpdate: Dispatcher = {
	useState: updateState,
	useEffect: updateEffect
};

function mountEffect(create: EffectCallback | void, deps: EffectDeps | void) {
	const hook = mountWorkInProgresHook();
	const nextDeps = deps === undefined ? null : deps;
	(currentlyRenderingFiber as FiberNode).flags |= PassiveEffect;

	hook.memoizedState = pushEffect(
		Passive | HookHasEffect,
		create,
		undefined,
		nextDeps
	);
}

function updateEffect(create: EffectCallback | void, deps: EffectDeps | void) {
	const hook = updateWorkInProgresHook();
	const nextDeps = deps === undefined ? null : deps;
	let destory: EffectCallback | void;

	if (currentHook !== null) {
		// 前一次异步更新的hook
		const prevEffect = currentHook.memoizedState as Effect;
		destory = prevEffect.destory;

		if (nextDeps !== null) {
			// 浅比较依赖
			const prevDeps = prevEffect.deps;
			if (areHookInputsEqual(nextDeps, prevDeps)) {
				// 本次不更新
				hook.memoizedState = pushEffect(Passive, create, destory, nextDeps);
				return;
			}
		}
		// 浅比较后不相等,执行副作用
		(currentlyRenderingFiber as FiberNode).flags |= PassiveEffect;
		hook.memoizedState = pushEffect(
			Passive | HookHasEffect,
			create,
			destory,
			nextDeps
		);
	}
}

function areHookInputsEqual(nextDeps: EffectDeps, prevDeps: EffectDeps) {
	if (prevDeps === null || nextDeps === null) {
		return false;
	}

	for (let i = 0; i < prevDeps.length && i < nextDeps.length; i++) {
		if (Object.is(prevDeps[i], nextDeps[i])) {
			continue;
		}

		return false;
	}

	return true;
}

// 返回当前的hook，同时在fiberNode上
function pushEffect(
	hookFlags: Flags,
	create: EffectCallback | void,
	destory: EffectCallback | void,
	deps: EffectDeps
): Effect {
	const effect: Effect = {
		tag: hookFlags,
		create,
		destory,
		deps,
		next: null
	};

	// 当前的fiberNode的updateQueue
	const fiber = currentlyRenderingFiber as FiberNode;
	const updateQueue = fiber.updateQueue as FCUpdateQueue<any>;

	if (updateQueue === null) {
		const updateQueue = createFCUpdateQueue();
		fiber.updateQueue = updateQueue;
		// effect与自己形成环状链表
		effect.next = effect;
		// fiber.updateQueue.lastEffect指向当前的effect
		updateQueue.lastEffect = effect;
	} else {
		// 插入effect
		const lastEffect = updateQueue.lastEffect;
		// fiber.updateQueue存在，但是不存在lastEffect，需要重新创建effect的环状链表
		if (lastEffect === null) {
			effect.next = effect;
			updateQueue.lastEffect = effect;
		} else {
			// 最后一个effect的next是第一个effect
			const firstEffect = lastEffect.next;
			// 最后一个effect下一个effect指向当前的新effect
			lastEffect.next = effect;
			// 最新的effect指向第一个effect，环状链表插入了最新的effect
			effect.next = firstEffect;
			// fiber上的updateQueue.lastEffect存最新的effect
			updateQueue.lastEffect = effect;
		}
	}

	return effect;
}

// 创建useEffect的hook，其中hook.updateQueue数据多一个属性lastEffect用来指向下一个useEffect
function createFCUpdateQueue<State>() {
	const updateQueue = createUpdateQueue<State>() as FCUpdateQueue<State>;
	updateQueue.lastEffect = null;
	return updateQueue;
}

function mountState<State>(
	initialState: (() => State) | State
): [State, Dispatch<State>] {
	// 得到（找到）当前useState对应的Hook数据
	const hook = mountWorkInProgresHook();

	let memoizedState = null;

	// userState使用的是函数还是数据，处理得到最终的State
	if (initialState instanceof Function) {
		memoizedState = initialState();
	} else {
		memoizedState = initialState;
	}

	// 为当前hook创建一个新的updateQueue，用来存放更新后的数据和当前hook的触发更新的方法
	const updateQueue = createUpdateQueue<State>();
	hook.updateQueue = updateQueue;
	// 保存新的值
	hook.memoizedState = memoizedState;

	// 当前hook的触发跟新的方法，使用bind因为dispath可以脱离组件使用，依旧可以触发组件内的更新
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore
	const dispatch = dispatchSetState.bind(
		null,
		currentlyRenderingFiber,
		updateQueue
	);
	// hook绑定自身hook更新的方法
	updateQueue.dispatch = dispatch;

	return [memoizedState, dispatch];
}

/**
 * 1.创建一个hook，判断存不存在workInProgressHook
 * 2.不存在说明是当前组件Hook链表的第一个Hook， currentlyRenderingFiber在函数组件创建时就赋值了该节点的fiberNode，如果不存在则说明不是在组件内创建hook的，要报错
 * 3.正常创建了 hook ，memoizedState 存放函数组件当下的 hook
 * 4.如果使用 useState， useEffect 等 Hook 时 workInProgressHook 已经存在，则说明不是最开始的hook值了，进行了好几个hook计算了
 *  workInProgressHook保留了上一个hook的数据，next属性换成现在的新生成的hook建立链表关系，再把 workInProgressHook 替换成当前的hook
 * @returns
 */
function mountWorkInProgresHook(): Hook {
	const hook: Hook = {
		memoizedState: null,
		updateQueue: null,
		next: null
	};

	if (workInProgressHook === null) {
		// mount 时，第一个hook
		if (currentlyRenderingFiber === null) {
			throw new Error('请在函数组件内调用hook');
		} else {
			workInProgressHook = hook;
			currentlyRenderingFiber.memoizedState = workInProgressHook;
		}
	} else {
		// 此时的workInProgressHook是Hook链的上一个hook，next属性用来存放此次的hook数据，链表前后链接
		workInProgressHook.next = hook;
		// workInProgressHook切换为当前的hook节点
		workInProgressHook = hook;
	}

	return workInProgressHook;
}

// 函数组件再次渲染的时候，会重新走一遍useState,但是参数已经用不上了
function updateState<State>(): [State, Dispatch<State>] {
	// 得到（找到）当前useState对应的Hook数据
	const hook = updateWorkInProgresHook();
	// 计算新的state的逻辑
	const queue = hook.updateQueue as UpdateQueue<State>;
	const pending = queue.shared.pending;
	queue.shared.pending = null;

	if (pending !== null) {
		const { memoizedState } = processUpdateQueue(
			hook.memoizedState,
			pending,
			renderLane
		);
		hook.memoizedState = memoizedState;
	}

	return [hook.memoizedState, queue.dispatch as Dispatch<State>];
}

function updateWorkInProgresHook(): Hook {
	// TODO render 阶段的更新
	let nextCurrentHook: Hook | null;
	if (currentHook === null) {
		// 这个是这个FC update时的第一个hook
		const current = currentlyRenderingFiber?.alternate;

		if (current !== null) {
			nextCurrentHook = current?.memoizedState;
		} else {
			// mount
			nextCurrentHook = null;
		}
	} else {
		// 已经不是第一个Hook了，currentHook是上一次的hook， hook.next就是当前的hook
		nextCurrentHook = currentHook.next;
	}

	if (nextCurrentHook === null) {
		throw new Error(
			`组件${currentlyRenderingFiber?.type}本次执行时的Hook比上次执行的多`
		);
	}

	currentHook = nextCurrentHook as Hook;

	// 用之前mount创建的hook生成新的hook
	const newHook: Hook = {
		memoizedState: currentHook.memoizedState,
		updateQueue: currentHook.updateQueue,
		next: null
	};

	if (workInProgressHook === null) {
		// mount 时，第一个hook
		if (currentlyRenderingFiber === null) {
			throw new Error('请在函数组件内调用hook');
		} else {
			workInProgressHook = newHook;
			currentlyRenderingFiber.memoizedState = workInProgressHook;
		}
	} else {
		// 此时的workInProgressHook是Hook链的上一个hook，next属性用来存放此次的hook数据，链表前后链接
		workInProgressHook.next = newHook;
		// workInProgressHook切换为当前的hook节点
		workInProgressHook = newHook;
	}

	return workInProgressHook;
}

/**
 * 触发更新，触发新的调度
 * @param fiber 当前的组件fiberNode
 * @param updateQueue 当前hook的更新方法
 * @param action 使用更新方法传入的新的更新值
 */
function dispatchSetState<State>(
	fiber: FiberNode,
	updateQueue: UpdateQueue<State>,
	action: Action<State>
) {
	const lane = requestUpdateLanes();
	// 用户使用更新方法传入最新值，用最新值创建 update， 更新到 updateQueue 中
	const update = createUpdate(action, lane);
	// 创建环状链表
	enqueueUpdate(updateQueue, update);
	// 有了新的update，再调度的时候，可以根据新的数据，得到新的fiberNode树
	scheduleUpdateOnFiber(fiber, lane);
}
