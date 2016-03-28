# World Crypro Network IPFS Archive Tool

This is a early PoC hack of a completely decentralized content archiving and display solution developed for [World Crypto Network](http://www.worldcryptonetwork.com) based on the [IPFS Project](https://github.com/ipfs/go-ipfs) written in Node.

Main focus for now is to have a efficient way of building and maintaining a browse and watchable archive of all video content produced by WCN contributers (other types of content like audio or git repos may follow later). A additionally early target is making it really easy for supporters to help host/pin selected parts or the entire archive.


## View Archive / IPFS deployments
The latest "stable" version will always be deployed to **/ipns/QmWCNyBxJS9iuwCrnnA3QfcrS9Yb67WXnZTiXZsMDFj2ja**

- with a local IPFS node running, go to http://localhost:8080/ipns/QmWCNyBxJS9iuwCrnnA3QfcrS9Yb67WXnZTiXZsMDFj2ja
- without local node you can go to https://ipfs.io/ipns/QmWCNyBxJS9iuwCrnnA3QfcrS9Yb67WXnZTiXZsMDFj2ja or https://ipfs.raincloud.ch/ipns/QmWCNyBxJS9iuwCrnnA3QfcrS9Yb67WXnZTiXZsMDFj2ja

This gives you a brows-able folder structure of the archive (as provided by the default IPFS daemon). For a graphic presentation open the top-level folder "/app" which will start the archive-browser app.


*Just for fun I try to not start over with the data-archive itself, as I built in a history reference that points to the last state and it would be nice to see the archives history going back to the early development stage.*

### Addidtional Addresses
For development and for loading the archive I use different IPNS addresse and publish them to the main address above whenever there has been usefull progress.

- **/ipns/QmY1XYR9PhF5XzveWiAqjPfNN5tEo1gd12zRYHuu5kMosE** Browser App Development
- **/ipns/QmS9mdKAihQaqGuLgzAESCSbFDCpoRVFqQinua6Ve7ARCH** Archive Loading
- Archive Node1 **/ipns/QmX3LsxW69VHea43xvfWHVXC5yviHhYSbRjg9acnz5aaN1** (150GB)
- Archive Node2 **/ipns/Qme3XmB651ZYCkFTYGh69pJkXGQJeWYDateeWnxfAFaaN2** (20GB)
- Archive Node3 **/ipns/QmVfwJUWnj7GAkQtV4cDVrNDnZEwi4oxnyZaJc7xY7zaN3** (empty)
- Archive Node4 **/ipns/QmS1HnL1cqXzzH53cpVavpjEEVLDEgeKBP5QLHN9nPxaN4** (empty)

### Current state of collection

The Archive works up to about 200 WCN videos for now (2014-01 - 2014-07), after that I start to face bad response times and other strage exceptions with a single IPFS node (starting at +150GB).

To mitigate that I started to split the collection over multible nodes, which basically works so far, but there are still issues with importing more videos.

So far the my conclusion is, that getting the media folder sitze of each item via ipfs.stat after a import run, seems to cause the issue. Therefore I now starting to remodel the code to keep the folder sizes in the metadata, so that not each media folder has to be touched while finalizing a import run. *Partialy implemented* 


## Current State of Development
Here a brief overview what "it" does so far:

- main library collection-util.js:
  - Adding Videos with meta and poster.jpg
  - dynamic building of IPFS folder structures (all, by show, by date)
  - generate and store JSON files with meta for gateway-mode
  - deploy the browser app to IPFS 
  - update meta data
  - recreate media folder (with size in meta or other meta changes) 
- CLI fronted (only usable with understnading of the code)
- Video-Collection Browser App
  - browser app detects and switches between [full-mode and gateway-mode](#full-mode-vs-gateway-mode)
- multi-collections structure in place (not practically tested yet)
- tested with current versions of FireFox/Iceweasel and Chrome (IE probably broken)

## Instructions

If you really want to screw around with the code base at this early stage, which I don't recommend as there are still many hard coded things and things that probably aren't self-explanatory at this point, here are the basic steps.

### Install
This should work on Linux and OS X with npm installed:

	git clone https://github.com/m0se/wcn-ipfs-archive
	cd wcn-ipfs-archive
	npm install

### Build & deploy browser app
So far the project doesn't use grunt or gulp or anything, just a simple bash script that copies a few files to the ./dist directory, executes browserify, issues a "ipfs add -r ./dist/app" and then calls the apps own CLI to add the app-folder to the existing archive folder structure.

*You may need to read and adopt the script*

	./build.sh

the CLI command used in the buld script:

	./collcli.js update -a <IPFS hash>

- **-a** the IPFS hash of the new app dir that shoud be added

### Import content
This is the most basic way to add videos (be aware of the conventions)

	./collcli.js import -p tmp/ -t 201403 -c wcnshows

- **-p** path to root folder, where video folders are located in (needs to be relative)
- **-t** "starts with" patterns of video folders to be processed
- **-c** collection this video should be added to



#### content conventions
The WNC videos are downloaded directly from Youtube with [youtube-dl](https://github.com/rg3/youtube-dl), which additionally fetches some meta data into a JSON File. 

	yid=<youtube-id>
	youtube-dl -i -f best -o '%(upload_date)s %(title)s/%(title)s-%(id)s.%(ext)s' --write-info-json --write-description https://www.youtube.com/watch?v=$yid > /dev/null 2> /dev/null

The "poster.jpg" (referenced in the meta) is downloaded as well and put in the videos folder (not done by youtube-dl).

### Connect to remote node
For connecting to a remote IPFS node the connection URL have to be set in the environment variable IPFS_API_URL:

	IPFS_API_URL="http://corenode5:5001" ./collcli.js get-collection -c wcnshows

Or to set it for the duration of the Terminal session:

	export IPFS_API_URL="http://corenode5:5001" 
	./collcli.js get-collection -c wcnshows

The remote IPFS node needs of course to accept your connection (more on that will be added later). 

### Docker
The proect comes now with a Dockerfile. The docker is for the app only and does not contain ipfs-go. At this stage the docker is mainly used for importing, but can also be used to play with the code without having to setup a Node/npm environment.

Build the Docker:

	git clone https://github.com/m0se/wcn-ipfs-archive
	cd wcn-ipfs-archive
	docker build -t ipfscollmanager .

Run the Docker:

	docker run -ti -v /pub/video_data:/home/colman/data -e IPFS_API_URL "http://ipfs-archive.rain.core:5001" ipfscollmanager


*For more on server side deployment check the "deployment" subfolder in this repo*


## full-mode vs. gateway-mode
There are basically two ways to view the archive:

1. *full-mode* You have a local installed IPFS node which connects the p2p network and you point your web browser to that nodes gateway-port. (like http://localhost:8080/<some ipfs address> )
2. *gateway-mode* Alternatively you can use a public gateway to access the archive (like https://ipfs.io/<some ipfs address> or https://ipfs.raincloud.ch/<some ipfs address>)

In the first case which is the more desirable fully decentralized way to use IPFS (therefore I call it full-mode), the browser app connects not only to the gateway port (default 8080) but as well to the IPFS nodes API port (default 5001). 
So actual data/content is pulled via the gateway, but meta information about available content, folder structures and so on is accessed directly via the IPFS API.

The gateway-mode only connects to the gateway/web server part and not to the IPFS API. This has the issue, that we can't browse IPFS folders or get other meta data from the gateway, since we can only issue GET requests to URLs of content we know exists.

To make the browser app work via. public gateways, meta/structure data gets published to IPFS in the form JSON files as well. This is done in the process of adding or updating content. 

So where the browser app in full-mode calls the IPFS API to navigate the collection, it will fetch the JSON files in gateway-mode to have the information about the collection/archive.

This distinction gets more relevant, as the developments progresses. The plan is to have all "read-only" features work in full and gateway-mode, but when we come to the "write" features like add or modify to the archive, this will only be possible in the full-mode (threw the API of your own local IPFS Node).  


## code quality & contribution
Since this is my first bigger Node project, don't expect the code quality to be shiny. I'm still in the progress of learning many of the common JS patterns (liking it more and more).
As this is pretty raw PoC it is probably no fun to contribute right now (to much things still changing all the time), nevertheless if you have any input, let me know.


## Future Plans & Ideas
Some of the next targets with this project are:

- host/pin management in the browser app
- Add, Change and Upload content via browser app (only for full-mode)
- clean multi-party publishing - depending on IPFS feature: "Publish an ipfs-path to another public key *(not implemented)*"
- de-brand, make the tool more generic and customizable for non-WCN archives (basically any Youtube channels could use this code base to bring there uploads to IPFS if the tool proves as use full)
