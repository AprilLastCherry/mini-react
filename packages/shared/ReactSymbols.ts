/*
 * @Author: Leon
 * @Date: 2023-02-20 23:11:04
 * @LastEditors: 最后编辑
 * @LastEditTime: 2023-02-20 23:30:41
 * @description: 文件说明
 */
const supportSymbol = typeof Symbol === 'function' && Symbol.for;

// 判断是不是支持Symbol类型，支持就定义一个Symbol类型， 不支持就使用一个数字，用于表示当前的元素是一个react类型
export const REACT_ELEMENT_TYPE = supportSymbol
	? Symbol.for('react.element')
	: 0xeac7;
