/*
 * @Author: Leon
 * @Date: 2023-03-13 17:59:54
 * @LastEditors: 最后编辑
 * @LastEditTime: 2023-03-13 18:43:07
 * @description: 文件说明
 */
const { defaults } = require('jest-config');
// console.log(process.cwd());
module.exports = {
	...defaults,
	rootDir: process.cwd(),
	modulePathIgnorePatterns: ['<rootDir>/.history'],
	moduleDirectories: [
		// 对于 React ReactDOM
		'dist/node_modules',
		// 对于第三方依赖
		...defaults.moduleDirectories
	],
	testEnvironment: 'jsdom'
};
