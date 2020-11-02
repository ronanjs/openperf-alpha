const chalk = require('chalk')
const fetch = require('node-fetch')
const AbortController = require('abort-controller')
const { wait } = require('./utils')
const {
  Ports
} = require('./ports')
const {
  TimeSources
} = require('./timesource')

class OpenPerfClient {
  constructor (serverIP) {
    this.monitor = new Monitor(serverIP, this)
    if (serverIP.split(':').length === 1) {
      serverIP += ':9000'
    }

    this.server = 'http://' + serverIP + '/'
    this.debug = false
  }

  check () {
    return fetch(this.server + 'version').then(x => x.json()).then(x => {
      if (this.debug) console.log('[rest] Using OpenPerf ' + this.server + ' version ' + chalk.blue(x.version) + ' built on ' + x.build_time)
      return x
    }).catch(e => {
      console.log(chalk.red('** Failed to connect to OpenPerf on ' + this.server + ' ** '), e.toString())
      return false
    })
  }

  waitUntilReady () {
    return fetch(this.server + 'version').then((x) => {
      if (x.status === 200) {
        console.log('[rest] OpenPerf ' + this.server + ' is now ready....')
        return true
      }
      console.log('Waiting for OpenPerf to be ready....', x.status)
      return wait(1000).then(() => this.waitUntilReady())
    }).catch(e => {
      console.log('Waiting for OpenPerf to be ready....', e.toString())
      return wait(1000).then(() => this.waitUntilReady())
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
    const timer = setTimeout(() => {
      console.log('Aborting...', url)
      controller.abort()
    }, 30000)

    if (this.debug) console.log('[rest] GET', url)
    return fetch(this.server + url, {
      signal
    }).then(x => {
      clearTimeout(timer)
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
    if (this.debug) console.log('[rest] DELETE', url)
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
    if (this.debug) console.log('[rest] POST', url)
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

class Monitor {
  constructor (serverIP, opClient) {
    this.serverIP = serverIP
    this.opClient = opClient

    if (serverIP.split(':').length === 1) {
      this.server = 'http://' + serverIP + ':8080/'
    } else {
      this.server = 'http://' + serverIP + '/monitor/'
    }

    this.init = fetch(this.server + 'check').then(x => {
      return x.status === 200
    }).catch(e => {
      return false
    })
  }

  restart () {
    return this.init.then(available => {
      if (!available) {
        console.log('[rest] Restart OpenPerf instance ' + this.serverIP + ': no monitor available')
        return false
      }
      return fetch(this.server + 'kill').then(x => x.json()).then(x => {
        console.log('[rest] Restart OpenPerf instance ' + this.serverIP + ': ', x.status)
        if (x.status !== 'ok') return false
        /* Wait for OP to be running again */
        return this.opClient.waitUntilReady()
      }).catch(e => {
        return false
      })
    })
  }

  resource (what) {
    return this.init.then(available => {
      if (!available) return 'n/a'
      return fetch(this.server + 'check').then(x => x.json()).then(x => {
        if (x.status === 'ok') return x.data[what]; return '-'
      }).catch(e => {
        return 'x'
      })
    })
  }
}

module.exports.OpenPerfClient = OpenPerfClient
