window = window || {};
window.Handlebars = require('handlebars');
//window.ipfsAPI = require('ipfs-api');
window.director = require('director');
window.Buffer = require('Buffer');
window.collutil = require('./collection-util.js');
window.ipfswebtools = require('./ipfs-webtools.js');
window.webui = require('./webui.js');

var $ = require('jquery-browserify');

$('document').ready(function() {

	window.ipfs_root_hash=window.location.pathname.split("/")[2];

	window.ipfswebtools.init(window.ipfs_root_hash,window.location.pathname.split("/")[1]);

	window.collutil.collection("newone");
	window.collutil.collections()[0].manage.load_collection("QmUk6rMcWsRh3rihoMNZREJvJMXWko5kg8AtiA9hpuhzPm");

	Handlebars.registerHelper("formatDate", function(datetime) {
		return datetime.toLocaleDateString();
	});

	setup_router();

});

var route_prefix = "app/"

var setup_router = function(){
      // define the routing table.
      window.webui.view.add_view(window.webui.view_video);
      window.webui.view.add_view(window.webui.view_video_info);
      window.webui.view.add_view(window.webui.view_nav);
      window.webui.view.show_view(window.webui.view_nav);

      var routes = {
        '/video': nav_video,
        '/info/:id': nav_video_info,
        '/audio': nav_video
      };



      // instantiate the router.
      var router = window.director.Router(routes);

      router.init();

}

var nav_video = function(){ 
	if(window.ipfswebtools.isReady()){
		window.webui.view.set_view("layout-video");
	}else{
		setTimeout(nav_video,20);
	}
}

var nav_video_info = function(id){
	console.log("show info for",id);
	if(window.ipfswebtools.isReady()){
		if(window.webui.view_video_info.video_id!=id)window.webui.view_video_info.is_rendered=false;
		window.webui.view_video_info.video_id=id;
		window.webui.view.set_view("layout-video-info");
	}else{
		setTimeout(nav_video_info,20);
	}
}









/*
var nav_root = function(){ 
	source   = $("#layout-home").html();
  	template = window.Handlebars.compile(source);
	$("#the_content").html(template({video: ui_list}));

											[{title:"Der Blsdvf daf rvr"},
											{title:"Wslsd evf Refe refver"},
											{title:"Wslsd evf Refe refver"},
											{title:"Wslsd evf Refe refver"},
											{title:"Wslsd evf Refe refver"},
											{title:"Wslsd evf Refe refver"},
											{title:"Wslsd evf Refe refver"},
											{title:"Wslsd evf Refe refver"},
											{title:"Wslsd evf Refe refver"},
											{title:"Wslsd evf Refe refver"},
											{title:"fer Hlsd vf dafeffe"}]}));

};
var rtWest = function () { 	$("#the_content").html("lala")};
var rtTest = function () { console.log("Teeeeest"); };

window.ui_nav = {

	data: { collections: [{name:"Video",hash:route_prefix + "#video"},{name:"Audio",hash:route_prefix + "#audio"},{name:"Misc",hash:"xyxx"}]
	},

	update_nav: function(){
			source   = $("#nav-list-content").html();
  			template = window.Handlebars.compile(source);
			$(".nav_list").html(template(this.data));
	},

	load_local_nodelist: function(){

		this.data.nodes=JSON.parse(
			localStorage.ipfs_nodes || '[{"name":"localhost","connection":{"host":"localhost","port":"5001","procotol":"http"},"id":"QmXXX"}]');
	}

} 

*/