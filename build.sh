#!/bin/bash
cd /home/m0se/DEV/wcn-ipfs 
cp index.html dist/app/
cp -r css dist/app/
cp -r fonts dist/app/
cp -r images dist/app/
cp ipfsapi.min.js dist/app/
node_modules/.bin/browserify page.js -d -o dist/app/bundle.js

ipfs add -r dist
