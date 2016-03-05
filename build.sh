#!/bin/bash
cd /home/m0se/DEV/wcn-ipfs 
cp index.html dist/app/
cp -r css dist/app/
cp -r fonts dist/app/
cp -r images dist/app/
cp ipfsapi.min.js dist/app/
#node_modules/.bin/browserify page.js --exclude ipfs-api -d -o dist/app/bundle.js
node_modules/.bin/browserify page.js -d -o dist/app/bundle.js
hsh=`ipfs add -r dist/app|tail -1|awk '{print $2}'`
echo $hsh
./collcli.js update -a $hsh 

ipfs name resolve -n QmY1XYR9PhF5XzveWiAqjPfNN5tEo1gd12zRYHuu5kMosE
#ipfs add -r dist |grep  -v "dist/app/"
