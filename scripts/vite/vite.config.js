/*
 * @Author: Leon
 * @Date: 2023-03-11 14:19:59
 * @LastEditors: 最后编辑
 * @LastEditTime: 2023-03-11 14:41:49
 * @description: vite 热更新使用，在package.json执行中使用的config配置，--force参数要求每次都执行一次预编译，不然会缓存上次的编译数据
 */
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import replace from '@rollup/plugin-replace';
import { resolvePkgPath } from '../rollup/utils';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [
		react(),
		replace({
			__DEV__: true,
			preventAssignment: true
		})
	],
	resolve: {
		alias: [
			{
				find: 'react',
				replacement: resolvePkgPath('react')
			},
			{
				find: 'react-dom',
				replacement: resolvePkgPath('react-dom')
			},
			{
				find: 'hostConfig',
				replacement: path.resolve(
					resolvePkgPath('react-dom'),
					'./src/hostConfig.ts'
				)
			}
		]
	}
});
