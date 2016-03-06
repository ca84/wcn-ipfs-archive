#!/usr/bin/env node
var cli = require('cli');
collutil = require('./collection-util.js');
cli.enable('status');
var loaded=false;

options = cli.parse({
	id: 		[ 'i', 'IPFS Id', 'string', "QmY1XYR9PhF5XzveWiAqjPfNN5tEo1gd12zRYHuu5kMosE" ],
	schema: 	[ 's', 'IPFS Schema (ipfs|ipns)', 'string', "ipns" ],
	noload: 	[ 'n', 'dont load collections', 'false', true ],
	path: 		[ 'p', 'base path for imports', 'file'],
	pattern: 	[ 't', 'prefix pattern for selection', 'string', '20140722'],
	app: 		[ 'a', 'IPFS id of app folder', 'string' ],
	collection: [ 'c', 'collection name', 'string' ],
	category: 	[ '', 'category JSON-file', 'file' ],
	key: 		[ 'k', 'key', 'string' ],
	root: 		[ 'r', 'update root and id', 'false', true ]},
	['get-collection', 'get-mediameta', 'get-mediafile','do','import','update']);

cli.main(function(args, options) {

	
if(options.noload){
	this.info("Loading collection meta..");
	collutil.load_collections(options.schema,options.id)
	var i = 0, interval = setInterval(function () { 
    cli.progress(++i / 100);
    if(collutil.collections().length>0 && i<99)i=99;
    if (i === 100) {
        clearInterval(interval);
        loaded=true;
        cli.ok('Loaded collections: ' + JSON.stringify(collutil.collections().map(function(x){return {title:x.data.title, media_count:x.data.media.length}})));
        mmain();
    }
}, 250);
}else{
	loaded=true;
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
    	if(options.app && loaded){
    		cli.info('Updating /app folder with ' + options.app);
    		collutil.update_app(options.app);
    		update_root();
    	}

    	if(options.category && options.collection && loaded){
			cli.info('Updating category meta for' + options.collection + ' with ' + options.category);
    		cat=require(options.category);
    		var crh=collutil.collection(options.collection).manage.collection_root_hash + "";
    		collutil.update_collection_categories(options.collection, cat);


			var i = 0, interval = setInterval(function () { 
			    cli.progress(++i / 100);
			    if( crh!=collutil.collection(options.collection).manage.collection_root_hash && i<99)i=99;
			    if (i === 100) {
			        clearInterval(interval);
			        cli.ok('Collection root updated: ' + collutil.collection(options.collection).manage.collection_root_hash);
			        update_root();
			    }
			}, 150);



    	}
    	//collutil.collection("wcnshows").data.description="All Youtube uploads of World Crypto Network, bla bla";
    	//collutil.collection("wcnshows").data.type="video";
    	//cli.debug(collutil.collection("wcnshows").data.description)
    	function update_root(){
    	cli.info("Updating & publish ROOT ( " + options.id + " )");
		var prm=collutil.update_collections();
		prm.then(function(x){cli.ok("ROOT updated with " + x.Value + " and published")})
			.catch(function(e){cli.error("FAILED TO UPDATE:" + e)});
		}


    break;

    case 'import':
    	cli.debug('CMD: ' + cli.command);
    	if(options.path && options.pattern && options.collection && loaded){
    		cli.info("Adding media from " + options.path + options.pattern + "* to " + options.collection);
    		coll=collutil.collection(options.collection); 
    		if(coll.manage.stage_media_folders_import(options.path, options.pattern.toString())){
	    		cli.info("Queue: " + coll.manage.import_queue);
	    		var p=coll.manage.run_import_queue();
	    		cli.debug("runQ prms:",p);
	    		p.then(function(r){
			        cli.ok('Import done ');
    				//coll.manage.update_all_folder(coll.data.media)
    				coll.manage.collection_modified=true;
    				coll.manage.update_collection()
    					.then(function(x){
    						cli.info("Collection Updated: " + x.Name + " ( " + x.Hash + " )")
    						update_root();

    					})
						.catch(function(e){cli.error("FAILED TO UPDATE:" + e)});
			    
			       	})
					.catch(function(e){cli.error("FAILED TO UPDATE:" + e)});

	    	}else{
	    		cli.error("Queue is empty ");
	    	}

    	}else{
    		cli.error("pease use parameters: path, pattern, collection");

    	}
    	function update_root(){
	    	cli.info("Updating & publish ROOT (" + options.id + ")");
			var prm=collutil.update_collections();
			prm.then(function(x){cli.ok("ROOT updated with " + x.Value + " and published")})
			.catch(function(e){cli.error("FAILED TO UPDATE:" + e)});
		}

    break;

    default:

    	cli.error("Noooo");

	}
}


});


