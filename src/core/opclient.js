
const chalk = require('chalk')
const fetch = require('node-fetch')
const { Ports } = require('./ports')

class OpenPerfClient {
  constructor (serverIP) {
    this.server = 'http://' + serverIP + ':9000/'
  }

  check () {
    fetch(this.server + 'version').then(x => x.json()).then(x => {
      console.log('Using OpenPerf ' + this.server + ' version ' + chalk.blue(x.version) + ' built on ' + x.build_time)
      return true
    }).catch(e => {
      console.log(chalk.red('** Failed to connect to OpenPerf on ' + this.server + ' ** \n'), e.toString())
      process.exit(-1)
      // return false
    })
  }

  ports () {
    return new Ports(this)
  }

  get (url) {
    // console.log("GET",url);
    return fetch(this.server + url).then(x => x.json())
  }

  delete (url) {
    // console.log("DELETE",url)
    return fetch(this.server + url, {
      method: 'DELETE'
    }).then(x => {
      if (x.status !== 204) throw (new Error('failed'))
    })
  }

  post (url, body, expect) {
    // console.log("POST",url)
    return fetch(this.server + url, {
      method: 'post',
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
        return res.json().then(x => ({
          status: 'ok',
          data: x
        }))
      })
      .then(x => {
        if (x.status !== 'ok') {
          throw (x.reason)
        }
        return x.data
      })
  }
}

module.exports.OpenPerfClient = OpenPerfClient
