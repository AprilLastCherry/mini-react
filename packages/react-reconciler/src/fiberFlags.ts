/*
 * @Author: Leon
 * @Date: 2023-02-25 16:22:56
 * @LastEditors: 最后编辑
 * @LastEditTime: 2023-02-28 15:18:13
 * @description: 文件说明
 */

// 经过Diff算法后判断需要插入删除等节点操作的标志
export type Flags =
	| typeof NoFlags
	| typeof Placement
	| typeof Update
	| typeof ChildDeletion;

export const NoFlags = 0b0000001;
export const Placement = 0b0000010;
export const Update = 0b0000100;
export const ChildDeletion = 0b0001000;
