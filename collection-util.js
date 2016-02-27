var fs = require('fs')
var ipfsAPI;
if(typeof window!='undefined'){
  ipfsAPI= window.ipfsAPI;
}else{
  ipfsAPI= require('ipfs-api');
}

var ipfs = ipfsAPI({host: 'localhost', port: '5001', procotol: 'http'})


global.imports_running=0;
global.imports_max_paralell=2;

var _root_folder={Links:[],Data:"\u0008\u0001"};
function build_root(mhash,p){
  if(p===undefined)p=true;
  var pub=p;
  var rf=_root_folder;
  rf.Links.push({Name:".collections.json", Hash:mhash});
  _collections.forEach(function(c){
    rf.Links.push({Name:c.data.name, Hash:c.manage.collection_root_hash});
  });
  ipfs.object.put(new Buffer(JSON.stringify(rf)),'json',function(e,r){
      console.log("NEW ROOT: ", r.Hash);
      if(pub)ipfs.name.publish(r.Hash,function(e,r){console.log(r)})
  });
}
exports.update_app= function(hash){
  _root_folder.Links.push({Name:"app",Hash:hash})
}

exports.load_collections= function(id){
  var bff="";
  console.log("res :","/ipns/" + id + "/.collections.json")
  ipfs.cat("/ipns/" + id + "/.collections.json",function(e,r){
        console.log("res :",e)
    r.on('data',function(d){bff+=d})
     .on('end',function(){
        var clls=JSON.parse(bff);
        clls.forEach(function(c){
          var cl=exports.collection(c.name,c.title)
          cl.manage.load_collection(c.hash);

        })
        //console.log("parse :",JSON.parse(bff))
        //mng.collection.data=JSON.parse(bff);
        
      });
   })

}

var _collections=[];
exports.collections= function(){return _collections;}
exports.update_collections= function(){
  var colls=[];
  _collections.forEach(function(c){
    colls.push({name:c.data.name,hash:c.manage.collection_root_hash,title:c.data.title});

  })

  ipfs.add(new Buffer(JSON.stringify(colls)),function(e,r){
    console.log("Added COLLS meta file:",r[0].Hash);
    build_root(r[0].Hash);
  })


  console.log(colls);

}


// find or create collection
exports.collection= function(name, title){
  if(title===undefined)title=name;
  var coll=_collections.filter(function(x){return x.data.name==name})[0];
  if (coll==undefined){
    coll={
        data:{
          name: name,
          title: title,
          media:[],
          history:undefined
        },
        manage: new manage_factory()
    }
    coll.manage.collection=coll;
    _collections.push(coll);
  }
  return coll;
}


