/*
 * @Author: ronanjs
 * @Date:   2020-10-21 08:33:42
 * @Last Modified by:   ronanjs
 * @Last Modified time: 2020-10-30 12:36:21
 */

const { Command } = require('commander')

const { OpenPerfNode } = require('./opnode')
const { testOneWayLatency } = require('./latency')
const yaml = require('js-yaml')
const fs = require('fs')

const generatorConfig = yaml.safeLoad(fs.readFileSync('traffic-config.yaml', 'utf8'))

const program = new Command()
program
  .version(require('../package.json').version)
  .description('One-way latency OpenPerf agent')
  .command('<cmd> <generator-ip> [ip2]')
  .option('-d, --debug', 'output extra debugging')
  .option('-o, --output <logfile>', 'create a raw data output log')
  .action(function (genIP, anaIP, cmd) {
    const log = program.commands[0].output

    let res
    if (!anaIP) {
      const gen = OpenPerfNode.newGenerator(genIP, 'port0', { generator: generatorConfig, debug: cmd.debug })
      const ana = OpenPerfNode.newAnalyser(genIP, 'port1', { debug: cmd.debug })
      res = testOneWayLatency(gen, ana, log)
    } else {
      generatorConfig.timesource = '192.168.10.97'
      const gen = OpenPerfNode.newGenerator(genIP, 'port0', { generator: generatorConfig, debug: cmd.debug })
      const ana = OpenPerfNode.newAnalyser(anaIP, 'port0', { timesource: '192.168.10.98', debug: cmd.debug })
      res = testOneWayLatency(gen, ana, log)
    }

    res.then(x => process.exit(x))
  })
  .parse(process.argv)
