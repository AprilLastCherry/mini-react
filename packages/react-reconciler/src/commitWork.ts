/*
 * @Author: Leon
 * @Date: 2023-03-06 15:17:59
 * @LastEditors: 最后编辑
 * @LastEditTime: 2023-03-21 11:51:53
 * @description: 文件说明
 */
import { FiberNode, FiberRootNode } from './fiber';
import {
	ChildDeletion,
	MutationMask,
	NoFlags,
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

let nextEffect: FiberNode | null = null;

export const commitMutationEffects = (finishedWork: FiberNode) => {
	nextEffect = finishedWork;
	while (nextEffect !== null) {
		// 会向下遍历
		const child: FiberNode | null = nextEffect.child;
		if (
			(nextEffect.subtreeFlags & MutationMask) !== NoFlags &&
			child !== null
		) {
			// 当前节点的子节点们存在突变标记并且确实存在子节点，接着往下遍历
			nextEffect = child;
		} else {
			// 1.找到底了，没有子节点 2.subtreeFlags没有突变但自身flag有突变 向上遍历
			up: while (nextEffect !== null) {
				commitMutationEffectsOnFiber(nextEffect);
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
const commitMutationEffectsOnFiber = (finishedWork: FiberNode) => {
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
				commitDeletion(childToDelete);
			});
		}
		// 移除标记
		finishedWork.flags &= ~ChildDeletion;
	}
};

// 节点被删除，需要删除节点下的所有子节点
function commitDeletion(childToDelete: FiberNode) {
	let rootHostNode: FiberNode | null = null;
	// 遍历子节点，每个节点都需要处理解绑和删除
	commitNestedComponent(childToDelete, (unmountFiber) => {
		switch (unmountFiber.tag) {
			case HostComponent:
				if (rootHostNode === null) {
					// rootHostNode为空表示当前节点是要删除的真实DOM的根节点
					rootHostNode = unmountFiber;
				}
				// TODO  解绑ref
				return;

			case HostText:
				if (rootHostNode === null) {
					rootHostNode = unmountFiber;
				}
				return;

			case FunctionComponent:
				// TODO useEffect unmount , 卸载时还需要处理生命周期
				return;
			default:
				if (__DEV__) {
					console.warn('未处理的unmount类型', unmountFiber);
				}
				break;
		}
	});

	// 找到了需要删除的整个真实Dom根节点
	if (rootHostNode !== null) {
		// 找到要被删除的根节点再上一层的最近的真实DOM节点，才可以进行删除操作
		const hostParent = getHostParent(childToDelete);
		if (hostParent !== null) {
			removeChild((rootHostNode as FiberNode).stateNode, hostParent);
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
