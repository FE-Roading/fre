import { isStr, arrayfy } from './reconcile'
import { FC, FreElement } from './type'

// for jsx2：返回一个vNode树
export const h = (type, props: any, ...kids) => {
  props = props || {}
  // 将所有的子孙节点拍平创建一个一维的Vnode树
  kids = flat(arrayfy(props.children || kids))

  if (kids.length) props.children = kids.length === 1 ? kids[0] : kids

  const key = props.key || null
  const ref = props.ref || null

  if (key) props.key = undefined
  if (ref) props.ref = undefined

  return createVnode(type, props, key, ref)
}

// 判断该值是否是【非空/非布尔】
const some = (x: unknown) => x != null && x !== true && x !== false

// 将一个多维数组中的【非空/非布尔】元素（字符串直接创建为Text的vNode）拍平到新数组。
const flat = (arr: any[], target = []) => {
  arr.forEach(v => {
    isArr(v)
      ? flat(v, target)
      : some(v) && target.push(isStr(v) ? createText(v) : v)
  })
  return target
}

// 创建一个Vnode
export const createVnode = (type, props, key, ref) => ({
  type,
  props,
  key,
  ref,
})

// 创建一个文本vNode：type为#text
export const createText = (vnode: any) =>
  ({ type: '#text', props: { nodeValue: vnode + '' } } as FreElement)

//  直接返回对应的children
export function Fragment(props) {
  return props.children
}

/**
 * 1. 添加一个memo标志位
 * 2. 添加一个shouldUpdate的compare功能
 * @param fn 
 * @param compare 
 * @returns 
 */
export function memo<T extends object>(fn: FC<T>, compare?: FC<T>['shouldUpdate']) {
  fn.memo = true
  fn.shouldUpdate = compare
  return fn
}

// 是否是数组
export const isArr = Array.isArray
