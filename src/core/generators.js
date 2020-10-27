/*
* @Author: ronanjs
* @Date:   2020-10-21 08:30:12
* @Last Modified by:   ronanjs
* @Last Modified time: 2020-10-27 10:24:44
*/

const chalk = require('chalk')

class Generators {
  constructor (opClient, targetID) {
    this.targetID = targetID
    this.opClient = opClient
  }

  static createFromPort (opClient, portID) {
    return new Generators(opClient, portID)
  }

  list () {
    return this.opClient.get('packet/generators')
  }

  exists (id) {
    return this.list().then(generators => {
      return generators.map(x => x.id).indexOf(id) >= 0
    })
  }

  delete (id) {
    return this.exists(id).then(x => {
      if (!x) return
      return (new Generator(this.opClient, id)).delete()
    })
  }

  get (id) {
    return this.exists(id).then(x => x && new Generator(this.opClient, id))
  }

  async create (id, opts = {}) {
    await this.delete(id)

    if (!opts.traffic) {
      throw (new Error('You must specific traffic to be generated in the options'))
    }

    const body = {
      id: id,
      target_id: this.targetID,
      active: true,
      config: {
        order: 'round-robin',
        protocol_counters: ['ethernet', 'ip', 'transport'],
        duration: {
          continuous: true
        },
        load: opts.load || {
          burst_size: 1,
          rate: {
            period: 'seconds',
            value: 10
          },
          units: 'frames'
        },
        traffic: [opts.traffic]
      }
    }

    return this.opClient.post('packet/generators', body, 201).then(x => {
      // console.log('[generator ' + chalk.red(id) + '] created')
      return new Generator(this.opClient, id)
    }).catch(e => {
      console.log('[generator ' + chalk.red(id) + '] *** failed to create **** ', e)
      throw (new Error('Can not create the generator: ' + e.toString()))
    })
  }
}

class Generator {
  constructor (opClient, genID) {
    this.opClient = opClient
    this.genID = genID
  }

  init () {
    if (this.internalID) return Promise.resolve(this.internalID)

    /* Check the generator-result ID */
    return this.opClient.get('packet/generator-results').then(x => {
      const gen = x.filter(x => x.generator_id === this.genID)
      if (gen.length === 0) {
        return null
      }
      this.internalID = gen[0].id
      this.flows = gen.flows
      return this.internalID
    })
  }

  results () {
    return this.init().then(id => {
      if (!id) return null
      return this.opClient.get('packet/generator-results/' + id).then(x => {
        return { protocol: x.protocol_counters, flows: x.flows }
      })
    }).catch(e => {
      console.log('[generator ' + chalk.red(this.genID) + '] *** failed to get the results **** ', e)
      return null
    })
  }

  start () {
    return this.opClient.post('packet/generators/' + this.genID + '/start', null, 201)
      .then(x => {
        // console.log('[generator ' + chalk.red(this.genID) + '] started')
        return true
      })
      .catch(e => {
        if (e.toString().indexOf('reason: socket hang up') < 0) {
          console.log('[generator ' + chalk.red(this.genID) + '] *** failed to start **** ', e)
        }
        return false
      })
  }

  stop () {
    return this.opClient.post('packet/generators/' + this.genID + '/stop', null, 204)
      .then(() => {
        console.log('[generator ' + chalk.red(this.genID) + '] stopped')
        return true
      })
      .catch(e => {
        if (e.toString().indexOf('reason: socket hang up') < 0) {
          console.log('[generator ' + chalk.red(this.genID) + '] *** failed to stop **** ', e)
        }
        return false
      })
  }

  delete () {
    return this.stop().then(() => {
      return this.opClient.delete('packet/generators/' + this.genID).then(x => {
        console.log('[generator ' + chalk.red(this.genID) + '] deleted')
        return true
      })
    })
  }
}

module.exports.Generator = Generator
module.exports.Generators = Generators
