/*
* @Author: ronanjs
* @Date:   2020-10-21 08:31:11
* @Last Modified by:   ronanjs
* @Last Modified time: 2020-11-02 08:49:53
*/

// const { dump } = require('./utils')
const chalk = require('chalk')

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
        console.log('[timesource ' + chalk.green(this.id) + '] ' + chalk.red('*** failed to get the stats *** '), e.toString())
        return null
      })
  }

  keeper () {
    return this.opClient.get('time-keeper')
      .then(x => ({ state: x.state, stats: x.stats }))
      .catch(e => {
        console.log('[timesource ' + chalk.green(this.id) + '] ' + chalk.red('*** failed to get the keeper *** '), e.toString())
        return null
      })
  }
}

module.exports.TimeSources = TimeSources
