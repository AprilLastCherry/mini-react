/*
 * @Author: Leon
 * @Date: 2023-03-02 15:27:24
 * @LastEditors: 最后编辑
 * @LastEditTime: 2023-03-03 14:46:14
 * @description: 文件说明
 */
import { REACT_ELEMENT_TYPE } from 'shared/ReactSymbols';
import { ReactElementType } from 'shared/ReactTypes';
import { createFiberFromElement, FiberNode } from './fiber';
import { Placement } from './fiberFlags';
import { HostText } from './workTags';

// 是否追踪副作用
function ChildReconciler(shouldTrackEffects: boolean) {
	// ReactElement 生成 FiberNode
	function reconcileSingleElement(
		returnFiber: FiberNode,
		currentFiber: FiberNode | null,
		element: ReactElementType
	) {
		// 根据element创建一个Fiber
		const fiber = createFiberFromElement(element);
		// 当前工作单元的WorkInProgress是它的父节点
		fiber.return = returnFiber;
		return fiber;
	}

	function reconcileSingleText(
		returnFiber: FiberNode,
		currentFiber: FiberNode | null,
		content: string | number
	) {
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

	return function reconcilerChildFibers(
		returnFiber: FiberNode,
		currentFiber: FiberNode | null,
		newChild?: ReactElementType
	) {
		// 判断当前fiber的类型
		if (typeof newChild === 'object' && newChild !== null) {
			switch (newChild.$$typeof) {
				case REACT_ELEMENT_TYPE:
					// 是一个reactElement
					return placeSingChild(
						reconcileSingleElement(returnFiber, currentFiber, newChild)
					);
				default:
					if (__DEV__) {
						console.warn('未实现的reconcile类型', newChild);
					}
					break;
			}
		}

		// TODO 多节点情况 ul > li * 3

		// HostText
		if (typeof newChild === 'string' || typeof newChild === 'number') {
			return placeSingChild(
				reconcileSingleText(returnFiber, currentFiber, newChild)
			);
		}

		if (__DEV__) {
			console.warn('未实现的reconcile类型', newChild);
		}

		return null;
	};
}

export const reconcilerChildFibers = ChildReconciler(true);
export const mountChildFibers = ChildReconciler(false);
