import { Attributes, DOM, IFiber } from './type'
import { isStr, TAG } from './reconcile'

const defaultObj = {} as const

/**
 * 新旧props遍历并依次调用callback执行
 * 1. 遍历旧props的属性，调用callback处理新旧值
 * 2. 遍历新props的属性，调用callback处理新增属性
 * @param aProps 
 * @param bProps 
 * @param callback 
 */
const jointIter = <P extends Attributes>(
  aProps: P,
  bProps: P,
  callback: (name: string, a: any, b: any) => void
) => {
  aProps = aProps || defaultObj as P
  bProps = bProps || defaultObj as P
  Object.keys(aProps).forEach(k => callback(k, aProps[k], bProps[k])) 
  Object.keys(bProps).forEach(k => !aProps.hasOwnProperty(k) && callback(k,undefined, bProps[k])) 
}

/***
 * 更新节点：
 * 1. 对于新旧属性完全相同或节点名字为children则不做任何处理
 * 2. 处理style
 * 3. 处理on开头的事件：先移除再重新添加
 * 4. 处理非SVG元素的dom属性
 * 5. 对于新属性为null或false的直接移除
 * 6. 更新属性为新值
 * 
 */
export const updateElement = <P extends Attributes>(
  dom: DOM,
  aProps: P,
  bProps: P
) => {
  jointIter(aProps, bProps, (name, a, b) => {
    if (a === b || name === 'children') {
    } else if (name === 'style' && !isStr(b)) {
      jointIter(a, b, (styleKey, aStyle, bStyle) => {
        if (aStyle !== bStyle) {
          ;(dom as any)[name][styleKey] = bStyle || ''
        }
      })
    } else if (name[0] === 'o' && name[1] === 'n') {
      name = name.slice(2).toLowerCase() as Extract<keyof P, string>
      if (a) dom.removeEventListener(name, a)
      dom.addEventListener(name, b)
    } else if (name in dom && !(dom instanceof SVGElement)) {
      ;(dom as any)[name] = b || ''
    } else if (b == null || b === false) {
      dom.removeAttribute(name)
    } else {
      dom.setAttribute(name, b)
    }
  })
}

/**
 * 1. 创建节点，主要分为以下几种情况：
 *   1. 文本节点
 *   2. SVG节点
 *   3. 普通的HTML节点
 * 2. 更新节点
 * @param fiber 
 * @returns 
 */
export const createElement = <P = Attributes>(fiber: IFiber) => {
  const dom =
    fiber.type === '#text'
      ? document.createTextNode('')
      : fiber.lane & TAG.SVG
      ? document.createElementNS(
          'http://www.w3.org/2000/svg',
          fiber.type as string
        )
      : document.createElement(fiber.type as string)
  updateElement(dom as DOM, {} as P, fiber.props as P)
  return dom
}
