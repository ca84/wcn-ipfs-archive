var fs = require('fs')
var ipfsAPI = require('ipfs-api');//window.ipfsAPI ||require('ipfs-api'); 
var ipfs = ipfsAPI({host: 'localhost', port: '5001', procotol: 'http'})

var _collections=[];
exports.collections= function(){return _collections;}
exports.collection= function(name){return _collections.filter(function(x){return x.name==name})[0]}



//var  manage = {

// Step 5 +history
update_root_folder = function(stream){}


// update collection folder + history
update_collection_folder  = function(name,hash){}

// Step 3 update (recreate) bttm to top
//update_by_show_folder
//update_by_date_folder
update_all_folder = function(name,hash){
  var rhash="QmdwMGYzUimAhCTQxKmcGnjh9TLS5cRKGUZjzFPbJzYsPp";
  ipfs.object.get("QmdwMGYzUimAhCTQxKmcGnjh9TLS5cRKGUZjzFPbJzYsPp",function(e,r){
    var folder=r;
    ipfs.object.stat(hash,function(e,r){
      folder.Links.push({Name:name,Hash:hash,Size:r.CumulativeSize});
      ipfs.object.put(new Buffer(JSON.stringify(folder)),'json',function(e,r){
        var hash=r.Hash;
        console.log("all folder:",hash);
      });
    });

  })


}

// Step 3 create folder for media+meta
create_media_folder  = function(file_hash,fname,fext,meta_hash,mname){
  console.log("Create media folder for:",fname,mname);

  Promise.all([
      ipfs.object.stat(file_hash),
      ipfs.object.stat(meta_hash)
  ]).then(function(r){
    var folder={Links:[
          {Name:fname + "." + fext,Hash:file_hash,Size:r[0].CumulativeSize},
          {Name:mname,Hash:meta_hash,Size:r[1].CumulativeSize}
      ],Data:"\u0008\u0001"};

    ipfs.object.put(new Buffer(JSON.stringify(folder)),'json',function(e,r){
      var hash=r.Hash;
      console.log("media folder:",hash);
      update_all_folder(fname,hash);

    });
  
  });

}

// Step 2 transform yt json and add to IPFS
create_meta_data  = function(file_hash,meta_obj){
  var m={};
  m.publish_date        = new Date(meta_obj.upload_date.substr(0,4),parseInt(meta_obj.upload_date.substr(4,2))+1,meta_obj.upload_date.substr(6,2));
  m.title               = meta_obj.fulltitle;
  m.media_type           = "video";
  m.file_type           = meta_obj.ext;
  m.description         = meta_obj.description;
  m.resolution          = {height:meta_obj.height, width:meta_obj.width};
  m.youtube_uploader    = meta_obj.uploader;
  m.youtube_id          = meta_obj.id;
  
  var meta_file=new Buffer(JSON.stringify(m));
  ipfs.add(meta_file,function(e,r){
    console.log("Added meta file:",r[0].Hash);

    this.create_media_folder(file_hash,m.title,m.file_type,r[0].Hash,".media.json");
  })


}


// Step 1 import mediafile to IPFS
exports.import_media_file = function(stream, meta_obj){
  //ipfs.add(stream,function(e,r){

    var hash="QmVHSzMfNAeQC37Z97P2VaCQDnFxiosSde1nmamoLWo4AY"
    //var hash=r[0].Hash;
    console.log("Added media file:",hash);
    create_meta_data(hash,meta_obj);

  //})

}




/*

exports.manage = {

  new_collection=function(name,description){
    col={ 
        name:name, 
        description:description,
        content:[]
      }
    _collections.push(col);
    return col;
  },
  
  new_entry=function(media_hash, meta_hash, folder_hash){
    cont={
      id:media_hash.substr(34),
      media_file_ipfs:media_hash,
      meta_file_ipfs:meta_hash,
      media_folder_hash:folder_hash
    }
    return cont;

  },

  add_entry = function(entry,collection){
    var existing=collection.filter(function(x){return x.id==entry.id})
    if(existing.length < 1){
      collection.content.push(entry);
    }else{
      collection[collection.indexOf(existing)]=entry;
    }

  },

  upload_media_file = function(stream){
    return ipfs.add(stream,function(e,r);
  },

  upload_meta_file = function(cont_string){
    files=new Buffer(JSON.stringify(cont_string));
    return ipfs.add(file);
  },

  create_media_folders = function(ipfs_folder){},

  update_collection_meta = function(){},

  update_root_folder = function(){}





}

function transform_youtube_meta(y){
  m={}
  m.publish_date        = new Date(y.upload_date.substr(0,4),parseInt(y.upload_date.substr(4,2))+1,y.upload_date.substr(6,2));
  m.title               = y.fulltitle;
  m.media_type           = "video";
  m.file_type           = y.ext;
  m.description         = y.description;
  m.resolution          = {height:y.height, width:y.width};
  m.youtube_uploader    = y.uploader;
  m.youtube_id          = y.id;
  return m;
}



var _collection_manager= {


}





function ipfs_add_local_file(path){
ipfs.add(rr,function(e,r){console.log(r[0].Hash)})

}*/