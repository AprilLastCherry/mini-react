/*
 * @Author: Leon
 * @Date: 2023-03-08 12:14:10
 * @LastEditors: 最后编辑
 * @LastEditTime: 2023-03-11 21:05:13
 * @description: 文件说明
 */
import { Dispatch, Dispatcher } from 'react/src/currentDispatcher';
import internals from 'shared/internals';
import { Action } from 'shared/ReactTypes';
import { FiberNode } from './fiber';
import {
	createUpdate,
	createUpdateQueue,
	enqueueUpdate,
	UpdateQueue
} from './updateQueue';
import { scheduleUpdateOnFiber } from './workLoop';

let currentlyRenderingFiber: FiberNode | null = null;
let workInProgressHook: Hook | null = null;
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

// 函数组件JSX转FiberNode
export function renderWithHooks(wip: FiberNode) {
	// 赋值操作
	currentlyRenderingFiber = wip;
	// 重置
	wip.memoizedState = null;

	const current = wip.alternate;
	if (current !== null) {
		// update
		// currentDispatcher.current = HooksDispatcherOnUpdate;
	} else {
		// mount
		// 创建一个hook 赋值到公共数据集下，赋值后证明是在函数组件下了useState了，使用useState就不会报错
		console.log('赋值得到Hook，使用useState', wip);
		currentDispatcher.current = HooksDispatcherOnMount;
	}

	const { type: Component, pendingProps } = wip;
	// 函数组件执行就是在 Component 调用的时候运行的
	console.log('前面');
	const children = Component(pendingProps);
	console.log('后面');

	// 重置操作
	currentlyRenderingFiber = null;

	return children;
}

// const HooksDispatcherOnUpdate: Dispatcher = {};

const HooksDispatcherOnMount: Dispatcher = {
	useState: mountState
};

function mountState<State>(
	initialState: () => State | State
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
	const dispatch = dispatchSetState.bind(
		null,
		currentlyRenderingFiber,
		updateQueue
	);
	// hook绑定自身hook跟新的方法
	updateQueue.dispatch = dispatch;
	return [memoizedState, dispatch];
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
	// 用户使用更新方法传入最新值，用最新值创建 update， 更新到 updateQueue 中
	const update = createUpdate(action);
	enqueueUpdate(updateQueue, update);
	// 有了新的update，再调度的时候，可以根据新的数据，得到新的fiberNode树
	scheduleUpdateOnFiber(fiber);
}

/**
 * 1.创建一个hook，判断存不存在workInProgressHook
 * 2.不存在说明是当前组件Hook链表的第一个Hook， currentlyRenderingFiber在函数组件创建时就赋值了该节点的fiberNode，如果不存在则说明不是在组件内创建hook的，要报错
 * 3.正常创建了 hook ，memoizedState存放函数组件当下的hook
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
