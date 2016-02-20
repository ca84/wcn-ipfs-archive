window = window || {};
window.Handlebars = require('handlebars');
//window.ipfsAPI = require('ipfs-api');
window.director = require('director');
window.Buffer = require('Buffer');
window.ipfswebtools = require('./ipfs-webtools.js');

var $ = require('jquery-browserify');

$('document').ready(function() {

	console.log("heeello??");
	window.ui_nav.load_local_nodelist();	
	window.ui_nav.update_nav();
	window.ipfs_root_hash=window.location.pathname.split("/")[2];

	window.ipfswebtools.init(window.ipfs_root_hash);

	Handlebars.registerHelper("formatDate", function(datetime) {
		return datetime.toLocaleDateString();
	});

	//window.ui_filelist.load_filelist("QmYcifPU8ihwsZswURVSGnKncs6p2Tj2sJuVuehroC5Jex");
	//window.ui_filelist.load_filelist("QmYcifPU8ihwsZswURVSGnKncs6p2Tj2sJuVuehroC5Jex");
	setup_router();

});

var route_prefix = "app/"

var setup_router = function(){
      // define the routing table.
      var routes = {
        '/home': nav_root,
        '/video': nav_video,
        '/west': rtWest,
        '/ctest': rtWest
      };



      // instantiate the router.
      var router = window.director.Router(routes);

      router.init();

}

var nav_video = function(){ 
	prepare_vidlist=function(s){return {
		Date: new Date(s.Name.substr(0,4),s.Name.substr(4,2),s.Name.substr(6,2)),
		title:s.Name.substr(9),
		hash:s.Id,
		video_file:s.sub.find(function(i){return i.Name.endsWith(".md")}).Id,
		youtube_meta:s.sub.find(function(i){return i.Name.endsWith("YoutubeInfo.json")}).Id}
	};
	if(window.ipfswebtools.isReady()){
		var vids=ipfswebtools.tree_root().sub.find(function(i){return i.Name=="video"})
		var ui_list=[]
		vids.sub.forEach(function(x){ui_list.push(prepare_vidlist(x))});

		source   = $("#layout-video").html();
	  	template = window.Handlebars.compile(source);
		$("#the_content").html(template({video: ui_list}));
	}else{
		setTimeout(nav_video,20);
	}
											/*[{title:"Der Blsdvf daf rvr"},
											{title:"Wslsd evf Refe refver"},
											{title:"Wslsd evf Refe refver"},
											{title:"Wslsd evf Refe refver"},
											{title:"fer Hlsd vf dafeffe"}]}))*/
}
var nav_root = function(){ 
	source   = $("#layout-home").html();
  	template = window.Handlebars.compile(source);
	$("#the_content").html(template({video: ui_list}));

											/*[{title:"Der Blsdvf daf rvr"},
											{title:"Wslsd evf Refe refver"},
											{title:"Wslsd evf Refe refver"},
											{title:"Wslsd evf Refe refver"},
											{title:"Wslsd evf Refe refver"},
											{title:"Wslsd evf Refe refver"},
											{title:"Wslsd evf Refe refver"},
											{title:"Wslsd evf Refe refver"},
											{title:"Wslsd evf Refe refver"},
											{title:"Wslsd evf Refe refver"},
											{title:"fer Hlsd vf dafeffe"}]}));*/

};
var rtWest = function () { 	$("#the_content").html("lala")};
var rtTest = function () { console.log("Teeeeest"); };

window.ui_nav = {

	data: { collections: [{name:"Video",hash:route_prefix + "#video"},{name:"Audio",hash:route_prefix + "#ctest"},{name:"Misc",hash:"xyxx"}]
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

/*
window.ui_filelist = {

	objlist: [],

	rootHash: "QmYcifPU8ihwsZswURVSGnKncs6p2Tj2sJuVuehroC5Jex",

	load_filelist: function (h){
		function setResult(r){
			window.ui_filelist.objlist=r;
			window.ui_filelist.update_list();
		}
		yy=$.ajax({
  			url: "http://localhost:8080/ipfs/" + h + "/.index.json",
  			dataType: "json",
  			success: setResult
		});
	},

	update_list: function(){
			source   = $("#file-list-content").html();
  			template = window.Handlebars.compile(source);
			$("#file_list").html(template(this));
	}

}

*/


