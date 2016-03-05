window = window || {};
window.ipfs_node={};
//window.Handlebars = require('handlebars');
var $ = require('jquery-browserify');

////window.ipfsAPI = require('ipfs-api');
window.director = require('director');
window.Buffer = require('Buffer');
window.collutil = require('./collection-util.js');
window.ipfswebtools = require('./ipfs-webtools.js');
window.webui = require('./webui.js');


$('document').ready(function() {
	window.ipfs_node={
		connection_data: {host: window.location.hostname, port: '5002', procotol: 'http'},
		web_gateway: window.location.protocol + "//" + window.location.host,
		api_access:false,
		id:"",
		swarm_address:[]
	}
	window.ipfs = window.ipfsAPI(window.ipfs_node.connection_data);
	//alert("hää?");
	window.xx="hello"

	// check for ipfs api
	window.ipfs.id()
		.then(function(e){
			window.ipfs_node.api_access=true;
			window.ipfs_node.id=e.Id;
			window.ipfs_node.swarm_address=e.Addresses;
			console.log("IPFS API connected")}
		).catch(function(e){
			console.log("No IPFS API avalible: ",e.code)
		});
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
      window.webui.view.add_view(window.webui.view_video);
      window.webui.view.add_view(window.webui.view_video_info);
      window.webui.view.add_view(window.webui.view_nav);
      window.webui.view.show_view(window.webui.view_nav);

      var routes = {
        '/collection/:id': nav_collection,
        '/info/:id': nav_video_info
      };



      // instantiate the router.
      var router = window.director.Router(routes);

      router.init();

}

var nav_collection = function(id){ 
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