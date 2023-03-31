/*
 * @Author: Leon
 * @Date: 2023-03-11 14:19:59
 * @LastEditors: 最后编辑
 * @LastEditTime: 2023-03-31 16:30:15
 * @description: 文件说明
 */
import { useState } from 'react';
import ReactDOM from 'react-dom/client';

function App() {
	const [count, setCount] = useState(1);
	const arr =
		count % 2 === 0
			? [<li key="1">1</li>, <li key="2">2</li>, <li key="3">3</li>]
			: [<li key="3">3</li>, <li key="2">2</li>, <li key="1">1</li>];

	return (
		<ul
			onClickCapture={() => {
				let num = count + 1;
				setCount(num);
				num += 1;
				setCount(num);
				num += 1;
				setCount(num);
			}}
		>
			{count}
		</ul>
	);
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
	<App />
);