var manage_factory =function(){ return {

collection: undefined,
collection_root_hash: "initial",
collection_modified: false,
collection_links:[],


load_collection: function(coll_root_hash){
  this.collection_root_hash=coll_root_hash;
  var ipfsapi=true;
  if(ipfsapi){
    this.load_collection_ipfs(coll_root_hash);
  }else{
    this.load_collection_http(coll_root_hash);
  }
},

load_collection_ipfs: function(coll_root_hash){
  var mng = this.collection.manage;
  var bff="";
  ipfs.cat(coll_root_hash + "/.collection.json",function(e,r){
    r.on('data',function(d){bff+=d})
     .on('end',function(){
        //console.log("parse :",bff)
        mng.collection.data=JSON.parse(bff);
        console.log("Loaded media:",mng.collection.data.media.length);
      });
   })
},

load_collection_http: function(coll_root_hash){
  
},


// update collection folder + history
update_collection_root: function(lnk){
  var mng = this.collection.manage;
  if(this.collection_modified){
    this.collection_links.push(lnk);
    // all+collection.json
    if( this.collection_links.length == 2){
      var folder={Links:this.collection_links};
      var nfolder={Links:[],Data:"\u0008\u0001"};
      var prms=[];

      for(var i=0;i<folder.Links.length;i++){
        var mf=folder.Links[i];
        prms.push(ipfs.object.stat(mf.Hash));
      }

      Promise.all(prms).then(function(r){
          //var mng=mng
          for(var j=0;j<r.length;j++){
          var mf=folder.Links[j];
            nfolder.Links.push({
              Name: mf.Name,
              Hash: mf.Hash,
              Size:r[j].CumulativeSize
            });
          }
          ipfs.object.put(new Buffer(JSON.stringify(nfolder)),'json',function(e,r){
            var hash=r.Hash;
            //console.log("COLLECTION root folder:",hash);
            mng.collection_root_hash=hash;
            mng.collection_links=[];
            console.log("COLLECTION root folder:",mng.collection_root_hash);
          });

        });
    }
  }
},


update_collection_meta: function(){
  this.collection.data.history=this.collection_root_hash;
  var meta=new Buffer(JSON.stringify(this.collection.data));
  var mng = this.collection.manage;
  ipfs.add(meta,function(e,r){
    //console.log("created root meta:",r[0].Hash);

    mng.update_collection_root({Name:".collection.json",Hash:r[0].Hash});
  })

},

// Step 3 update (recreate) bttm to top
//update_by_show_folder
//update_by_date_folder
update_all_folder: function(mfolders){
  var mng = this.collection.manage;
  var folder={Links:[],Data:"\u0008\u0001"};
  var prms=[];

  for(var i=0;i<mfolders.length;i++){
    var mf=mfolders[i];
    prms.push(ipfs.object.stat(mf.folder_hash));
  }

  Promise.all(prms).then(function(r){
      for(var j=0;j<r.length;j++){
      var mf=mfolders[j];
        folder.Links.push({
          Name: mf.title,
          Hash: mf.folder_hash,
          Size:r[j].CumulativeSize
        });
      }
      ipfs.object.put(new Buffer(JSON.stringify(folder)),'json',function(e,r){
        var hash=r.Hash;
        mng.update_collection_root({Name:"all",Hash:hash});
        //console.log("all folder:",hash);
      });
    });
},

add_to_collection: function(title,mhash,fhash,date,cat){
  this.collection.data.media.push(
   {title: title, media_hash:mhash, folder_hash:fhash, date:date , category:cat}
  );
},

// Step 3 create folder for media+meta
create_media_folder: function(file_hash,fname,fext,meta_hash,mname,meta){
  console.log("Create media folder for:",fname);
  var nono=["/","#","?","|",":"];
  var pp=fname;
  for(var i=0;i<nono.length;i++){pp=pp.split(nono[i]).join(" ");}
  var title=pp;
  var mng = this.collection.manage;

  Promise.all([
      ipfs.object.stat(file_hash),
      ipfs.object.stat(meta_hash)
  ]).then(function(r){
    var folder={Links:[
          {Name:title + "." + fext,Hash:file_hash,Size:r[0].CumulativeSize},
          {Name:mname,Hash:meta_hash,Size:r[1].CumulativeSize}
      ],Data:"\u0008\u0001"};

    ipfs.object.put(new Buffer(JSON.stringify(folder)),'json',function(e,r){
      var hash=r.Hash;
      //console.log("media folder:",hash);
      mng.add_to_collection(title,file_hash,hash,meta.publish_date,"Misc");

    });
  
  });

},

// Step 2 transform yt json and add to IPFS
create_meta_data: function(file_hash,meta_obj){
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
  var mng = this.collection.manage;
  ipfs.add(meta_file,function(e,r){
    //console.log("Added meta file:",r[0].Hash);
    mng.create_media_folder(file_hash,m.title,m.file_type,r[0].Hash,".media.json",m);
  })


},


// Step 1 import mediafile to IPFS
import_media_file: function(stream, meta_obj){
  var mng = this.collection.manage;
  //var ipr = global.imports_running;
  ipfs.add(stream,function(e,r){
    if(!mng.collection_modified){
      mng.collection_modified=true;mng.collection_links=[];
    }
    var hash=r[0].Hash;
    //console.log("Added media file:",hash);
    global.imports_running--;
    mng.create_meta_data(hash,meta_obj);
  })

},

import_queue:[],

stage_media_folders_import: function(root,pattrn){
  var mng = this.collection.manage;
  //var ipr = global.imports_running;var ipl = global.max_paralell_imports;
  var queue=[];
  lst=fs.readdirSync(root).filter(function(f){return f.substr(0,pattrn.length)==pattrn})
  lst.forEach(function(x){
    var mp4=root+ "/" + x + "/" + fs.readdirSync("tmp/"+x).filter(function(f){return f.substr(f.length-4,4)==".mp4"})[0];
    var ytm=root+ "/" + x + "/YoutubeInfo.json"
    //console.log(mp4,ytm);
    mp4strm=fs.createReadStream(mp4);
    ytmobj=require("./" + ytm);
    queue.push({stream:mp4strm, meta:ytmobj})
  });
  this.import_queue=queue;
},

run_queue_item:function(){
      var itm=this.import_queue.pop();
      console.log("start", itm.meta.title);
      this.import_media_file(itm.stream,itm.meta);
},

run_import_queue: function(){
  var mng = this.collection.manage;
  function runq(){
    if(global.imports_running<global.imports_max_paralell){
      global.imports_running++;
      mng.run_queue_item();

    }
    if(mng.import_queue.length > 0){
      console.log("waiting..")
      setTimeout(runq,1500);
    }

  }
  runq();
}

}

}