/*
 * @Author: Leon
 * @Date: 2023-03-11 14:19:59
 * @LastEditors: 最后编辑
 * @LastEditTime: 2023-03-11 16:15:38
 * @description: 文件说明
 */
import React from 'react';
import ReactDOM from 'react-dom/client';

function Child() {
	return <span>APP min-react</span>;
}

function App() {
	return (
		<div>
			<Child />
		</div>
	);
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
	<App />
);
