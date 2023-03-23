/*
 * @Author: Leon
 * @Date: 2023-02-20 23:32:03
 * @LastEditors: 最后编辑
 * @LastEditTime: 2023-03-21 16:44:34
 * @description: 文件说明
 */
export type Type = any;
export type Key = any;
export type Ref = any;
export type Props = any;
export type ElementType = any;

// React 元素对象
export interface ReactElementType {
	$$typeof: symbol | number;
	type: ElementType;
	key: Key;
	ref: Ref;
	props: Props;
	__mark: string;
}

export type Action<State> = State | ((prevState: State) => State);
