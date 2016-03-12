window = window || {};
window.ipfs_node={};
//window.Handlebars = require('handlebars');
var $ = require('jquery-browserify');

////window.ipfsAPI = require('ipfs-api');
window.director = require('director');
window.Buffer = require('Buffer');
window.md = require("node-markdown").Markdown;
window.collutil = require('./collection-util.js');
window.ipfswebtools = require('./ipfs-webtools.js');
window.webui = require('./webui.js');


$('document').ready(function() {
	window.ipfs_node={
		connection_data: {host: window.location.hostname, port: '5001', procotol: 'http'},
		web_gateway: window.location.protocol + "//" + window.location.host,
		api_access:false,
		id:"",
		swarm_address:[]
	}

	// only try to connect IPFS API on localhost
	if(window.location.hostname=="localhost" || window.location.hostname=="127.0.0.1"){
		window.ipfs = window.ipfsAPI(window.ipfs_node.connection_data);
		
		// check for ipfs api connectivity
		window.ipfs.id()
			.then(function(e){
				window.ipfs_node.api_access=true;
				window.ipfs_node.id=e.Id;
				window.ipfs_node.swarm_address=e.Addresses;
				console.log("IPFS API connected")
				$('#ipfs_logo').css({"opacity":"1"})}
			).catch(function(e){
				console.log("No IPFS API avalible: ",e.code)
				$('#ipfs_logo').css({"opacity":"0.3"});
			});
		
	}else{

		console.log("No IPFS API avalible: no conf for " + window.location.hostname);
		$('#ipfs_logo').css({"opacity":"0.3"});
	}
	var pathparts=window.location.pathname.split("/");
	window.collutil.load_collections(pathparts[1],pathparts[2]);

	Handlebars.registerHelper("formatDate", function(datetime) {
		return datetime.toLocaleDateString();
	});

	Handlebars.registerHelper("getMetaInfo", function(id) {
		
		return "id_xx: " + id;
	});

	var waitFroCollectionToLoad= setInterval(function () {
		if(window.collutil.collections().length>0){
			clearInterval(waitFroCollectionToLoad);
			setup_router();			
		}
	},100)




});

//var route_prefix = "app/"

var setup_router = function(){
      // define the routing table.
      window.webui.view.add_view(window.webui.view_home);
      window.webui.view.add_view(window.webui.view_video);
      window.webui.view.add_view(window.webui.view_video_info);
      window.webui.view.add_view(window.webui.view_nav);
      window.webui.view.show_view(window.webui.view_nav);

      var routes = {
      	'/': nav_home,
        '/collection/:id': nav_collection,
        '/collection/:id/:show': nav_collection_show,
        '/info/:id': nav_video_info
      };



      // instantiate the router.
      var router = window.director.Router(routes);

      router.init();
      if(window.location.href.indexOf("#")<0)window.location.assign("#/");

}

var nav_home = function(){
	window.webui.view.set_view("layout-home");

	$.ajax({url:'README.md'})
		.then(function(r){
			$('.readme_cont').html(md(r));

		})
}


var nav_collection_show = function(id,show){ 
	console.log("view show: ",show);
	window.webui.view_video.category_filter=show;
	window.webui.view_video.is_rendered=false;
	nav_collection(id,true);

}

var nav_collection = function(id,f){
	if(f===undefined && window.webui.view_video.category_filter!=""){
		window.webui.view_video.is_rendered=false;
		window.webui.view_video.category_filter="";
	}
	console.log("view coll: ",id)
	if(window.collutil.collections().length>0){
		if(window.collutil.collection(id).data.type=="video"){
			window.webui.view_video.coll_name=id;
			window.webui.view.set_view("layout-video");
		}
	}else{
		setTimeout(nav_collection,20);
	}
}

var nav_video_info = function(id){
	console.log("show info for",id);
	if(window.collutil.collections().length>0){
		if(window.webui.view_video_info.video_id!=id)window.webui.view_video_info.is_rendered=false;
		window.webui.view_video_info.video_id=id;
		window.webui.view.set_view("layout-video-info");
		collutil.load_media_meta(id).then(function(r){
		$('#desc').html(r.description);	
		})
	}else{
		setTimeout(nav_video_info,20);
	}
}