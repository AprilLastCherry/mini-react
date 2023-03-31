import { FiberRootNode } from './fiber';

/*
 * @Author: Leon
 * @Date: 2023-03-23 18:09:07
 * @LastEditors: 最后编辑
 * @LastEditTime: 2023-03-28 14:42:06
 * @description: 文件说明
 */
export type Lane = number;
export type Lanes = number;
export const SyncLane = 0b0001;
export const NoLane = 0b0000;
export const NoLanes = 0b0000;

export function mergeLanes(laneA: number, laneB: number) {
	return laneA | laneB;
}

export function requestUpdateLanes() {
	return SyncLane;
}

// 获取lane中最低位是哪个
export function getHighestPriorityLane(lanes: Lanes): Lane {
	// -lanes 为补码存储，即（～x + 1）, 整体就是 lanes & (~lanes + 1); 得到最低的一位是什么
	return lanes & -lanes;
}

// 清除被使用的lane
export function markRootFinished(root: FiberRootNode, lane: Lane) {
	root.pendingLanes &= ~lane;
}
