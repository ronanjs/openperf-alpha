/*
* @Author: ronanjs
* @Date:   2020-10-21 08:31:11
* @Last Modified by:   ronanjs
* @Last Modified time: 2020-10-30 12:46:48
*/

// const { dump } = require('./utils')

class TimeSources {
  constructor (opClient) {
    this.opClient = opClient
  }

  async list () {
    return this.opClient.get('time-sources')
  }

  async delete (id) {
    return this.opClient.delete(this.opClient + 'time-sources/' + id)
  }

  async create (id, hostname, port = '123') {
    const body = {
      id: id,
      kind: 'ntp',
      config: {
        ntp: {
          hostname: hostname,
          port: port
        }
      }
    }

    return this.opClient.post('time-sources', body, 200).then(x => {
      // console.log('New time source created\n' + dump(x))
      return new TimeSource(this.opClient, id)
    }).catch(e => {
      console.error('***failed to create the time source*** :', e)
      return null
    })
  }
}

class TimeSource {
  constructor (opClient, tsID) {
    this.opClient = opClient
    this.id = tsID
  }

  stats () {
    return this.opClient.get('time-sources/' + this.id)
      .then(x => x.stats.ntp)
      .catch(e => {
        throw (new Error("No timesource '" + this.id + "'"))
      })
  }

  keeper () {
    return this.opClient.get('time-keeper')
      .then(x => ({ state: x.state, stats: x.stats }))
  }
}

module.exports.TimeSources = TimeSources
