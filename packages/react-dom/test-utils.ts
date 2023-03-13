/*
 * @Author: Leon
 * @Date: 2023-03-13 17:25:52
 * @LastEditors: 最后编辑
 * @LastEditTime: 2023-03-13 19:53:42
 * @description: 文件说明
 */
import { ReactElementType } from 'shared/ReactTypes';
// React和ReactDom作为外部包引入
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { createRoot } from 'react-dom';

export function renderIntoDocument(element: ReactElementType) {
	const div = document.createElement('div');
	// element
	return createRoot(div).render(element);
}
