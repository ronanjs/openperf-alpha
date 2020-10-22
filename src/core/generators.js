/*
* @Author: ronanjs
* @Date:   2020-10-21 08:30:12
* @Last Modified by:   ronanjs
* @Last Modified time: 2020-10-22 09:52:23
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
        return this.list().then(generators => generators.map(x => x.id).indexOf(id) >= 0)
    }

    delete (id) {
        return this.exists(id).then(x => {
            if (!x) return
            return (new Generator(this.opClient, id)).delete()
        })
    }

    async create (id) {
        await this.delete(id)

        const ethernet = {
            source: '00:10:f3:83:67:b2',
            destination: '00:1b:cd:03:04:4d'
        }
        const ipv4 = {
            source: '192.18.1.1',
            destination: '192.19.1.2',
            header_length: 20,
            protocol: 254,
            time_to_live: 64,
            version: 4
        }
        const udp = {
            destination: 80,
            source: 80
        }

        const traffic = {
            length: {
                fixed: 512
            },
            signature: {
                stream_id: 0x1000,
                latency: 'start_of_frame'
            },
            packet: {
                modifier_tie: 'zip',
                protocols: [{
                    ethernet
                }, {
                    ipv4
                }, {
                    udp
                }]
            },
            weight: 1
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
                load: {
                    burst_size: 1,
                    rate: {
                        period: 'seconds',
                        value: 10
                    },
                    units: 'frames'
                },
                traffic: [traffic]
            }
        }

        return this.opClient.post('packet/generators', body, 201).then(x => {
            console.log('New generator ' + chalk.red(id) + ' created')
            return new Generator(this.opClient, id)
        }).catch(e => {
            console.error('***failed to create the generator ' + id + '*** :', e)
        })
    }
}

class Generator {
    constructor (opClient, genID) {
        this.opClient = opClient
        this.genID = genID
    }

    init () {
        if (this.internalID) return

        /* Check the generator-result ID */
        return this.opClient.get('packet/generator-results').then(x => {
            // console.log("Generator results:",x)
            const gen = x.filter(x => x.generator_id === this.genID)[0]
            this.internalID = gen.id
            this.flows = gen.flows
            return this
        })
    }

    async results () {
        await this.init()

        return this.opClient.get('packet/generator-results/' + this.internalID).then(x => {
            return { protocol: x.protocol_counters }
        })
    }

    start () {
        return this.opClient.post('packet/generators/' + this.genID + '/start', null, 201)
            .then(x => {
                return true
            })
            .catch(e => {
                if (e.toString().indexOf('reason: socket hang up') < 0) {
                    console.error('***failed to start the generator*** :', e.toString())
                }
                return false
            })
    }

    stop () {
        console.log('Stopping generator ', this.genID)
        return this.opClient.post('packet/generators/' + this.genID + '/stop', null, 204)
            .catch(e => {
                console.error('***failed to stop the generator*** :', e)
            })
    }

    delete () {
        return this.stop().then(() => {
            console.log('Deleting generator ', this.genID)
            return this.opClient.delete('packet/generators/' + this.genID)
        })
    }
}

module.exports.Generator = Generator
module.exports.Generators = Generators
