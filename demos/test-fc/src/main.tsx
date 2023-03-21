/*
 * @Author: Leon
 * @Date: 2023-03-11 14:19:59
 * @LastEditors: 最后编辑
 * @LastEditTime: 2023-03-21 11:45:24
 * @description: 文件说明
 */
import { useState } from 'react';
import ReactDOM from 'react-dom/client';

function Child() {
	return <span>APP min-react</span>;
}

function App() {
	const [count, setCount] = useState(1);
	const arr =
		count % 2 === 0
			? [<li key="1">1</li>, <li key="2">2</li>, <li key="3">3</li>]
			: [<li key="3">3</li>, <li key="2">2</li>, <li key="1">1</li>];
	// return (
	// 	<div
	// 		onClick={() => {
	// 			console.log('div click');
	// 		}}
	// 		onClickCapture={() => {
	// 			console.log('div onClickCapture');
	// 		}}
	// 	>
	// 		<p
	// 			onClick={(e) => {
	// 				e.stopPropagation();
	// 				console.log('p click');
	// 			}}
	// 			onClickCapture={() => {
	// 				console.log('p onClickCapture');
	// 			}}
	// 		>
	// 			<span
	// 				onClick={() => {
	// 					console.log('sp click');
	// 					setCount(count + 1);
	// 				}}
	// 				onClickCapture={() => {
	// 					console.log('sp onClickCapture');
	// 				}}
	// 			>
	// 				{count === 3 ? <Child /> : count}
	// 			</span>
	// 		</p>
	// 	</div>
	// );

	return (
		<div onClick={() => setCount(count + 1)}>
			{/* {count % 2 === 0 ? <Child /> : count} */}
			<ul>{arr}</ul>
		</div>
	);
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
	<App />
);
