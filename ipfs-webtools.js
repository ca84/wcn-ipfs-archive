var ipfsAPI = window.ipfsAPI //||require('ipfs-api') 
var ipfs = window.ipfs||ipfsAPI({host: 'localhost', port: '5001', procotol: 'http'})
var stringify =  JSON.stringify; //window.stringify||require('json-stable-stringify');
//var $ = require('jquery-browserify');
//var $ = require('jquery');
/* build JSON index for a IPFS directory tree
	this can be used to brows from in-browser js
	in case the page is served over a IPFS gateway
	(aka. no local IPFS node/api)
*/
function index_for_hash(hash, root){
	var res=[]
	var cnt=0;
	var prom=[]

	var p = new Promise(
		function(resolve,reject){
			function build_index(h,root){
				return ipfs.object.get(h).then(function(r){
					cnt += 1;
					if(r.Links.length > 0){
						if(r.Data != '\b\u0001')r.Data=null;
						r.Links=r.Links.filter(function(i){return i.Name!=".index.json"});
						if(!root)r.Id = h;
						r.Root = root;
						res.push(r);
						for(i=0;i<r.Links.length;i++){
							console.log("push");
							prom.push(build_index(r.Links[i].Hash,false));
						}
					}
				})
			}

			prom.push(build_index(hash,root));

			function waitForData(){
				if(prom.length == cnt){
					resolve(res);
				}else{
					setTimeout(waitForData,20);
				}
			}
			waitForData();
		}

	)

	return p;

}

/* returns a promiss that provides the new root hash when fullfilled
	since we add the a newly created .index.json to the root-directory we are
	indexing, we will receive a new hash for the root element
	
*/

exports.update_collection_index= function(root_hash){
	var idx_hash;

	return index_for_hash(root_hash,true)
		.then(function(idx){
			console.log(stringify(idx));
			files=new Buffer(stringify(idx));
			console.log(files);
			return ipfs.add(files)
		})
		.then(function (e,r){
			idx_hash=e[0].Hash;
			return ipfs.object.get(root_hash)
		})
		.then(function(root_element){
			root_element.Links=root_element.Links.filter(function(i){return i.Name!=".index.json"});
			root_element.Links.push({"Name":".index.json", "Hash":idx_hash});
			return ipfs.object.put(new Buffer(stringify(root_element)),'json')
		})

}

exports.get_collection_tree = function(root_hash,base_url){

	var tree={
		root_hash: "",
		base_url: "",
		tree_data: [],

		load_data: function(){
			if(has_ipfs_api_access()){
				// we are getting our data from ipfs aip
			}else{
				// we use the pre-built .index.json
				function setData(d){
					this.tree_data=d;
				}
				$.ajax({
		  			url: this.base_url + this.root_hash + "/.index.json",
		  			dataType: "json",
		  			success: setData
				});


			}
		}


	}

	tree.root_hash = root_hash;
	tree.base_url = base_url || "http://localhost:8080/ipfs/";

	return tree;


}

function has_ipfs_api_access(){return false;}