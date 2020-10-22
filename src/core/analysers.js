/*
* @Author: ronanjs
* @Date:   2020-10-21 08:34:44
* @Last Modified by:   ronanjs
* @Last Modified time: 2020-10-22 09:52:18
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
            console.log('New analyser ' + chalk.red(id) + ' created')
            return new Analyser(this.opClient, id)
        }).catch(e => {
            console.error('***failed to create the analyser ' + id + '*** :', e)
        })
    }
}

class Analyser {
    constructor (opClient, analyserID) {
        this.analyserID = analyserID
        this.opClient = opClient
    }

    init () {
        if (this.internalID) return

        /* Check the analyzer-result ID */
        return this.opClient.get('packet/analyzer-results').then(x => {
            // console.log("Generator results:",x)
            const ana = x.filter(x => x.analyzer_id === this.analyserID)[0]
            this.internalID = ana.id
            this.flows = ana.flows
            return this
        })
    }

    async results () {
        await this.init()

        return this.opClient.get('packet/analyzer-results/' + this.internalID).then(x => {
            return { protocol: x.protocol_counters, flow: x.flow_counters }
        })
    }

    start () {
        return this.opClient.post('packet/analyzers/' + this.analyserID + '/start', null, 201)
            .catch(e => {
                console.error('***failed to start the analyser*** :', e)
            })
    }

    stop () {
        console.log('Stopping analyser ', this.analyserID)
        return this.opClient.post('packet/analyzers/' + this.analyserID + '/stop', null, 204)
            .catch(e => {
                console.error('***failed to stop the analyser*** :', e)
            })
    }

    reset () {
        return this.opClient.post('packet/analyzers/' + this.analyserID + '/reset', null, 201)
            .then(ana => {
                /* A new internval analyser is created upon reset */
                this.internalID = ana.id
            })
            .catch(e => {
                console.error('***failed to reset the analyser*** :', e)
            })
    }

    delete () {
        return this.stop().then(() => {
            console.log('Deleting analyser ', this.analyserID)
            return this.opClient.delete('packet/analyzers/' + this.analyserID)
        })
    }
}

module.exports.Analysers = Analysers
