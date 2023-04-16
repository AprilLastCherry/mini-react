/*
 * @Author: Leon
 * @Date: 2023-02-25 16:22:56
 * @LastEditors: 最后编辑
 * @LastEditTime: 2023-04-02 14:42:21
 * @description: 文件说明
 */

// 经过Diff算法后判断需要插入删除等节点操作的标志
export type Flags = number;

export const NoFlags = 0b0000000;
export const Placement = 0b0000001;
export const Update = 0b0000010;
export const ChildDeletion = 0b0000100;

// useEffect的标志
export const PassiveEffect = 0b0001000;

// MutationMask 表示节点拥有变化
export const MutationMask = Placement | Update | ChildDeletion;
// PassiveMask 表示需要触发useEffect，ChildDeletion代表卸载，会触发useEffect的回调
export const PassiveMask = PassiveEffect | ChildDeletion;
