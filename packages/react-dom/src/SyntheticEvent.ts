/*
 * @Author: Leon
 * @Date: 2023-03-14 16:44:50
 * @LastEditors: 最后编辑
 * @LastEditTime: 2023-03-22 16:42:23
 * @description: 合成事件
 */
import { Container } from 'hostConfig';
import { Props } from 'shared/ReactTypes';
// 支持的事件
const vaildEventTypeList = ['click'];

// 事件回调
type EventCallback = (e: Event) => void;

interface SyntheticEvent extends Event {
	__stopPropagation: boolean;
}

// 事件
interface Paths {
	capture: EventCallback[];
	bubble: EventCallback[];
}

export const elementPropsKey = '__props';

export interface DOMElement extends Element {
	[elementPropsKey]: Props;
}

export function updateFiberProps(node: DOMElement, props: Props) {
	node[elementPropsKey] = props;
}

export function initEvent(container: Container, eventType: string) {
	if (!vaildEventTypeList.includes(eventType)) {
		console.warn('当前不支持', eventType, '事件');
	}

	if (__DEV__) {
		console.log('初始化事件: ', eventType);
	}

	container.addEventListener(eventType, (e) => {
		// 每次重新触发事件
		dispatchEvent(container, eventType, e);
	});
}

function dispatchEvent(container: Container, eventType: string, e: Event) {
	const targetELement = e.target;

	if (targetELement === null) {
		console.log('事件不存在target', e);
		return;
	}
	// 1. 收集沿途的事件
	const { capture, bubble } = collectPaths(
		targetELement as DOMElement,
		container,
		eventType
	);
	// 2. 构建合成事件
	const se = createSyntheticEvent(e);
	// 3. 遍历captue
	triggerEventFlow(capture, se);
	// 4. 遍历bubble
	if (!se.__stopPropagation) {
		// 冒泡到当前dom阻止冒泡就不能再往下进行了
		triggerEventFlow(bubble, se);
	}
}

// 事件名映射 click 映射有捕获和冒泡，'onClickCapture', 'onClick'
function getEventCallbackNameFromEventType(
	eventType: string
): string[] | undefined {
	return {
		// [0]: 捕获阶段 [1]: 冒泡阶段
		click: ['onClickCapture', 'onClick']
	}[eventType];
}

// 收集事件
function collectPaths(
	targetELement: DOMElement,
	container: Container,
	eventType: string
): Paths {
	const paths: Paths = {
		capture: [],
		bubble: []
	};

	while (targetELement && targetELement !== container) {
		/**  收集事件的过程 */

		// 获取props
		const elementProps = targetELement[elementPropsKey];

		if (elementProps) {
			// click 映射 onClick onClickCapture
			const callbackNameList = getEventCallbackNameFromEventType(eventType);
			if (callbackNameList) {
				callbackNameList.forEach((callbackName, i) => {
					// 从props中获取对应的事件名是否存在 props['onClickCapture'] or props['onClick']
					const eventCallback = elementProps[callbackName];
					if (eventCallback) {
						// 捕获事件在前
						if (i === 0) {
							// capture
							paths.capture.unshift(eventCallback);
						} else {
							// bubble
							paths.bubble.push(eventCallback);
						}
					}
				});
			}
		}

		targetELement = targetELement.parentNode as DOMElement;
	}

	return paths;
}

// 创建合成事件
function createSyntheticEvent(e: Event): SyntheticEvent {
	const syntheticEvent = e as SyntheticEvent;
	syntheticEvent.__stopPropagation = false;
	const originStopPropagation = e.stopPropagation.bind(e);

	syntheticEvent.stopPropagation = () => {
		syntheticEvent.__stopPropagation = true;
		if (originStopPropagation) {
			originStopPropagation();
		}
	};

	return syntheticEvent;
}

// 触发合成事件
function triggerEventFlow(paths: EventCallback[], se: SyntheticEvent) {
	for (let i = 0; i < paths.length; i++) {
		const callback = paths[i];
		// 业务定义的事件绑定到合成事件上并执行
		callback.call(null, se);

		// 执行完callback.call(null, se)，后如果__stopPropagation变true了，说明阻止冒泡
		if (se.__stopPropagation) {
			break;
		}
	}
}
