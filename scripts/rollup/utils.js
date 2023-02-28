/*
 * @Author: Leon
 * @Date: 2023-02-21 12:58:30
 * @LastEditors: 最后编辑
 * @LastEditTime: 2023-03-01 00:50:39
 * @description: 文件说明
 */
import path from 'path';
import fs from 'fs';

import ts from 'rollup-plugin-typescript2';
import cjs from '@rollup/plugin-commonjs';
import replace from '@rollup/plugin-replace';

const pkgPath = path.resolve(__dirname, '../../packages');
const distPath = path.resolve(__dirname, '../../dist/node_modules');

// 得到包路径活着打包目标路径
export function resolvePkgPath(pkgName, isDist) {
	return `${isDist ? distPath : pkgPath}/${pkgName}`;
}

// 得到包下的package.json路径
export function getPackageJSON(pkgName) {
	const curPath = `${resolvePkgPath(pkgName)}/package.json`;
	const str = fs.readFileSync(curPath, { encoding: 'utf-8' });
	return JSON.parse(str);
}

export function getBaseRollupPlugins({
	alias = {
		__DEV__: true
	},
	typescript = {}
} = {}) {
	return [replace(alias), cjs(), ts(typescript)];
}
