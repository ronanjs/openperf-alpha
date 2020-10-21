/*
* @Author: ronanjs
* @Date:   2020-10-21 08:34:44
* @Last Modified by:   ronanjs
* @Last Modified time: 2020-10-21 09:51:40
*/

const chalk = require('chalk')
const { Generators } = require('./generators')
const { Analysers } = require('./analysers')

class Ports {
  constructor (opClient) {
    this.opClient = opClient
  }

  list () {
    return this.opClient.get('ports')
  }

  exists (id) {
    return this.list().then(ports => ports.map(x => x.id).indexOf(id) >= 0)
  }

  async get (id) {
    if (await !this.exists(id)) {
      throw (new Error('Port ' + chalk.red(id) + ' does not exist...'))
    }
    return new Port(this.opClient, id)
  }
}

class Port {
  constructor (opClient, portID) {
    this.opClient = opClient
    this.portID = portID
  }

  analysers () {
    return Analysers.createFromPort(this.opClient, this.portID)
  }

  generators () {
    return Generators.createFromPort(this.opClient, this.portID)
  }
}

module.exports.Ports = Ports
