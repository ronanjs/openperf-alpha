[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

[![CircleCI](https://circleci.com/gh/ronanjs/openperf-alpha.svg?style=svg)](https://circleci.com/gh/ronanjs/openperf-alpha)


# OpenPerf Alpha Samples


[OpenPerf](https://github.com/Spirent/openperf/) One way latency measurement scripts in NodeJS


To launch the one-way-latency test, you just need to use the command `node src/single-flow.js generator-ip-address analyser-ip-address` where `generator-ip-address` resp `analyser-ip-address` is the IP address of the open-perf client.

If everything works fine, you will be able to see a log similar to this one:

```
[analyser analyser-01] stopped
[analyser analyser-01] deleted
[generator generator-01] stopped
[generator generator-01] deleted
[analyser analyser-01] created
[generator generator-01] created
[analyser analyser-01] started
[generator generator-01] started
generator:[ tx: 10   analyser:[ rx: 10  latency(µs):1.4   ->2.6     jitter(µs):-1.1  ->0.2
generator:[ tx: 17   analyser:[ rx: 14  latency(µs):1.4   ->2.6     jitter(µs):-1.1  ->0.2
generator:[ tx: 26   analyser:[ rx: 9   latency(µs):1.4   ->1.5     jitter(µs):-0.1  ->0
generator:[ tx: 34   analyser:[ rx: 8   latency(µs):1.4   ->1.6     jitter(µs):-0.2  ->0.2
generator:[ tx: 42   analyser:[ rx: 8   latency(µs):1.4   ->2.2     jitter(µs):0     ->0.7
generator:[ tx: 49   analyser:[ rx: 8   latency(µs):1.4   ->1.8     jitter(µs):-0.3  ->0.2
generator:[ tx: 57   analyser:[ rx: 7   latency(µs):1.4   ->1.6     jitter(µs):-0.1  ->0.1
generator:[ tx: 66   analyser:[ rx: 9   latency(µs):1.4   ->1.6     jitter(µs):-0.1  ->0.2
generator:[ tx: 73   analyser:[ rx: 7   latency(µs):1.4   ->1.5     jitter(µs):-0.1  ->0.1
generator:[ tx: 81   analyser:[ rx: 8   latency(µs):1.4   ->1.5     jitter(µs):-0.1  ->0.1
generator:[ tx: 89   analyser:[ rx: 8   latency(µs):1.4   ->2.2     jitter(µs):-0.1  ->0.8
```