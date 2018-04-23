const timers = {}

const debounce = (id, delay, fn, args) => {
  if (timers[id] === undefined) timers[id] = null

  clearTimeout(timers[id])
  timers[id] = setTimeout(async () => {
    await fn.apply(null, args)
  }, delay)
}

export default debounce
