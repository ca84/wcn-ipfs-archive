# CoreOS / Docker deployment

This are the deployment descriptors which are used at raincloud.ch to host and import collection build by the project. These are only usefull for running IPFS nodes and the collection-util in Docker on a CoreOS cluster.

As the CoreOS project is open source and avalible for anyone, I decided to share this bits as well just in case someone wants to run ipfs nodes in a similar fashion.

If your interested in building your own CoreOS cluster, maybe check out my 3 part blog series that provides a basic explanation of the architecture: 

- [raincloud.ch explained part 1: CoreOS, etcd, fleet and docker](https://fluffypattern.ch/?p=783)
- [raincloud.ch explained part 2: Flannel, SkyDNS and RainProxy](https://fluffypattern.ch/?p=923)
- [raincloud.ch explained part 3: A look at a few of the clusterized apps](https://fluffypattern.ch/?p=1007)


## Docker container images

There are basically two container images involved runing this infrastructure:

 - Dockerfile - A basic IPFS node
 - ../Dockerfile - A container with the nodejs tools of this project 

*The Dockerfiles can probably be used in any docker-friendly environment, only the next sections need the CoreOS environment*

## CoreOS Fleet Service Unitfiles

The unitfiles provided need to be adopted to your environment as they contain configuration specific to my environment, but can probably still be usefull as templates/samples.

### Front-node

ma

