import { ITask } from './type'

const queue: ITask[] = []
// 单次任务运行的阈值
const threshold: number = 5
const transitions = []
// 本次任务运行的截止时间戳
let deadline: number = 0

export const startTransition = cb => {
  transitions.push(cb) && translate()
}

// 将callback放入全局的task queue中，开启Transition：主线程执行完成后就执行人空任务队列
export const schedule = (callback: any): void => {
  queue.push({ callback } as any)
  startTransition(flush)
}

/**
 * 返回回调函数用于执行并删除transitions的第一个任务
 * @param pending 为false时使用微任务运行，否则使用宏任务运行
 * @returns 
 */
const task = (pending: boolean) => {
  // 用于——删除并运行首个任务
  const cb = () => transitions.splice(0, 1).forEach(c => c())
  // 如果pending为false时，使用微任务运行cb函数
  if (!pending && typeof queueMicrotask !== 'undefined') {
    return () => queueMicrotask(cb)
  }
  if (typeof MessageChannel !== 'undefined') {
    const { port1, port2 } = new MessageChannel()
    port1.onmessage = cb
    return () => port2.postMessage(null)
  }
  return () => setTimeout(cb)
}

// 非阻塞式运行并删除transitions的第一个任务
let translate = task(false)

/**
 * 清空任务队列，如果一次没执行完则会启用微/宏任务来执行后续任务
 */
const flush = (): void => {
  // 设置本次任务运行的截止时间戳
  deadline = getTime() + threshold
  let job = peek(queue)

  // 存在任务 且 未超过截止时间戳
  while (job && !shouldYield()) {
    // 取出任务的回调
    const { callback } = job as any
    job.callback = null
    // 如果任务回调有返回值，则认为是需要继续执行的任务。如果没有，则移除该任务
    const next = callback()
    if (next) {
      job.callback = next as any
    } else {
      queue.shift()
    }

    // 获取下一个任务
    job = peek(queue)
  }

  // 任务队列还没清空：如果超过截止时间戳，则开启下一个宏任务队来执行；如果未截止时间戳，则开启下一个微任务队来执行————这种情况应该不存在。
  job && (translate = task(shouldYield())) && startTransition(flush)
}

// 是否应该暂停运行：当前截止时间戳大于截止时间戳
export const shouldYield = (): boolean => {
  return getTime() >= deadline
}

// 为从time origin之后到当前调用时经过的时间，精确到毫秒
export const getTime = () => performance.now()

// 获取任务队列的首个任务
const peek = (queue: ITask[]) => queue[0]