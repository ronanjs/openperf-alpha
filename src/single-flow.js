/*
* @Author: ronanjs
* @Date:   2020-10-21 08:33:42
* @Last Modified by:   ronanjs
* @Last Modified time: 2020-10-22 09:52:57
*/

const chalk = require('chalk')
const { wait } = require('./core/utils')

const { OpenPerfClient } = require('./core/opclient')
const { TimeSources } = require('./core/timesource')

async function run (genServerIP, genPortID, anaServerIP, anaPortID) {
    const genClient = new OpenPerfClient(genServerIP)
    const anaClient = new OpenPerfClient(anaServerIP)

    await Promise.all([genClient.check(), anaClient.check()])

    const genTimesources = new TimeSources(genClient)
    const genTimesource = await genTimesources.create('timesource-gen-01', '192.168.10.97')

    const anaTimesources = new TimeSources(anaClient)
    const anaTimesource = await anaTimesources.create('timesource-ana-01', '192.168.10.98')

    const genPort = await genClient.ports().get(genPortID)
    const anaPort = await anaClient.ports().get(anaPortID)

    const gen = await genPort.generators().create('generator-01')
    if (!gen) return

    const ana = await anaPort.analysers().create('analyser-01')
    if (!ana) return

    await wait(1000)

    await ana.start()
    if (!await gen.start()) {
        console.log('Sorry... failed to start the generator.. please try again')
        return
    }

    while (true) {
        const [genres, anares, gents, anats] = await Promise.all([
            gen.results(),
            ana.results(),
            genTimesource.stats(),
            anaTimesource.stats()
        ])

        const format = (name, x) =>
            chalk.blue(name) + '(µs):' +
            ((Math.round(x.min / 100) / 10).toString()).padEnd(6) +
            chalk.grey('->') +
            ((Math.round(x.max / 100) / 10).toString()).padEnd(6) +
            ' '

        console.log(
            'generator:[', 'tx:', genres.protocol.ip.ipv4.toString().padEnd(4),
            'ntp:', gents.rx_packets + '/' + gents.stratum, '] ',
            'analyser:[', 'rx:', anares.protocol.ip.ipv4.toString().padEnd(3),
            'ntp:', anats.rx_packets + '/' + anats.stratum, ']',
            format('latency', anares.flow.latency.summary),
            format('jitter', anares.flow.jitter_ipdv.summary)
            // format("interarrival",anares.flow.interarrival.summary),
        )

        ana.reset()
        await wait(200)
    }
}

if (process.argv.length === 3) {
    run(process.argv[2], 'port0', process.argv[2], 'port1')
} else if (process.argv.length === 4) {
    run(process.argv[2], 'port0', process.argv[3], 'port0')
} else {
    console.log('please speficy the OpenPerf RestAPI endpoint (eg node src/single-flow.js 10.109.4.112)')
}
