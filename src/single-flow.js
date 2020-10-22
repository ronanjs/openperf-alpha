/*
* @Author: ronanjs
* @Date:   2020-10-21 08:33:42
* @Last Modified by:   ronanjs
* @Last Modified time: 2020-10-22 08:14:10
*/

const chalk = require('chalk')
const { table } = require('table')
const { wait } = require('./core/utils')

// const { Captures } = require('./core/captures')
const { OpenPerfClient } = require('./core/opclient')
const { TimeSources } = require('./core/timesource')

async function run (genServerIP, genPortID, anaServerIP, anaPortID) {
    const genClient = new OpenPerfClient(genServerIP)
    const anaClient = new OpenPerfClient(anaServerIP)

    await Promise.all([genClient.check(), anaClient.check()])

    const genTimesources = new TimeSources(genClient)
    await genTimesources.create('timesource-gen-01', '192.168.10.97')

    const anaTimesources = new TimeSources(anaClient)
    await anaTimesources.create('timesource-ana-01', '192.168.10.98')

    const genPort = await genClient.ports().get(genPortID)
    const anaPort = await anaClient.ports().get(anaPortID)

    // const cap1 = await Captures.createFromPort(genClient, genPort).create('capture-gen-01')
    // const cap2 = await Captures.createFromPort(anaClient, anaPort).create('capture-ana-01')
    // if (!cap1 || !cap2) return

    const gen = await genPort.generators().create('generator-01')
    if (!gen) return

    const ana = await anaPort.analysers().create('analyser-01')
    if (!ana) return

    // await cap1.start()
    // await cap2.start()
    await ana.start()
    await gen.start()

    await wait(1000)

    while (true) {
        const res = await Promise.all([gen.results(), ana.results()]);

        ['ethernet', 'ip'].forEach(key => {
            const data = [['counter'], ['generator'], ['analyser']]
            for (const k in res[0].protocol[key]) {
                data[0].push(k)
                data[1].push(res[0].protocol[key][k])
                data[2].push(res[1].protocol[key][k])
            }

            console.log(chalk.green(key + ' counters'))
            console.log(table(data))
        })

        const dict2table = x => {
            const d = [[], []]
            for (const k in x) {
                d[0].push(k)
                d[1].push(x[k])
            }
            return d
        }

        const nanosecdict2table = x => {
            const d = [[], []]
            for (const k in x) {
                d[0].push(k)
                d[1].push(Math.round(x[k] / 1000) + 'us')
            }
            return d
        }

        // console.log(chalk.green('interarrival'))
        // console.log(table(dict2table(res[1].flow.interarrival.summary)))

        console.log(chalk.green('sequence'))
        console.log(table(dict2table(res[1].flow.sequence)))

        console.log(chalk.green('latency'))
        console.log(table(nanosecdict2table(res[1].flow.latency.summary)))

        console.log(chalk.green('jitter_rfc'))
        console.log(table(nanosecdict2table(res[1].flow.jitter_rfc.summary)))

        // console.log(await cap1.results())
        // console.log(await cap2.results())
        await wait(500)

        // return
    }
}

if (process.argv.length === 3) {
    run(process.argv[2], 'port0', process.argv[2], 'port1')
} else if (process.argv.length === 4) {
    run(process.argv[2], 'port0', process.argv[3], 'port0')
} else {
    console.log('please speficy the OpenPerf RestAPI endpoint (eg node src/single-flow.js 10.109.4.112)')
}
