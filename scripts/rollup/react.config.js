/*
 * @Author: Leon
 * @Date: 2023-02-21 12:57:21
 * @LastEditors: 最后编辑
 * @LastEditTime: 2023-03-13 17:36:07
 * @description: 文件说明
 */
import { getPackageJSON, resolvePkgPath, getBaseRollupPlugins } from './utils';
import rollupPluginGeneratePackageJson from 'rollup-plugin-generate-package-json';

const { name, module } = getPackageJSON('react');
// react包的路径
const pkgPath = resolvePkgPath(name);
// react打包后产物路径
const pkgDistPath = resolvePkgPath(name, true);

export default [
	{
		input: `${pkgPath}/${module}`,
		output: {
			file: `${pkgDistPath}/index.js`,
			name: 'React',
			format: 'umd'
		},
		plugins: [
			...getBaseRollupPlugins(),
			rollupPluginGeneratePackageJson({
				inputFolder: pkgPath,
				outputFolder: pkgDistPath,
				baseContents: ({ name, description, version }) => ({
					name,
					description,
					version,
					main: 'index.js'
				})
			})
		]
	},
	{
		input: `${pkgPath}/src/jsx.ts`,
		output: [
			// jsx-runtime
			{
				file: `${pkgDistPath}/jsx-runtime.js`,
				name: 'jsx-runtime',
				format: 'umd'
			},
			// jsx-dev-runtime
			{
				file: `${pkgDistPath}/jsx-dev-runtime.js`,
				name: 'jsx-dev-runtime',
				format: 'umd'
			}
		],
		plugins: [getBaseRollupPlugins()]
	}
];
