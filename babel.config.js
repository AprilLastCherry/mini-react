/*
 * @Author: Leon
 * @Date: 2023-03-13 18:54:35
 * @LastEditors: 最后编辑
 * @LastEditTime: 2023-03-13 18:55:50
 * @description: babel配置，解决代码中jest测试时jsx代码编译问题
 */
module.exports = {
	presets: ['@babel/preset-env'],
	plugins: [['@babel/plugin-transform-react-jsx', { throwIfNamespace: false }]]
};
