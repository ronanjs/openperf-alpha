/*
* @Author: ronanjs
* @Date:   2020-10-21 08:31:11
* @Last Modified by:   ronanjs
* @Last Modified time: 2020-10-21 08:51:03
*/

const { dump } = require('./utils')
const { Generators } = require('./generators')

class Interfaces {
  constructor (opClient) {
    this.opClient = opClient
  }

  async list () {
    return this.opClient.get('interfaces')
  }

  async delete (id) {
    return this.opClient.delete(this.opClient + 'interfaces/' + id)
  }

  async create (id, port) {
    const body = {
      id: id,
      port_id: port,
      config: {
        protocols: [{
          eth: {
            mac_address: '00:00:00:00:00:01'
          }
        }, {
          ipv4: {
            method: 'static',
            static: {
              address: '1.1.1.1',
              prefix_length: 24
            }
          }
        }]
      }
    }

    return this.opClient.post('interfaces', body, 200).then(x => {
      console.log('New interface created\n' + dump(x))
      return new Interface(this.opClient, id)
    }).catch(e => {
      console.error('***failed to create the interface*** :', e)
    })
  }
}

class Interface {
  constructor (opClient, interfaceID) {
    this.opClient = opClient
    this.interfaceID = interfaceID
  }

  generators () {
    return new Generators(this.opClient, this.interfaceID)
  }
}

module.exports.Interfaces = Interfaces
