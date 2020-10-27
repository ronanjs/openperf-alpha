/*
 * @Author: ronanjs
 * @Date:   2020-10-21 08:33:42
 * @Last Modified by:   ronanjs
 * @Last Modified time: 2020-10-27 10:10:56
 */

const { OpenPerfClient } = require('./core/opclient')

class OpenPerfNode {
  constructor (serverIP) {
    this.client = new OpenPerfClient(serverIP)
  }

  static newGenerator (serverIP, portID, opts = {}) {
    return new OpenPerfNode(serverIP).init('generator', portID, opts)
  }

  static newAnalyser (serverIP, portID, opts = {}) {
    return new OpenPerfNode(serverIP).init('analyser', portID, opts)
  }

  async init (mode, portID, opts) {
    if (!await this.client.check()) {
      return null
    }

    if (opts.timesource) {
      const timesources = this.client.timesources()
      this.timesource = await timesources.create('timesource-001', opts.timesource)
    }

    const port = await this.client.ports().get(portID)
    if (!port) {
      return null
    }

    const operators = port[mode + 's']()
    const operator = await operators.create(opts.id || (mode + '-001'), opts)
    if (!operator) {
      return null
    }

    this.operator = operator

    return this
  }

  start () {
    return this.operator.start()
  }
}

module.exports.OpenPerfNode = OpenPerfNode