/*
 * @Author: Leon
 * @Date: 2023-03-06 17:23:23
 * @LastEditors: 最后编辑
 * @LastEditTime: 2023-03-06 22:54:45
 * @description: 文件说明
 */
export type Container = Element;
export type Instance = Element;

// 模拟创建离屏dom , todo props
export const createInstace = (type: string) => {
	// TODO 处理props
	const element = document.createElement(type);
	return element;
};

// 模拟创建插入dom
export const appendInitialChild = (
	parent: Instance | Container,
	child: Instance
) => {
	parent.appendChild(child);
};

// 模拟创建插入dom
export const createTextInstace = (content: string) => {
	return document.createTextNode(content);
};

export const appendChildToContainer = appendInitialChild;
