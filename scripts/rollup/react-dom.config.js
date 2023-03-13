/*
 * @Author: Leon
 * @Date: 2023-02-21 12:57:21
 * @LastEditors: 最后编辑
 * @LastEditTime: 2023-03-13 17:57:01
 * @description: 文件说明
 */
import { getPackageJSON, resolvePkgPath, getBaseRollupPlugins } from './utils';
import rollupPluginGeneratePackageJson from 'rollup-plugin-generate-package-json';
import alias from '@rollup/plugin-alias';

const { name, module, peerDependencies } = getPackageJSON('react-dom');
// react-dom包的路径
const pkgPath = resolvePkgPath(name);
// react-dom打包后产物路径
const pkgDistPath = resolvePkgPath(name, true);

export default [
	// react-dom
	{
		input: `${pkgPath}/${module}`,
		output: [
			{
				file: `${pkgDistPath}/index.js`,
				name: 'ReactDom',
				format: 'umd'
			},
			{
				file: `${pkgDistPath}/client.js`,
				name: 'client',
				format: 'umd'
			}
		],
		external: [...Object.keys(peerDependencies)],
		plugins: [
			...getBaseRollupPlugins(),
			// webpack resolve alias
			alias({
				entries: {
					hostConfig: `${pkgPath}/src/hostConfig.ts`
				}
			}),
			rollupPluginGeneratePackageJson({
				inputFolder: pkgPath,
				outputFolder: pkgDistPath,
				baseContents: ({ name, description, version }) => ({
					name,
					description,
					version,
					peerDependencies: {
						react: version
					},
					main: 'index.js'
				})
			})
		]
	},
	// react-test-utils
	{
		input: `${pkgPath}/test-utils.ts`,
		output: [
			{
				file: `${pkgDistPath}/test-utils.js`,
				name: 'testUtils',
				format: 'umd'
			}
		],
		external: ['react-dom', 'react'],
		plugins: getBaseRollupPlugins()
	}
];
