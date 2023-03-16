/*
 * @Author: Leon
 * @Date: 2023-03-06 17:27:38
 * @LastEditors: 最后编辑
 * @LastEditTime: 2023-03-15 14:32:26
 * @description: 文件说明
 */

// ReactDOM.createRoot(root).render(<App/>)

import {
	createContainer,
	updateContainer
} from 'react-reconciler/src/fiberReconciler';
import { ReactElementType } from 'shared/ReactTypes';
import { Container } from 'hostConfig';
import { initEvent } from './SyntheticEvent';

export function createRoot(container: Container) {
	// 生成根节点 FiberRootNode
	const root = createContainer(container);

	return {
		render(element: ReactElementType) {
			initEvent(container, 'click');
			return updateContainer(element, root);
		}
	};
}
