/*
* @Author: ronanjs
* @Date:   2020-10-21 08:07:19
* @Last Modified by:   ronanjs
* @Last Modified time: 2020-10-21 08:52:06
*/
const fetch = require('node-fetch')
const chalk = require('chalk')

function post (url, body, expect) {
  return fetch(url, {
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

const dump = x => JSON.stringify(x, null, 4).split('\n').map(x => ' > ' + chalk.blue(x)).join('\n')

const wait = x => new Promise((resolve) => setTimeout(() => resolve(), x))

module.exports.post = post
module.exports.dump = dump
module.exports.wait = wait
