#!/usr/bin/env node
var cli = require('cli');
collutil = require('./collection-util.js');


options = cli.parse({
	id: 		[ 'i', 'IPFS Id', 'string', "QmY1XYR9PhF5XzveWiAqjPfNN5tEo1gd12zRYHuu5kMosE" ],
	noload: 	[ 'n', 'dont load collections', 'false', true ],
	path: 		[ 'p', 'base path for imports', 'file'],
	pattern: 	[ 't', 'prefix pattern for selection', 'string', '20140722'],
	app: 		[ 'a', 'IPFS id of app folder', 'string' ],
	key: 		[ 'k', 'key', 'string' ],
	root: 		[ 'r', 'update root and id', 'false', true ]},
	['get-collection','get-mediafile','do','import','update']);

cli.main(function(args, options) {

	this.debug("Loading collection meta..");
if(options.noload){
	collutil.load_collections(options.id)
	var i = 0, interval = setInterval(function () { 
    cli.progress(++i / 100);
    if(collutil.collections().length>0)i=100;
    if (i === 100) {
        clearInterval(interval);
        cli.ok('Loaded!');
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
    		cli.debug('opt: ' + options.app);
    		collutil.update_app(options.app);
    		collutil.update_collections();

    	}


    break;

    case 'import':
    	this.debug('CMD: ' + cli.command);

    break;

    default:

	}
}


});


