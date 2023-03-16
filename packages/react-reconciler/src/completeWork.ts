/*
 * @Author: Leon
 * @Date: 2023-02-25 16:29:18
 * @LastEditors: 最后编辑
 * @LastEditTime: 2023-03-16 01:16:42
 * @description: 文件说明
 */

import { FiberNode } from './fiber';
import { NoFlags, Update } from './fiberFlags';
import {
	Container,
	appendInitialChild,
	createInstace,
	createTextInstace
} from 'hostConfig';
import {
	FunctionComponent,
	HostComponent,
	HostRoot,
	HostText
} from './workTags';
import { updateFiberProps } from 'react-dom/src/SyntheticEvent';

// 标记更新
function markUpdate(fiber: FiberNode) {
	fiber.flags |= Update;
}

// 递归中的归阶段
export const completeWork = (wip: FiberNode) => {
	const newProps = wip.pendingProps;
	const current = wip.alternate;

	switch (wip.tag) {
		case HostComponent:
			if (current !== null && wip.stateNode) {
				// update
				// 1.props 是否变化
				updateFiberProps(wip.stateNode, newProps);
			} else {
				// 1. 构建离屏DOM
				const instance = createInstace(wip.type, newProps);
				// 2. 将DOM插入到DOM树中
				appendAllChildren(instance, wip);
				// 对于HostComponent来说，比如jsx的<div>中的stateNode保存的就是div的Dom，return 才是父节点
				wip.stateNode = instance;
			}

			bubbleProperties(wip);
			return null;

		case HostText:
			if (current !== null && wip.stateNode) {
				// update
				const oldText = current.memoizedProps?.content;
				const newText = newProps.content;
				if (oldText !== newText) {
					markUpdate(wip);
				}
			} else {
				// mount
				// 1. 构建DOM
				const instance = createTextInstace(newProps.content);
				// 2. 将DOM插入到DOM树中
				wip.stateNode = instance;
			}

			bubbleProperties(wip);
			return null;

		case HostRoot:
			bubbleProperties(wip);
			return null;

		case FunctionComponent:
			bubbleProperties(wip);
			return null;

		default:
			if (__DEV__) {
				console.warn('completeWork未实现的类型', wip.tag);
			}
	}
};

// 子组件的dom前面归的时候已经生成了，将他们嵌入到当前组件的dom中
function appendAllChildren(parent: Container, wip: FiberNode) {
	let node = wip.child;
	while (node !== null) {
		if (node.tag === HostComponent || node.tag === HostText) {
			appendInitialChild(parent, node.stateNode);
		} else if (node.child !== null) {
			// 接着往下找子节点, 将子节点与当前节点构建父子级关系
			node.child.return = node;
			// 切换成子节点
			node = node.child;
			continue;
		}

		// 找完子节点归循环的时候，回到当前节点就退出
		if (node === wip) {
			return;
		}

		// 兄弟节点不存在了
		while (node.sibling === null) {
			// 父节点是开始的节点，退出循环，不需要再往上返回了
			if (node.return === null || node.return === wip) {
				return;
			}
			// 返回父节点
			node = node?.return;
		}

		// 兄弟节点存在，当前节点的父节点就是是兄弟节点的父节点，关系绑定
		node.sibling.return = node.return;
		// 当前节点变更为兄弟节点
		node = node.sibling;
	}
}

// 当前节点需要进行的副作用 flags， 或运算得到
function bubbleProperties(wip: FiberNode) {
	let subtreeFlags = NoFlags;
	let child = wip.child;

	// 将子节点和子节点的兄弟节点的标识整合放到subtreeFlags中，自身的flag不整合进subtreeFlags
	while (child !== null) {
		subtreeFlags |= child.subtreeFlags;
		subtreeFlags |= child.flags;

		child.return = wip;
		child = child.sibling;
	}

	wip.subtreeFlags |= subtreeFlags;
}
