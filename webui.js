window = window || {};
window.Handlebars = require('handlebars');
window.director = require('director');
//window.ipfswebtools = require('./ipfs-webtools.js');

exports.view= {
	views:[],
	add_view: function(v){
		this.views.push(v);
	},
	render_view: function(v){
		var tmpl=$("#" + v.template_id).html();
		v.template=Handlebars.compile(tmpl);
		var targ=$("#" + v.target_id);
		$("#" + v.container_id,targ).remove();
		targ.append(v.template(v.get_data()));
		v.container=$("#" + v.container_id,targ);
		v.is_rendered=true;
	},
	show_view: function(v){
		if(!v.is_rendered)this.render_view(v);
		v.container.show();

	},
	hide_view: function(v){
		if(v.container && v.target_id=="the_content")v.container.hide();

	},
	set_view: function(name){
		this.views.forEach(function(v){
			if(v.template_id==name){
				exports.view.show_view(v);
			}else{
				exports.view.hide_view(v);
			}
		})
	},
}

exports.view_video= {

	template_id: "layout-video",
	target_id: "the_content",
	container_id: "video_list_view",
	is_rendered: false,
	container: undefined,
	template: undefined,

	get_data: function(){
		prepare_vidlist=function(s){return {
			Date: new Date(s.Name.substr(0,4),s.Name.substr(4,2),s.Name.substr(6,2)),
				title:s.Name.substr(9),
				hash:s.Id,
				video_file:s.sub.find(function(i){return i.Name.endsWith(".md")}).Id,
				youtube_meta:s.sub.find(function(i){return i.Name.endsWith("YoutubeInfo.json")}).Id}
			};

		var vids=window.ipfswebtools.tree_root().sub.find(function(i){return i.Name=="video"})
		var data=[]
		
		vids.sub.forEach(function(x){data.push(prepare_vidlist(x))});

		return {video: data};
	}
}

exports.view_video_info= {

	template_id: "layout-video-info",
	target_id: "the_content",
	container_id: "video_info_view",
	is_rendered: false,
	container: undefined,
	template: undefined,

	get_data: function(){

		return {};
	}
}


exports.view_nav= {

	template_id: "nav-list-content",
	target_id: "the_nav",
	container_id: "nav_list_content",
	is_rendered: false,
	container: undefined,
	template: undefined,
	data: { collections: [{name:"Video",hash:"app/#video"},
						{name:"Audio",hash:"app/#audio"},
						{name:"Misc",hash:"xyxx"}]
	},

	get_data: function(){

		return this.data;
	}
}
/*
exports.view.add_view(exports.view_video);
exports.view.add_view(exports.view_video_info);
*/