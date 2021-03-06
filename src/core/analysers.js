/*
* @Author: ronanjs
* @Date:   2020-10-21 08:34:44
* @Last Modified by:   ronanjs
* @Last Modified time: 2020-11-02 16:48:18
*/

const chalk = require('chalk')

class Analysers {
  constructor (opClient, sourceID) {
    this.sourceID = sourceID
    this.opClient = opClient
  }

  static createFromPort (opClient, portID) {
    return new Analysers(opClient, portID)
  }

  list () {
    return this.opClient.get('packet/analyzers')
  }

  exists (id) {
    return this.list().then(analyzers => analyzers.map(x => x.id).indexOf(id) >= 0)
  }

  delete (id) {
    return this.exists(id).then(x => {
      if (!x) return
      return (new Analyser(this.opClient, id)).delete()
    })
  }

  get (id) {
    return this.exists(id).then(x => x && new Analyser(this.opClient, id))
  }

  async create (id) {
    await this.delete(id)

    const body = {
      id: id,
      source_id: this.sourceID,
      active: true,
      config: {
        protocol_counters: ['ethernet', 'ip', 'transport'],
        flow_counters: ['frame_count', 'frame_length', 'advanced_sequencing', 'interarrival_time', 'latency', 'jitter_ipdv', 'jitter_rfc', 'prbs', 'header']
      }
    }

    return this.opClient.post('packet/analyzers', body, 201).then(x => {
      console.log('[analyser ' + chalk.green(id) + '] created')
      return new Analyser(this.opClient, id)
    }).catch(e => {
      console.error(chalk.red('***failed to create the analyser ' + id + '*** :'), e.toString())
      throw (new Error('Can not create the analyser: ' + e.toString()))
    })
  }
}

class Analyser {
  constructor (opClient, analyserID) {
    this.analyserID = analyserID
    this.opClient = opClient
  }

  init () {
    if (this.internalID) return Promise.resolve()

    /* Check the analyzer-result ID */
    return this.opClient.get('packet/analyzer-results').then(x => {
      this.internalID = null
      const ana = x.filter(x => x.analyzer_id === this.analyserID)[0]
      if (!ana) throw (new Error('No analyser result for ' + this.analyserID))
      this.internalID = ana.id
      this.flows = ana.flows
    })
  }

  results () {
    return this.init().then(() => {
      /* There is a bug with the specific analyser API, so use the global one */
      // return this.opClient.get('packet/analyzer-results/' + this.internalID).then(x => {
      //   return { protocol: x.protocol_counters, flow: x.flow_counters, flows: x.flows }
      // })

      return this.opClient.get('packet/analyzer-results/').then(results => {
        return results.filter(x => x.analyzer_id === this.analyserID).map(x => {
          return { protocol: x.protocol_counters, flow: x.flow_counters, flows: x.flows }
        })[0]
      })
    }).catch(e => {
      console.log('[analyser ' + chalk.green(this.analyserID) + '] ', chalk.red('*** failed to get the results **** '), e.toString())
      return null
    })
  }

  start () {
    return this.opClient.post('packet/analyzers/' + this.analyserID + '/start', null, 201)
      .then(() => {
        console.log('[analyser ' + chalk.green(this.analyserID) + '] started')
        return true
      })
      .catch(e => {
        console.error('***failed to start the analyser*** :', e)
      })
  }

  stop () {
    return this.opClient.post('packet/analyzers/' + this.analyserID + '/stop', null, 204)
      .then(() => {
        console.log('[analyser ' + chalk.green(this.analyserID) + '] stopped')
        return true
      })
      .catch(e => {
        console.log('[analyser ' + chalk.green(this.analyserID) + '] ' + chalk.red('*** failed to stop *** '), e.toString())
        return false
      })
  }

  reset () {
    return this.opClient.post('packet/analyzers/' + this.analyserID + '/reset', null, 201)
      .then(ana => {
        /* A new internval analyser is created upon reset */
        const oldID = this.internalID
        this.internalID = ana.id
        this.opClient.delete('packet/analyzer-results/' + oldID)
        return true
      })
      .catch(e => {
        console.error('***failed to reset the analyser*** :', e)
        return false
      })
  }

  delete () {
    return this.stop().then(() => {
      console.log('[analyser ' + chalk.green(this.analyserID) + '] deleted')
      return this.opClient.delete('packet/analyzers/' + this.analyserID)
    })
  }
}

module.exports.Analysers = Analysers
