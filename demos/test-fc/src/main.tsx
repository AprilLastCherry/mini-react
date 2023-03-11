/*
 * @Author: Leon
 * @Date: 2023-03-11 14:19:59
 * @LastEditors: 最后编辑
 * @LastEditTime: 2023-03-11 20:47:07
 * @description: 文件说明
 */
import { useState } from 'react';
import ReactDOM from 'react-dom/client';

function Child() {
	return <span>APP min-react</span>;
}

function App() {
	const [count, setCount] = useState(10);
	console.log(count);
	return <div>{count}</div>;
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
	<App />
);
