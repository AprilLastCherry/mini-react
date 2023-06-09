/*
 * @Author: Leon
 * @Date: 2023-02-22 21:01:17
 * @LastEditors: 最后编辑
 * @LastEditTime: 2023-03-21 17:01:29
 * @description: 文件说明
 */

export type WorkTag =
	| typeof FunctionComponent
	| typeof HostRoot
	| typeof HostComponent
	| typeof HostText
	| typeof Fragment;

export const FunctionComponent = 0;

/* ReactDOM.createRoot(rootElement).render(<App />) 中createRoot创建hostRootFiber */
export const HostRoot = 3;

export const HostComponent = 5;

export const HostText = 6;

export const Fragment = 7;
