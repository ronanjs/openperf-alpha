/*
 * @Author: ronanjs
 * @Date:   2020-10-21 08:33:42
 * @Last Modified by:   ronanjs
 * @Last Modified time: 2020-10-27 10:28:10
 */

const { OpenPerfNode } = require('./opnode')
const { testOneWayLatency } = require('./latency')
const yaml = require('js-yaml')
const fs = require('fs')

const generatorConfig = yaml.safeLoad(fs.readFileSync('traffic-config.yaml', 'utf8'))

if (process.argv.length === 3) {
  const gen = OpenPerfNode.newGenerator(process.argv[2], 'port0', generatorConfig)
  const ana = OpenPerfNode.newAnalyser(process.argv[2], 'port1')
  testOneWayLatency(gen, ana)
} else if (process.argv.length === 4) {
  generatorConfig.timesource = '192.168.10.97'
  const gen = OpenPerfNode.newGenerator(process.argv[2], 'port0', generatorConfig)
  const ana = OpenPerfNode.newAnalyser(process.argv[3], 'port0', { timesource: '192.168.10.98' })
  testOneWayLatency(gen, ana)
} else {
  console.log('please speficy the OpenPerf RestAPI endpoint (eg node src/single-flow.js 10.109.4.112)')
}
