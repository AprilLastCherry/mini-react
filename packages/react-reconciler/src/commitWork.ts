/*
 * @Author: Leon
 * @Date: 2023-03-06 15:17:59
 * @LastEditors: 最后编辑
 * @LastEditTime: 2023-04-06 15:10:19
 * @description: 文件说明
 */
import { FiberNode, FiberRootNode, PendingPassiveEffects } from './fiber';
import {
	ChildDeletion,
	Flags,
	MutationMask,
	NoFlags,
	PassiveEffect,
	PassiveMask,
	Placement,
	Update
} from './fiberFlags';
import {
	appendChildToContainer,
	commitUpdate,
	Container,
	insertChildToContainer,
	Instance,
	removeChild
} from 'hostConfig';
import {
	FunctionComponent,
	HostComponent,
	HostRoot,
	HostText
} from './workTags';
import { Effect, FCUpdateQueue } from './fiberHooks';
import { HookHasEffect } from './hookEffectTags';

let nextEffect: FiberNode | null = null;

export const commitMutationEffects = (
	finishedWork: FiberNode,
	root: FiberRootNode
) => {
	nextEffect = finishedWork;
	while (nextEffect !== null) {
		// 会向下遍历
		const child: FiberNode | null = nextEffect.child;
		if (
			(nextEffect.subtreeFlags & (MutationMask | PassiveMask)) !== NoFlags &&
			child !== null
		) {
			// 当前节点的子节点们存在突变标记并且确实存在子节点，接着往下遍历
			nextEffect = child;
		} else {
			// 1.找到底了，没有子节点 2.subtreeFlags没有突变但自身flag有突变 向上遍历
			up: while (nextEffect !== null) {
				commitMutationEffectsOnFiber(nextEffect, root);
				// 当前节点的父节点是有subtreeFlags标志的，那么所有的兄弟节点都可能有突变存在的，要遍历
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

// 消费对应的突变标志
const commitMutationEffectsOnFiber = (
	finishedWork: FiberNode,
	root: FiberRootNode
) => {
	const flags = finishedWork.flags;

	if ((flags & Placement) !== NoFlags) {
		commitPlacement(finishedWork);
		// 移除标记
		finishedWork.flags &= ~Placement;
	}

	// flags Update
	if ((flags & Update) !== NoFlags) {
		commitUpdate(finishedWork);
		// 移除标记
		finishedWork.flags &= ~Update;
	}

	// flags ChildDeletion，需要删除节点
	if ((flags & ChildDeletion) !== NoFlags) {
		const deletions = finishedWork.deletions;
		if (deletions !== null) {
			deletions.forEach((childToDelete) => {
				commitDeletion(childToDelete, root);
			});
		}
		// 移除标记
		finishedWork.flags &= ~ChildDeletion;
	}

	if ((flags & PassiveEffect) !== NoFlags) {
		// 收集回调
		commitPassiveEffect(finishedWork, root, 'update');
		finishedWork.flags &= ~PassiveEffect;
	}
};

function commitPassiveEffect(
	fiber: FiberNode,
	root: FiberRootNode,
	type: keyof PendingPassiveEffects
) {
	// update
	if (
		fiber.tag !== FunctionComponent ||
		(type === 'update' && (fiber.flags & PassiveEffect) === NoFlags)
	) {
		return;
	}
	const updateQueue = fiber.updateQueue as FCUpdateQueue<any>;
	if (updateQueue !== null) {
		if (updateQueue.lastEffect === null && __DEV__) {
			console.warn('当FC存在PassiveEffect flag时， 不应该为不存在Effect');
		}

		root.pendingPassiveEffects[type].push(updateQueue.lastEffect as Effect);
	}
}

// 执行effect队列
function commitHookEffectList(
	flags: Flags,
	lastEffect: Effect,
	callback: (effect: Effect) => void
) {
	let effect = lastEffect.next as Effect;

	do {
		if ((effect.tag & flags) === flags) {
			callback(effect);
		}

		effect = effect.next as Effect;
	} while (effect !== lastEffect.next);
}

export function commitHookEffectListDestory(flags: Flags, lastEffect: Effect) {
	commitHookEffectList(flags, lastEffect, (effect) => {
		const destory = effect.destory;
		if (typeof destory === 'function') {
			destory();
		}
	});
}

export function commitHookEffectListCreate(flags: Flags, lastEffect: Effect) {
	commitHookEffectList(flags, lastEffect, (effect) => {
		const create = effect.create;
		if (typeof create === 'function') {
			effect.destory = create();
		}
	});
}

export function commitHookEffectListUnmount(flags: Flags, lastEffect: Effect) {
	commitHookEffectList(flags, lastEffect, (effect) => {
		const destory = effect.destory;
		if (typeof destory === 'function') {
			destory();
		}
		// 去除标记，后续就不再执行此hook
		effect.tag &= ~HookHasEffect;
	});
}

function recordHostChildrenToDelete(
	hostChildrenToDelete: FiberNode[],
	unmountFiber: FiberNode
) {
	// 1. 找到第一个root host节点
	const lastOne = hostChildrenToDelete[hostChildrenToDelete.length - 1];
	if (!lastOne) {
		hostChildrenToDelete.push(unmountFiber);
	} else {
		let node = lastOne.sibling;
		while (node !== null) {
			if (unmountFiber === node) {
				hostChildrenToDelete.push(unmountFiber);
			}
			node = node.sibling;
		}
	}
	// 2. 每找到一个host节点，判断下这个节点是不是 1 中找到的那个节点的兄弟节点
}

// 节点被删除，需要删除节点下的所有子节点
function commitDeletion(childToDelete: FiberNode, root: FiberRootNode) {
	const rootChildrenToDelete: FiberNode[] = [];
	// 遍历子节点，每个节点都需要处理解绑和删除
	commitNestedComponent(childToDelete, (unmountFiber) => {
		switch (unmountFiber.tag) {
			case HostComponent:
				// if (rootHostNode === null) {
				// 	// rootHostNode为空表示当前节点是要删除的真实DOM的根节点
				// 	rootHostNode = unmountFiber;
				// }
				recordHostChildrenToDelete(rootChildrenToDelete, unmountFiber);
				// TODO  解绑ref
				return;

			case HostText:
				// if (rootHostNode === null) {
				// 	rootHostNode = unmountFiber;
				// }
				recordHostChildrenToDelete(rootChildrenToDelete, unmountFiber);
				return;

			case FunctionComponent:
				// useEffect unmount , 卸载时还需要处理生命周期
				commitPassiveEffect(unmountFiber, root, 'umount');
				return;
			default:
				if (__DEV__) {
					console.warn('未处理的unmount类型', unmountFiber);
				}
				break;
		}
	});

	// 找到了需要删除的整个真实Dom根节点
	if (rootChildrenToDelete.length) {
		// 找到要被删除的根节点再上一层的最近的真实DOM节点，才可以进行删除操作
		const hostParent = getHostParent(childToDelete);
		if (hostParent !== null) {
			rootChildrenToDelete.forEach((node) => {
				removeChild(node.stateNode, hostParent);
			});
		}
	}

	// 从Fiber树剥离
	childToDelete.return = null;
	childToDelete.child = null;
}

// 遍历要删除节点下面每个节点，完成解绑的操作
function commitNestedComponent(
	root: FiberNode,
	onCommitUnmount: (fiber: FiberNode) => void
) {
	let node = root;
	// eslint-disable-next-line no-constant-condition
	while (true) {
		onCommitUnmount(node);
		if (node.child !== null) {
			// 向下遍历
			node.child.return = node;
			node = node.child;
			continue;
		}

		if (node === root) {
			// 终止条件
			return;
		}

		while (node.sibling === null) {
			if (node.return === null || node.return === root) {
				return;
			}
			// 向上归
			node = node.return;
		}
		node.sibling.return = node.return;
		node = node.sibling;
	}
}

const commitPlacement = (finishedWork: FiberNode) => {
	if (__DEV__) {
		console.warn('执行Placement操作', finishedWork);
	}

	// parent DOM
	const hostParent = getHostParent(finishedWork);
	// host sibling
	const sibling = getHostSibling(finishedWork);

	if (hostParent !== null) {
		// finishedWork ~~ 将DOM append 到 parent DOM 中
		insertOrAppendPlacementNodeIntoContainer(finishedWork, hostParent, sibling);
	}
};

function getHostSibling(fiber: FiberNode) {
	let node: FiberNode = fiber;
	// eslint-disable-next-line no-constant-condition
	findSbiling: while (true) {
		while (node.sibling === null) {
			const parent = node.return;
			if (
				parent === null ||
				parent.tag === HostComponent ||
				parent.tag === HostRoot
			) {
				return null;
			}
			node = parent;
		}
		node.sibling.return = node.return;
		node = node.sibling;

		while (node.tag !== HostText && node.tag !== HostComponent) {
			if ((node.flags & Placement) !== NoFlags) {
				continue findSbiling;
			}
			if (node.child === null) {
				continue findSbiling;
			} else {
				node.child.return = node;
				node = node.child;
			}
		}

		if ((node.flags & Placement) === NoFlags) {
			return node.stateNode;
		}
	}
}

// 往上找到可以挂载的真实dom，Hook组件，函数组件时没有真实dom的，要往上找到最近的可以挂载的dom节点
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

function insertOrAppendPlacementNodeIntoContainer(
	finishedWord: FiberNode,
	hostParent: Container,
	before?: Instance
) {
	// 取出当前FiberNode对应的真实Dom，stateNode，挂在到最近的父真实dom上
	if (finishedWord.tag === HostComponent || finishedWord.tag === HostText) {
		if (before) {
			insertChildToContainer(finishedWord.stateNode, hostParent, before);
		} else {
			appendChildToContainer(hostParent, finishedWord.stateNode);
		}

		return;
	}

	const child = finishedWord.child;

	if (child !== null) {
		insertOrAppendPlacementNodeIntoContainer(child, hostParent);
		let sibling = child.sibling;

		while (sibling !== null) {
			insertOrAppendPlacementNodeIntoContainer(sibling, hostParent);

			sibling = sibling.sibling;
		}
	}
}
