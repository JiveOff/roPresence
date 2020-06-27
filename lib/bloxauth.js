// Credit to ClockworkSquirrel for his awesome work!

const { Registry } = require('rage-edit')
const Axios = require('axios')
const RobloxReg = new Registry('HKCU\\\Software\\Roblox\\RobloxStudioBrowser\\roblox.com')

exports.getCookie = () => {
  return RobloxReg.get('.ROBLOSECURITY').then(entry => {
    const data = {}

    entry.split(',').map(dataset => {
      const pairs = dataset.split('::')
      data[pairs[0].toLowerCase()] = pairs[1].substr(1, pairs[1].length - 2)
    })

    if (data.cook === undefined && data.exp === undefined) {
      throw new Error('Couldn\'t get login cookie')
    } else {
      if (new Date(data.exp).getTime() - Date.now() <= 0) {
        throw new Error('Login cookie has expired')
      }
    }

    return data.cook
  })
}

exports.get = options => exports.getCookie().then(cookie => {
  options = typeof (options) === 'object' ? options : {}
  options = Object.assign({ method: 'get' }, options)

  if (typeof (options.headers) !== 'object') options.headers = {}
  options.headers.Cookie = `.ROBLOSECURITY=${cookie}`

  return Axios(options)
})

exports.post = options => exports.getCookie().then(cookie => {
  options = typeof (options) === 'object' ? options : {}
  options = Object.assign({ method: 'post' }, options)

  if (typeof (options.headers) !== 'object') options.headers = {}
  options.headers.Cookie = `.ROBLOSECURITY=${cookie}`

  return Axios(options)
})

exports.getCurrentUser = () => exports.get({
  url: 'https://www.roblox.com/mobileapi/userinfo'
})
