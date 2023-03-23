/*
 * @Author: Leon
 * @Date: 2023-03-02 15:27:24
 * @LastEditors: 最后编辑
 * @LastEditTime: 2023-03-22 18:08:25
 * @description: 文件说明
 */
import { REACT_ELEMENT_TYPE, REACT_FRAGMENT_TYPE } from 'shared/ReactSymbols';
import { Key, Props, ReactElementType } from 'shared/ReactTypes';
import {
	createFiberFromElement,
	createFiberFromFragment,
	createWorkInProgress,
	FiberNode
} from './fiber';
import { ChildDeletion, Placement } from './fiberFlags';
import { Fragment, HostText } from './workTags';

type ExistingChildren = Map<string | number, FiberNode>;

// 是否追踪副作用
function ChildReconciler(shouldTrackEffects: boolean) {
	// 删除节点
	function deleteChild(returnFiber: FiberNode, childToDelete: FiberNode) {
		if (!shouldTrackEffects) {
			return;
		}
		const deletions = returnFiber.deletions;
		if (deletions === null) {
			returnFiber.deletions = [childToDelete];
			returnFiber.flags |= ChildDeletion;
		} else {
			deletions.push(childToDelete);
		}
	}

	// 删除节点的兄弟节点
	function deleteRemainingChildren(
		returnFiber: FiberNode,
		currentFirstChild: FiberNode | null
	) {
		if (!shouldTrackEffects) {
			return;
		}
		let childToDelete = currentFirstChild;
		while (childToDelete !== null) {
			deleteChild(returnFiber, childToDelete);
			childToDelete = childToDelete.sibling;
		}
	}
	// ReactElement 生成 FiberNode
	function reconcileSingleElement(
		returnFiber: FiberNode,
		currentFiber: FiberNode | null,
		element: ReactElementType
	) {
		const key = element.key;
		while (currentFiber !== null) {
			// update
			// key相同
			if (currentFiber.key === key) {
				// 是一个reactElement
				if (element.$$typeof === REACT_ELEMENT_TYPE) {
					if (currentFiber.type === element.type) {
						let props = element.props;
						if (element.type === REACT_FRAGMENT_TYPE) {
							props = element.props.children;
						}
						// type相同，可以复用
						const existing = useFiber(currentFiber, props);
						existing.return = returnFiber;

						// 当前节点可以复用，标记剩下的节点删除
						deleteRemainingChildren(returnFiber, currentFiber.sibling);
						return existing;
					}
					// key相同， type不同
					deleteRemainingChildren(returnFiber, currentFiber);
					break;
				} else {
					if (__DEV__) {
						console.warn('还未实现的react类型', element);
						break;
					}
				}
			} else {
				// key不同，删掉旧的
				deleteChild(returnFiber, currentFiber);
				currentFiber = currentFiber.sibling;
			}
		}

		let fiber;

		if (element.type === REACT_FRAGMENT_TYPE) {
			fiber = createFiberFromFragment(element.props.children, key);
		} else {
			// 根据element创建一个Fiber
			fiber = createFiberFromElement(element);
		}
		// 当前工作单元的WorkInProgress是它的父节点
		fiber.return = returnFiber;
		return fiber;
	}

	// Text 生成 FiberNode
	function reconcileSingleTextNode(
		returnFiber: FiberNode,
		currentFiber: FiberNode | null,
		content: string | number
	) {
		// 原来的returnFiber有子节点
		while (currentFiber !== null) {
			// 子节点还是一个文本节点，对比现在也是一个文本节点，直接FiberNode
			if (currentFiber.tag === HostText) {
				const existing = useFiber(currentFiber, { content });
				existing.return = returnFiber;
				deleteRemainingChildren(returnFiber, currentFiber.sibling);
				return existing;
			}

			// 如果之前不是文本节点就删除之前的FiberNode，后面再生成一个新的
			deleteChild(returnFiber, currentFiber);
			currentFiber = currentFiber.sibling;
		}
		// 根据 文本内容 创建一个Fiber
		const fiber = new FiberNode(HostText, { content }, null);
		fiber.return = returnFiber;
		return fiber;
	}

	// 是否需要处理副作用，打上插入DOM标记
	function placeSingChild(fiber: FiberNode) {
		// fiber.alternate 之前没有值表示mount
		if (shouldTrackEffects && fiber.alternate === null) {
			fiber.flags |= Placement;
		}

		return fiber;
	}

	// 多节点的diff
	function reconcileChildrenArray(
		returnFiber: FiberNode,
		currentFirstChild: FiberNode | null,
		// 原版react是一个element类型，但是我们实现的部分有限，用any代替
		newChild: any[]
	) {
		// 最后一个可复用fiber在current中的index
		let lastPlacedIndex = 0;
		// 创建的最后一个fiber
		let lastNewFiber: FiberNode | null = null;
		// 创建的第一个fiber
		let firstNewFiber: FiberNode | null = null;

		// 1. 将current保存在map中
		const existingChildren: ExistingChildren = new Map();
		let current = currentFirstChild;

		while (current !== null) {
			const keyToUse = current.key !== null ? current.key : current.index;
			existingChildren.set(keyToUse, current);
			current = current.sibling;
		}
		console.log('ExistingChildren:', existingChildren);

		for (let i = 0; i < newChild.length; i++) {
			// 2. 遍历newChild，寻找是否可复用
			const after = newChild[i];
			const newFiber = updateFromMap(returnFiber, existingChildren, i, after);
			console.log('找到之前的节点并复用', newFiber);
			if (newFiber === null) {
				continue;
			}

			// 3. 标记移动还是插入
			newFiber.index = i;
			newFiber.return = returnFiber;

			if (lastNewFiber === null) {
				// 第一个节点
				lastNewFiber = firstNewFiber = newFiber;
			} else {
				// 绑定前后节点的关系
				lastNewFiber = (lastNewFiber.sibling as FiberNode) = newFiber;
			}

			if (!shouldTrackEffects) {
				continue;
			}

			const current = newFiber.alternate;
			if (current !== null) {
				const oldIndex = current.index;
				// 移动
				if (oldIndex < lastPlacedIndex) {
					newFiber.flags |= Placement;

					continue;
				} else {
					// 不移动
					lastPlacedIndex = oldIndex;
				}
			} else {
				// mount
				newFiber.flags |= Placement;
			}
		}
		// 4. 将Map中剩下的标记为删除
		existingChildren.forEach((fiber) => {
			deleteChild(returnFiber, fiber);
		});
		console.log('返回了节点', firstNewFiber);
		return firstNewFiber;
	}

	function updateFromMap(
		returnFiber: FiberNode,
		existingChildren: ExistingChildren,
		index: number,
		element: any
	): FiberNode | null {
		const keyToUse = element.key !== null ? element.key : index;
		// 从上一次渲染的节点中找出是否有key相同的
		const before = existingChildren.get(keyToUse);

		// HostText
		if (typeof element === 'string' || typeof element === 'number') {
			if (before) {
				// Key 相同的情况下，新节点和原来的节点都是文本节点，可以复用节点
				if (before.tag === HostText) {
					// 记录上次节点的Map移除掉这次比对中相同的节点
					existingChildren.delete(keyToUse);
					return useFiber(before, { content: element + '' });
				}
			}
			// 上次的节点不存在，生成一个新的节点
			return new FiberNode(HostText, { content: element }, null);
		}

		// ReactElement
		if (typeof element === 'object' && element !== null) {
			switch (element.$$typeof) {
				case REACT_ELEMENT_TYPE:
					if (element.type === REACT_FRAGMENT_TYPE) {
						return updateFragment(
							returnFiber,
							before,
							element,
							keyToUse,
							existingChildren
						);
					}
					if (before) {
						if (before.type === element.type) {
							existingChildren.delete(keyToUse);
							return useFiber(before, element.props);
						}
					}
					return createFiberFromElement(element);
			}
			if (Array.isArray(element)) {
				return updateFragment(
					returnFiber,
					before,
					element,
					keyToUse,
					existingChildren
				);
			}
		}

		return null;
	}

	return function reconcilerChildFibers(
		returnFiber: FiberNode,
		currentFiber: FiberNode | null,
		newChild: any
	) {
		// 判断Fragment
		const isUnkeyedTopLevelFragment =
			typeof newChild === 'object' &&
			newChild !== null &&
			newChild.type === REACT_FRAGMENT_TYPE &&
			newChild.key === null;
		if (isUnkeyedTopLevelFragment) {
			newChild = newChild.props.children;
		}
		// 判断当前fiber的类型
		if (typeof newChild === 'object' && newChild !== null) {
			switch (newChild.$$typeof) {
				case REACT_ELEMENT_TYPE:
					// 是一个reactElement
					return placeSingChild(
						reconcileSingleElement(returnFiber, currentFiber, newChild)
					);
			}

			// TODO 多节点情况 ul > li * 3
			if (Array.isArray(newChild)) {
				return reconcileChildrenArray(returnFiber, currentFiber, newChild);
			}
		}

		// HostText
		if (typeof newChild === 'string' || typeof newChild === 'number') {
			return placeSingChild(
				reconcileSingleTextNode(returnFiber, currentFiber, newChild)
			);
		}

		// 兜底删除

		deleteRemainingChildren(returnFiber, currentFiber);

		if (__DEV__) {
			console.warn('未实现的reconcile类型', newChild);
		}

		return null;
	};
}

// 复用节点
function useFiber(fiber: FiberNode, pendingProps: Props): FiberNode {
	const clone = createWorkInProgress(fiber, pendingProps);
	clone.index = 0;
	clone.sibling = null;
	return clone;
}

function updateFragment(
	returnFiber: FiberNode,
	current: FiberNode | undefined,
	elements: any[],
	key: Key,
	existingChildren: ExistingChildren
) {
	let fiber;
	if (!current || current.tag !== Fragment) {
		fiber = createFiberFromFragment(elements, key);
	} else {
		existingChildren.delete(key);
		fiber = useFiber(current, elements);
	}
	fiber.return = returnFiber;
	return fiber;
}

export const reconcilerChildFibers = ChildReconciler(true);
export const mountChildFibers = ChildReconciler(false);
