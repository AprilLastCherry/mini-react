/*
 * @Author: Leon
 * @Date: 2023-03-06 17:27:38
 * @LastEditors: 最后编辑
 * @LastEditTime: 2023-03-11 14:32:21
 * @description: 文件说明
 */

// ReactDOM.createRoot(root).render(<App/>)

import {
	createContainer,
	updateContainer
} from 'react-reconciler/src/fiberReconciler';
import { ReactElementType } from 'shared/ReactTypes';
import { Container } from 'hostConfig';

export function createRoot(container: Container) {
	const root = createContainer(container);
	console.log('创建的', root);

	return {
		render(element: ReactElementType) {
			updateContainer(element, root);
		}
	};
}
