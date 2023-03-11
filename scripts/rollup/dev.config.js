/*
 * @Author: Leon
 * @Date: 2023-03-06 22:51:38
 * @LastEditors: 最后编辑
 * @LastEditTime: 2023-03-06 22:52:45
 * @description: 文件说明
 */
import reactDomConfig from './react-dom.config';
import reactConfig from './react.config';

export default () => {
	return [...reactConfig, ...reactDomConfig];
};
