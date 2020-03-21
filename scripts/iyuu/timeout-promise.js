class TimeoutPromise extends Promise {
  constructor (callback, ms = 30 * 1000) {
    let timeout
    const wrapperPromise = Promise.race([
      new Promise(callback),
      new Promise((resolve, reject) => {
        timeout = setTimeout(() => {
          reject(new Error('TIMEOUT'))
        }, ms)
      })
    ])

    super((resolve, reject) => {
      wrapperPromise.then((data) => {
        clearTimeout(timeout)
        resolve(data)
      }).catch((error) => {
        clearTimeout(timeout)
        reject(error)
      })
    })
  }
}

module.exports = TimeoutPromise
