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
	coll_name: "",
	is_rendered: false,
	container: undefined,
	template: undefined,
	list_title: "Recently Added",
	category_filter: "",
	date_filter: "",

	get_data: function(){
		prepare_vidlist=function(s){return {
			date: new Date(s.date),
				title:s.title,
				hash:s.folder_hash,
				video_file:s.media_hash,
				meta_file:s.folder_hash+"/.media.json"}
			};

		var title=window.collutil.collection(this.coll_name).data.title;
		var desc=window.collutil.collection(this.coll_name).data.description

		var vids=window.collutil.collection(this.coll_name).data.media
			.sort(function(a,b){return new Date(a.date).getTime()-new Date(b.date).getTime()})
			.reverse();

		// default recently added
		if(this.category_filter=="" && this.date_filter==""){
			this.list_title="Recently Added";
			vids=vids
				.filter(function(e,i){return i < 15});
		}else{
			if(this.category_filter!=""){
				var catfilter=this.category_filter
				this.list_title=window.collutil.collection(this.coll_name).data.categories.filter(function(e){return e.short==catfilter})[0].title;
				vids=vids
					.filter(function(e,i){return e.category == catfilter})
					console.log("cat filter:",catfilter)
				this.list_title=this.list_title  + " ( " + vids.length + " Episodes )";	//.filter(function(e,i){return i < 15});

			}

		}

		//window.ipfswebtools.tree_root().sub.filter(function(i){return i.Name=="video"})[0]
		var data=[]
		
		vids.forEach(function(x){data.push(prepare_vidlist(x))});

		return {video: data,
				title: title,
				description: desc,
				categories:window.collutil.collection(this.coll_name).data.categories,
				list_title:this.list_title };
	}
}

exports.view_video_info= {
	video_id: undefined,
	template_id: "layout-video-info",
	target_id: "the_content",
	container_id: "video_info_view",
	is_rendered: false,
	container: undefined,
	template: undefined,

	get_data: function(){
		if(this.video_id){
			var vid=window.collutil.collection("wcnshows").data.media.filter(function(i){return i.folder_hash==window.webui.view_video_info.video_id})[0];
			return {id:this.video_id,
				video_file:vid.media_hash,
				date: new Date(vid.date),
				title:vid.title

			};
		}else{
			return {title:"empty"}
		}
	}
}


exports.view_nav= {

	template_id: "nav-list-content",
	target_id: "the_nav",
	container_id: "nav_list_content",
	is_rendered: false,
	container: undefined,
	template: undefined,
	data: { collections: []
	},

	get_data: function(){
		this.data.collections = window.collutil.collections().map(function(x){return {name: x.data.title, link:"../app/#/collection/" + x.data.name}});
		return this.data;
	}
}