/*
* @Author: ronanjs
* @Date:   2020-10-21 08:31:11
* @Last Modified by:   ronanjs
* @Last Modified time: 2020-10-21 10:59:43
*/

const { dump } = require('./utils')

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
            console.log('New time source created\n' + dump(x))
        }).catch(e => {
            console.error('***failed to create the time source*** :', e)
        })
    }
}

module.exports.TimeSources = TimeSources
