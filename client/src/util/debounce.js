const timers = {}

const debounce = (id, delay, fn, callback) => {
  if (timers[id] === undefined) timers[id] = null

  clearTimeout(timers[id])
  timers[id] = setTimeout(async () => {
    const data = await fn.apply(null)
    if (callback) {
      callback(data)
    }
  }, delay)
}

export default debounce
