/*
* @Author: ronanjs
* @Date:   2020-10-21 08:33:24
* @Last Modified by:   ronanjs
* @Last Modified time: 2020-10-21 08:57:24
*/

const chalk = require('chalk')
const { wait, dump } = require('./utils')

class Captures {
  constructor (opClient, sourceID) {
    this.sourceID = sourceID
    this.opClient = opClient
  }

  static createFromPort (opClient, portID) {
    return new Captures(opClient, portID)
  }

  list () {
    return this.opClient.get('packet/captures')
  }

  exists (id) {
    return this.list().then(captures => {
      return captures.map(x => x.id).indexOf(id) >= 0
    })
  }

  delete (id) {
    return this.exists(id).then(x => {
      if (!x) return
      return (new Capture(this.opClient, id)).delete()
    })
  }

  async create (id) {
    await this.delete(id)

    const body = {
      id: id,
      source_id: this.sourceID,
      active: true,
      direction: 'rx_and_tx',
      config: {
        mode: 'buffer',
        buffer_size: 4096
      }
    }

    return this.opClient.post('packet/captures', body, 201).then(x => {
      console.log('New capture ' + chalk.red(id) + ' created')
      return new Capture(this.opClient, id)
    }).catch(e => {
      console.error('***failed to create the capture ' + id + '*** :', e, dump(body))
    })
  }
}

class Capture {
  constructor (opClient, captureID) {
    this.captureID = captureID
    this.opClient = opClient
  }

  init () {
    if (this.internalID) return

    /* Check the capture-result ID */
    return this.opClient.get('packet/capture-results').then(x => {
      const ana = x.filter(x => x.capture_id === this.captureID)[0]
      if (!ana) return false
      this.internalID = ana.id
      return true
    })
  }

  async results () {
    if (!await this.init()) return Promise.resolve({})

    return this.opClient.get('packet/capture-results/' + this.internalID)
  }

  start () {
    return this.opClient.post('packet/captures/' + this.captureID + '/start', null, 201)
      .catch(e => {
        console.error('***failed to start the capture*** :', e)
      })
  }

  stop () {
    console.log('Stopping capture', this.captureID)
    return this.opClient.post('packet/captures/' + this.captureID + '/stop', null, 201)
      .catch(e => {
        console.error('***failed to stop the capture*** :', e)
      })
  }

  delete () {
    return this.stop().then(() => {
      console.log('Deleting capture', this.captureID)
      return this.opClient.delete('packet/captures/' + this.captureID).then(() => {
        console.log('Capture ' + this.captureID + ' is now deleted...')
        return wait(500)
      })
    })
  }
}

module.exports.Captures = Captures
