/*
* @Author: ronanjs
* @Date:   2020-10-26 09:25:03
* @Last Modified by:   ronanjs
* @Last Modified time: 2020-11-02 08:39:31
*/

const chalk = require('chalk')
const { wait } = require('./core/utils')
const fs = require('fs')

const format = (name, x) =>
  chalk.blue(name) + '(µs):' +
            ((Math.round(x.min / 100) / 10).toString()).padEnd(6) +
            chalk.grey('->') +
            ((Math.round(x.max / 100) / 10).toString()).padEnd(6) +
            ' '

async function testOneWayLatency (genPromise, anaPromise, logfile) {
  const [gen, ana] = await Promise.all([genPromise, anaPromise]).catch(e => [])
  if (!ana || !gen) {
    console.log(chalk.blue('failed to create the generator or analyser... aborting'))
    return -1
  }

  await ana.start()
  if (!await gen.start()) {
    console.log('Sorry... failed to start the generator.. please try again')
    return -1
  }

  try {
    if (logfile) {
      fs.unlinkSync(logfile)
    }
  } catch (e) {}

  while (true) {
    const [genres, anares, gents, anats] = await Promise.all([
      gen.operator.results(),
      ana.operator.results(),
      gen.timesource && gen.timesource.keeper(),
      ana.timesource && ana.timesource.keeper()
    ])

    if (genres) {
      console.log(
        'generator:[', 'tx:', (genres ? genres.protocol.ip.ipv4.toString() : '-').padEnd(4), ']',
        'analyser:[', 'rx:', (anares ? anares.protocol.ip.ipv4.toString() : '-').padEnd(3), ']',
        format('latency', (anares ? anares.flow.latency.summary : {})),
        format('jitter', (anares ? anares.flow.jitter_ipdv.summary : {}))
      )
    }

    if (logfile) {
      const cols = {
        time: Date.now(),
        tx: genres.protocol.ip.ipv4,
        rx: anares.protocol.ip.ipv4,
        latency: anares.flow.latency,
        jitter: anares.flow.jitter_ipdv.summary,
        timesource: { gen: gents, ana: anats }
      }
      fs.appendFile(logfile, JSON.stringify(cols) + '\n', () => {})
    }

    ana.operator.reset()
    await wait(200)
  }
}

module.exports.testOneWayLatency = testOneWayLatency
