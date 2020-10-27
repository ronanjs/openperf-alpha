const chalk = require('chalk')
const fetch = require('node-fetch')
const AbortController = require('abort-controller')
const {
  Ports
} = require('./ports')
const {
  TimeSources
} = require('./timesource')

const debug = false

class OpenPerfClient {
  constructor (serverIP) {
    this.server = 'http://' + serverIP + ':9000/'
  }

  check () {
    return fetch(this.server + 'version').then(x => x.json()).then(x => {
      if (debug) console.log('Using OpenPerf ' + this.server + ' version ' + chalk.blue(x.version) + ' built on ' + x.build_time)
      return x
    }).catch(e => {
      console.log(chalk.red('** Failed to connect to OpenPerf on ' + this.server + ' ** \n'), e.toString())
      return null
    })
  }

  ports () {
    return new Ports(this)
  }

  timesources () {
    return new TimeSources(this)
  }

  get (url) {
    const controller = new AbortController()
    const signal = controller.signal
    setTimeout(() => {
      controller.abort()
    }, 30000)

    if (debug) console.log('GET', url)
    return fetch(this.server + url, {
      signal
    }).then(x => {
      if (x.status !== 200) {
        throw (new Error("Invalid response '" + x.status + "' for '" + url + "'"))
      }
      return x.json()
    })
  }

  delete (url) {
    const controller = new AbortController()
    const signal = controller.signal
    setTimeout(() => {
      controller.abort()
    }, 30000)
    if (debug) console.log('DELETE', url)
    return fetch(this.server + url, {
      method: 'DELETE',
      signal
    }).then(x => {
      if (x.status !== 204) throw (new Error('failed'))
    })
  }

  post (url, body, expect) {
    const controller = new AbortController()
    const signal = controller.signal
    setTimeout(() => {
      controller.abort()
    }, 30000)
    if (debug) console.log('POST', url)
    return fetch(this.server + url, {
      method: 'post',
      signal,
      body: body && JSON.stringify(body),
      headers: {
        accept: 'application/json',
        'Content-Type': 'application/json'
      }
    })
      .then(res => {
        if (res.status !== expect) {
          return res.text().then(x => ({
            status: 'error',
            reason: 'response ' + res.status + ': ' + x
          }))
        }
        /* 204 does not expects JSON body */
        if (expect === 204) {
          return res.text().then(x => ({
            status: 'ok',
            data: x
          }))
        }
        return res.json().then(x => ({
          status: 'ok',
          data: x
        }))
      })
      .then(x => {
        if (x.status !== 'ok') {
          throw (new Error(x.reason))
        }
        return x.data
      })
  }
}

module.exports.OpenPerfClient = OpenPerfClient
