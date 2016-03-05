#!/usr/bin/env node
var cli = require('cli');
collutil = require('./collection-util.js');
cli.enable('status');

options = cli.parse({
	id: 		[ 'i', 'IPFS Id', 'string', "QmY1XYR9PhF5XzveWiAqjPfNN5tEo1gd12zRYHuu5kMosE" ],
	schema: 	[ 's', 'IPFS Schema (ipfs|ipns)', 'string', "ipns" ],
	noload: 	[ 'n', 'dont load collections', 'false', true ],
	path: 		[ 'p', 'base path for imports', 'file'],
	pattern: 	[ 't', 'prefix pattern for selection', 'string', '20140722'],
	app: 		[ 'a', 'IPFS id of app folder', 'string' ],
	key: 		[ 'k', 'key', 'string' ],
	root: 		[ 'r', 'update root and id', 'false', true ]},
	['get-collection', 'get-mediameta', 'get-mediafile','do','import','update']);

cli.main(function(args, options) {

	this.info("Loading collection meta..");
if(options.noload){
	collutil.load_collections(options.schema,options.id)
	var i = 0, interval = setInterval(function () { 
    cli.progress(++i / 100);
    if(collutil.collections().length>0 && i<99)i=99;
    if (i === 100) {
        clearInterval(interval);
        cli.ok('Loaded collections: ' + JSON.stringify(collutil.collections().map(function(x){return {title:x.data.title, media_count:x.data.media.length}})));
        mmain();
    }
}, 250);
}

function mmain(){
	switch(cli.command) {
    case 'get-collection':
    	cli.debug('CMD: ' + cli.command);
    	cli.debug('COLL:' + JSON.stringify(collutil.collection(options.key).data,null,1));
    break;

    case 'get-mediameta':
    	cli.debug('CMD: ' + cli.command);
    	if(options.key){
    		collutil.load_media_meta(options.key)
    			.then(function(r){
    				cli.info("media meta: " + JSON.stringify(r));
    			});
    	}
    break;

    case 'get-mediafile':
    	cli.debug('CMD: ' + cli.command);
    	var med;
    	collutil.collections().forEach(function(c){
    		med=c.data.media.filter(function(f){return f.media_hash==options.key || f.folder_hash==options.key })[0];
    	})
    	cli.debug('MED:' + JSON.stringify(med,null,1));
    break;

    case 'update':
    	cli.debug('CMD: ' + cli.command);
    	if(options.app && collutil.collections().length>0){
    		cli.info('Updating /app folder with ' + options.app);
    		collutil.update_app(options.app);
    	}
    	//collutil.collection("wcnshows").data.description="All Youtube uploads of World Crypto Network, bla bla";
    	//collutil.collection("wcnshows").data.type="video";
    	//cli.debug(collutil.collection("wcnshows").data.description)
		var prm=collutil.update_collections();
		prm.then(function(x){cli.info("New root updated with " + x.Value + " and published")});
	


    break;

    case 'import':
    	this.debug('CMD: ' + cli.command);

    break;

    default:

	}
}


});


