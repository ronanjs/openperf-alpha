/*
* @Author: ronanjs
* @Date:   2020-10-26 09:25:03
* @Last Modified by:   ronanjs
* @Last Modified time: 2020-10-27 10:20:22
*/

const chalk = require('chalk')
const { wait } = require('./core/utils')

const format = (name, x) =>
  chalk.blue(name) + '(µs):' +
            ((Math.round(x.min / 100) / 10).toString()).padEnd(6) +
            chalk.grey('->') +
            ((Math.round(x.max / 100) / 10).toString()).padEnd(6) +
            ' '

async function testOneWayLatency (genPromise, anaPromise) {
  const [gen, ana] = await Promise.all([genPromise, anaPromise])
  if (!ana || !gen) return

  await ana.start()
  if (!await gen.start()) {
    console.log('Sorry... failed to start the generator.. please try again')
    return
  }

  while (true) {
    const [genres, anares] = await Promise.all([
      gen.operator.results(),
      ana.operator.results()
    ])

    console.log(
      'generator:[', 'tx:', genres.protocol.ip.ipv4.toString().padEnd(4), ']',
      'analyser:[', 'rx:', anares.protocol.ip.ipv4.toString().padEnd(3), ']',
      format('latency', anares.flow.latency.summary),
      format('jitter', anares.flow.jitter_ipdv.summary)
    )

    ana.operator.reset()
    await wait(200)
  }
}

module.exports.testOneWayLatency = testOneWayLatency
