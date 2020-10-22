

# Topology

	Host0: 10.65.116.54
	Host1: 10.65.116.38

	NTP0: 192.168.10.97
	NTP1: 192.168.10.98

# Pre-setup

Load the kernel module for `vfio-pci`

```
sudo modprobe vfio-pci
```

Huge pages:

```
sudo mount -t hugetlbfs hugetlbfs /dev/hugepages
```


# DPDK Host 0

```
sudo /home/spirent/openperf/openperf/deps/dpdk/usertools/dpdk-devbind.py -s
```

	Network devices using kernel driver
	===================================
	0000:02:00.0 'I350 Gigabit Network Connection 1521' if=enp2s0f0 drv=igb unused= *Active*
	0000:02:00.1 'I350 Gigabit Network Connection 1521' if=enp2s0f1 drv=igb unused=
	0000:02:00.2 'I350 Gigabit Network Connection 1521' if=enp2s0f2 drv=igb unused=
	0000:02:00.3 'I350 Gigabit Network Connection 1521' if=enp2s0f3 drv=igb unused=
	0000:08:00.0 'Ethernet Connection X553 10 GbE SFP+ 15c4' if=enp8s0f0 drv=ixgbe unused=
	0000:08:00.1 'Ethernet Connection X553 10 GbE SFP+ 15c4' if=enp8s0f1 drv=ixgbe unused=
	0000:0a:00.0 'Ethernet Connection X553 1GbE 15e4' if=enp10s0f0 drv=ixgbe unused= *Active*
	0000:0a:00.1 'Ethernet Connection X553 1GbE 15e4' if=enp10s0f1 drv=ixgbe unused= *Active*

Need to bind `enp2s0f0`

```
sudo ip link set enp2s0f0 down
```

```
sudo /home/spirent/openperf/openperf/deps/dpdk/usertools/dpdk-devbind.py -b vfio-pci 0000:02:00.0
```


# DPDK Host 1

```
sudo /home/spirent/openperf/openperf/deps/dpdk/usertools/dpdk-devbind.py -s
```

	Network devices using kernel driver
	===================================
	0000:00:19.0 '82579LM Gigabit Network Connection 1502' if=eno1 drv=e1000e unused=vfio-pci *Active*
	0000:03:00.0 '82580 Gigabit Network Connection 150e' if=enp3s0f0 drv=igb unused=vfio-pci *Active*
	0000:03:00.1 '82580 Gigabit Network Connection 150e' if=enp3s0f1 drv=igb unused=vfio-pci
	0000:03:00.2 '82580 Gigabit Network Connection 150e' if=enp3s0f2 drv=igb unused=vfio-pci
	0000:03:00.3 '82580 Gigabit Network Connection 150e' if=enp3s0f3 drv=igb unused=vfio-pci

Need to bind `enp3s0f1`

```
sudo ip link set enp3s0f1 down
```

```
sudo modprobe vfio-pci
sudo /home/spirent/openperf/openperf/deps/dpdk/usertools/dpdk-devbind.py -b vfio-pci 0000:03:00.1
sudo /home/spirent/openperf/openperf/deps/dpdk/usertools/dpdk-devbind.py -s
```

Alternatively: 

```
sudo modprobe uio_pci_generic
sudo ip link set enp3s0f1 down
sudo /home/spirent/openperf/openperf/deps/dpdk/usertools/dpdk-devbind.py -u 0000:03:00.1
sudo /home/spirent/openperf/openperf/deps/dpdk/usertools/dpdk-devbind.py -b uio_pci_generic 0000:03:00.1
```

# Open Perf Host 0

```
vi /etc/openperf/config.yaml
core:
  log:
    level: debug

modules:
  api:
    port: 9000

  socket:
    force-unlink: true

  packetio:
    dpdk:
      options:
        - "-m512m"
        # - "--vdev=eth_af_packet0,iface=enp2s0f0,blocksz=4096,framesz=2048,framecnt=512,qpairs=1,qdisc_bypass=0"
      test-mode: false
      port-ids:
        port0: port0
```

```
sudo ~/op/openperf -c /etc/openperf/config.yaml
```

or 

```
echo "(while true; do sudo ~/op/openperf -c /etc/openperf/config.yaml; done)" > ~/op/run.sh
```

# Run

```
node src/single-flow.js 10.65.116.54 10.65.116.38
```