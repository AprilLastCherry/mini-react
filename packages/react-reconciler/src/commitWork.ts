/*
 * @Author: Leon
 * @Date: 2023-03-06 15:17:59
 * @LastEditors: 最后编辑
 * @LastEditTime: 2023-03-11 14:22:24
 * @description: 文件说明
 */
import { FiberNode, FiberRootNode } from './fiber';
import { MutationMask, NoFlags, Placement } from './fiberFlags';
import { appendChildToContainer, Container } from 'hostConfig';
import { HostComponent, HostRoot, HostText } from './workTags';

let nextEffect: FiberNode | null = null;

export const commitMutationEffects = (finishedWork: FiberNode) => {
	nextEffect = finishedWork;
	while (nextEffect !== null) {
		// 会向下遍历
		const child: FiberNode | null = nextEffect.child;
		console.log(
			'commitMutationEffects',
			nextEffect,
			nextEffect.subtreeFlags & MutationMask,
			NoFlags
		);
		if (
			(nextEffect.subtreeFlags & MutationMask) !== NoFlags &&
			child !== null
		) {
			// 当前节点的子节点们存在突变标记并且确实存在子节点，接着往下遍历
			nextEffect = child;
		} else {
			// 1.找到底了，或者不包含subtreeFlags且包含flag 向上遍历
			up: while (nextEffect !== null) {
				commitMutationEffectsOnFiber(nextEffect);
				// 找当前节点的兄弟节点
				const sibling: FiberNode | null = nextEffect.sibling;

				if (sibling !== null) {
					nextEffect = sibling;
					break up;
				}
				nextEffect = nextEffect.return;
			}
		}
	}
};

const commitMutationEffectsOnFiber = (finishedWork: FiberNode) => {
	const flags = finishedWork.flags;

	if ((flags & Placement) !== NoFlags) {
		commitPlacement(finishedWork);
		// 移除标记
		finishedWork.flags &= ~Placement;
	}

	// flags Update
	// flags ChildDeletion
};

const commitPlacement = (finishedWork: FiberNode) => {
	if (__DEV__) {
		console.warn('执行Placement操作', finishedWork);
	}

	// parent DOM
	const hostParent = getHostParent(finishedWork);

	if (hostParent !== null) {
		// finishedWork ~~ 将DOM append 到 parent DOM 中
		appendPlacementNodeIntoContainer(finishedWork, hostParent);
	}
};

function getHostParent(fiber: FiberNode): Container | null {
	let parent = fiber.return;
	while (parent) {
		const parentTag = parent.tag;
		if (parentTag === HostComponent) {
			return parent.stateNode as Container;
		}

		if (parentTag === HostRoot) {
			return (parent.stateNode as FiberRootNode).container;
		}

		parent = parent.return;
	}

	if (__DEV__) {
		console.warn('未找到host parent');
	}
	return null;
}

function appendPlacementNodeIntoContainer(
	finishedWord: FiberNode,
	hostParent: Container
) {
	// fiber host
	if (finishedWord.tag === HostComponent || finishedWord.tag === HostText) {
		appendChildToContainer(hostParent, finishedWord.stateNode);

		return;
	}

	const child = finishedWord.child;

	if (child !== null) {
		appendPlacementNodeIntoContainer(child, hostParent);
		let sibling = child.sibling;

		while (sibling !== null) {
			appendPlacementNodeIntoContainer(sibling, hostParent);

			sibling = sibling.sibling;
		}
	}
}
