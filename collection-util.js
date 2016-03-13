var fs = require('fs')
var ipfsAPI;
var ipfs_node;
if(typeof window!='undefined'){
  ipfsAPI= window.ipfsAPI;
  ipfs_node=window.ipfs_node;
}else{
  console.log("Connecting remote node: ", process.env.IPFS_API_URL);
  ipfsAPI= require('ipfs-api');
  ipfs_node= {
    connection_data: {host: 'localhost', port: '5001', procotol: 'http'},
    api_access:true,
    id:"",
    swarm_address:[]
  }
  if(process.env.IPFS_API_URL!==undefined){
    ipfs_node.connection_data.procotol=process.env.IPFS_API_URL.split(":")[0];
    ipfs_node.connection_data.host=process.env.IPFS_API_URL.split(":")[1].split("//")[1];
    ipfs_node.connection_data.port=process.env.IPFS_API_URL.split(":")[2];
  }

}

//var $ = require('jquery-browserify');

var ipfs = ipfsAPI(ipfs_node.connection_data);


global.imports_running=0;
global.imports_max_paralell=2;

var _root_folder={Links:[],Data:"\u0008\u0001"};
var _app_folder_hash="";
function build_root(mhash,p){
  if(p===undefined)p=true;
  var pub=p;
  var rf=_root_folder;
  rf.Links.push({Name:".collections.json", Hash:mhash});
  rf.Links.push({Name:"app",Hash:_app_folder_hash})

  _collections.forEach(function(c){
    rf.Links.push({Name:c.data.name, Hash:c.manage.collection_root_hash});
  });
  return ipfs.object.put(new Buffer(JSON.stringify(rf)),'json').chain(function(r){
      //console.log("NEW ROOT: ", r.Hash);
      if(pub)return ipfs.name.publish(r.Hash)
  }).catch(function(e){console.log("UPD RT ERR: ", e, rf)});
}

exports.update_app= function(hash){
  _app_folder_hash=hash;
}

exports.ipfs_node_id= function(){
  return ipfs.id()
}

exports.recently_added_media= function(limit){
  var lst=[];
  for(c in exports.collections()){
    var cnt=0;
    lst=lst.concat(exports.collections()[c].data.media
      .sort(function(a,b){return new Date(a.date).getTime()-new Date(b.date).getTime()})
      .reverse()
      .filter(function(x){cnt++;return cnt<=limit}));
  }
  cnt=0;
  return lst
    .sort(function(a,b){return new Date(a.date).getTime()-new Date(b.date).getTime()})
    .reverse()
    .filter(function(x){cnt++;return cnt<=limit}); 
}

exports.update_collection_categories= function(cname,data){
  var col=exports.collection(cname);
  col.data.categories=data;
  col.manage.collection_modified=true;
  return col.manage.update_collection()
  //col.manage.update_collection_root({Name:"all",Hash:"Qme1mcXwZSEjxiGn8GxsW8G9z4vNE2wXGv4YeroodfBDMC"});
  //col.manage.update_collection_meta();
}

var _coll_count=-1;
exports.isloaded= function(){
  var res=false;
  if(_coll_count > 0){
    res=true;
    for(c in _collections){
      if(!_collections[c].manage.isloaded())res=false;
    }  
  
  }

  if(_coll_count == 0){res=true;}

  return res;
}


exports.load_collections= function(sch,id){
  if(ipfs_node.api_access){
    var bff="";
    console.log("      /" + sch + "/" + id + "/.collections.json")
    ipfs.cat("/" + sch + "/" + id + "/.collections.json",function(e,r){
      //console.log("HEHE::: ",e,r);
      if(r!==undefined && r.Code!=0){
        r.on('data',function(d){bff+=d})
         .on('end',function(){
            var clls=JSON.parse(bff);
            _coll_count=clls.length;
            clls.forEach(function(c){
              var cl=exports.collection(c.name,c.title)
              cl.manage.load_collection(c.hash);
            })
          });
      }else{
        _coll_count=0;
        console.log("No Collection Meta found, starting from scratch..");

      }

     })
    ipfs.object.get("/" + sch + "/" + id).then(function(r){
      _app_folder_hash=r.Links.filter(function(x){return x.Name=="app"})[0].Hash;
      //console.log(r.Links.filter(function(x){return x.Name=="app"})[0].Hash);
    });
  }else{
    console.log("/" + sch + "/" + id + "/.collections.json")
    $.ajax({
      url: "/" + sch + "/" + id + "/.collections.json",
      dataType: "json"})
  .then(function(r){
    var clls=r;
          clls.forEach(function(c){
            var cl=exports.collection(c.name,c.title)
            cl.manage.load_collection(c.hash);
    })
  });

  }

}

var _collections=[];
exports.collections= function(){return _collections;}
exports.update_collections= function(){
  var colls=[];
  _collections.forEach(function(c){
    colls.push({name:c.data.name,
      hash:c.manage.collection_root_hash,
      title:c.data.title,
      type:c.data.type,
      description:c.data.description
    });

    //c.manage.
  })

  return ipfs.add(new Buffer(JSON.stringify(colls)))
    .chain(function(r){
      //console.log("colls.jsn:", r);
      return build_root(r[0].Hash);
    }).catch(function(e){console.log("UPD ERR: ", e)});
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
          description: "",
          type: "video",
          media:[],
          history:undefined,
          shows:[]
        },
        manage: new manage_factory()
    }
    coll.manage.collection=coll;
    _collections.push(coll);
  }
  //coll.data.type="video";
  //coll.data.description="All Youtube uploads of World Crypto Network, bla bla";
  return coll;
}


exports.load_media_meta= function(folder_id){
  return new Promise(function(resolve, reject) {
    if(ipfs_node.api_access){
      var bff="";
      console.log("      /ipfs/" + folder_id + "/.media.json")
      ipfs.cat("/ipfs/" + folder_id + "/.media.json",function(e,r){
            //console.log("res :",e)
        r.on('data',function(d){bff+=d})
         .on('end',function(){
            var mt=JSON.parse(bff);
            resolve(mt);
            
          });
       })
    }else{
      console.log("/ipfs/" + folder_id + "/.media.json")
      $.ajax({
        url: "/ipfs/" + folder_id + "/.media.json",
        dataType: "json"})
    .then(function(r){
      resolve(r);
      })
    }
  });

  };




var manage_factory =function(){ return {

collection: undefined,
collection_root_hash: "initial",
collection_modified: false,
collection_links:[],
collection_loaded: false,

isloaded: function(){
  return this.collection_loaded;
},

load_collection: function(coll_root_hash){
  this.collection_root_hash=coll_root_hash;
  //console.log("Loaded coll: ",coll_root_hash);
  if(ipfs_node.api_access){
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
        mng.collection_loaded=true;
        //console.log("Loaded media:",mng.collection.data.media);
      });
   })
},

load_collection_http: function(coll_root_hash){
  var mng = this.collection.manage;
  $.ajax({
      url: "/ipfs/" + coll_root_hash + "/.collection.json",
      dataType: "json"})
  .then(function(r){
    mng.collection.data=r;
    mng.collection_loaded=true;
    console.log("res",r)

  });
  
},


// OBSOLETE update collection folder + history
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
            //console.log("COLLECTION root folder:",mng.collection_root_hash);
          });

        });
    }
  }
},


update_collection_metadata: function(){
  var mng = this.collection.manage;
  return new Promise(function(resolve, reject) {
    mng.collection.data.history=this.collection_root_hash;
    var meta=new Buffer(JSON.stringify(mng.collection.data));
    ipfs.add(meta,function(e,r){

      //console.log("created root meta:",r[0].Hash);
      //mng.update_collection_root({Name:".collection.json",Hash:r[0].Hash});
      resolve({Name:".collection.json",Hash:r[0].Hash});
    })
  });
},

// OBSOLETE
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
update_collection: function(){
  var mng = this.collection.manage;
  return new Promise(function(resolve, reject) {
    var prms=[
      mng.update_media_all_folders(),
      mng.update_media_category_folders(),
      mng.update_media_date_folders(),
      mng.update_collection_metadata()
    ];

    Promise.all(prms).then(function(r){
      //console.log("subs :",r);
      var folder={Links:r,Data:"\u0008\u0001"};
      ipfs.object.put(new Buffer(JSON.stringify(folder)),'json',function(e,r){
          var hash=r.Hash;
          //console.log("COLLECTION root folder:",hash);
          mng.collection_root_hash=hash;
          resolve({Name:mng.collection.data.name,Hash:hash});
      });

    });



  });

},

update_media_all_folders: function(){
  var mng = this.collection.manage;
  var mfolders = this.collection.data.media;
  return new Promise(function(resolve, reject) {
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
          resolve({Name:"all",Hash:hash});
          //mng.update_collection_root({Name:"all",Hash:hash});
          //console.log("all folder:",hash);
        });
      });
    
  });
  
},

update_media_date_folders: function(){
  var mng = this.collection.manage;
  return new Promise(function(resolve, reject) {
    var monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    var media=mng.collection.data.media;
    var years=[];for(i in media){y=(new Date(media[i].date)).getFullYear();if(years.indexOf(y)<0)years.push(y);}
    var yprms=[];
    var yfolders=[];

    for(y in years){
      mfolders=[];
      for(m in monthNames){
        var folder={Links:[],Data:"\u0008\u0001"};
        var mm=media.filter(function(me){return (new Date(me.date)).getFullYear()== years[y] && (new Date(me.date)).getMonth()==m;});
        mm.forEach(function(x){
          //console.log(y,m,x);
          var d=(new Date(x.date)).getDate();
          var pfx="";if(d<10)pfx="0";
          folder.Links.push({
            Name: pfx + d + ". " + x.title,
            Hash: x.folder_hash
          });
        });

        if(folder.Links.length>0)mfolders[m]=folder;
      }
      yfolders.push({year:years[y],folders:mfolders})
    }

    var sz_prms=[];
    // get size for all media folders
    for(y in yfolders){
      for(i in yfolders[y].folders){
        if(yfolders[y].folders[i]!=null){
          for(l in yfolders[y].folders[i].Links){
            sz_prms.push(ipfs.object.stat(yfolders[y].folders[i].Links[l].Hash));
          }
        }
      }
    }
    Promise.all(sz_prms).then(function(rs){
      var cnt=0;
      for(y in yfolders){
        for(i in yfolders[y].folders){
          if(yfolders[y].folders[i]!=null){
            for(l in yfolders[y].folders[i].Links){
              yfolders[y].folders[i].Links[l].Size=rs[cnt].CumulativeSize;
              cnt++
            }
          }
        }
      }

      // create all month folders
      var mf_prms=[];
      for(y in yfolders){
        for(i in yfolders[y].folders){
          if(yfolders[y].folders[i]!=null){
             mf_prms.push(ipfs.object.put(new Buffer(JSON.stringify(yfolders[y].folders[i])),'json'));
              
          }
        }
      }
      Promise.all(mf_prms).then(function(rs){
      var cnt=0;
      for(y in yfolders){
        yfolders[y].folder={Links:[],Data:"\u0008\u0001"};
        for(i in yfolders[y].folders){
          var pfx="";if(i<9)pfx="0";
          if(yfolders[y].folders[i]!=null){
            var sz=0;
            for(l in yfolders[y].folders[i].Links){
              sz=sz+yfolders[y].folders[i].Links[l].Size;
            }

            yfolders[y].folder.Links.push({
              Name: pfx + (parseInt(i)+1) + " " + monthNames[i],
              Hash: rs[cnt].Hash,
              Size: sz
            });
            cnt++;
          }
        }
      }

      //create year folder
      y_prms=[];
      for(y in yfolders){
        y_prms.push(ipfs.object.put(new Buffer(JSON.stringify(yfolders[y].folder)),'json'));
        
      }
      Promise.all(y_prms).then(function(rs){
        var topfolder={Links:[],Data:"\u0008\u0001"};

        for(y in yfolders){
          var sz=0;
          for(l in yfolders[y].folder.Links){
            sz=sz+yfolders[y].folder.Links[l].Size;
          }
          topfolder.Links.push({
            Name: years[y] + "",
            Hash: rs[y].Hash,
            Size: sz
          });
        }

        ipfs.object.put(new Buffer(JSON.stringify(topfolder)),'json',function(e,r){
          var hash=r.Hash;

          console.log(JSON.stringify(r,null,1));
          resolve({Name:"by date",Hash:hash});

        });


      });

      }); 
      
//    console.log(JSON.stringify(yfolders,null,1));      
    });



/*

    ipfs.object.put(new Buffer(JSON.stringify(folder)),'json',function(e,r){
      var hash=r.Hash;
      resolve({Name:"by date",Hash:hash});

    });

*/

  });

  //for(i=0;i<12;i++){pfx="";if(i<9)pfx="0";console.log(pfx + (i+1) + " " + monthNames[i])}



},

update_media_category_folders: function(){
  var mng = this.collection.manage;
  return new Promise(function(resolve, reject) {
    var cats=mng.collection.data.categories;
    var media=mng.collection.data.media;
    var prms=[];
    var folders=[];

    // get size for all media folders
    for(i in media){
      prms.push(ipfs.object.stat(media[i].folder_hash));
    }
    Promise.all(prms).then(function(r){
      //console.log(r[1])

      // finde EPs for all categories
      for(c in cats){
        var folder={Links:[],Data:"\u0008\u0001"};
        if(cats[c].ep_count>0){
          for(m in media){
            if(media[m].category==cats[c].short){
              folder.Links.push({
                Name: media[m].title,
                Hash: media[m].folder_hash,
                Size:r[m].CumulativeSize
              });
            }
          }
          //if(folder.Links.length>0)
          folders.push({cat:cats[c].title,fld:folder});
        }
      }
      // add misc
      var folder={Links:[],Data:"\u0008\u0001"};
      for(m in media){
        if(media[m].category.toLowerCase()=="misc"){
          folder.Links.push({
            Name: media[m].title,
            Hash: media[m].folder_hash,
            Size:r[m].CumulativeSize
          });
        }
      }
      if(folder.Links.length>0)folders.push({cat:"Misc",fld:folder});

      // create show folders on IPFS
      var cfpms=[];
      for(f in folders){
        cfpms.push(ipfs.object.put(new Buffer(JSON.stringify(folders[f].fld)),'json'));

      }
      Promise.all(cfpms).then(function(r){
        var sz_prms=[];
        // get size for all show folders
        for(i in r){
          sz_prms.push(ipfs.object.stat(r[i].Hash));
        }
        Promise.all(sz_prms).then(function(rs){

          // create "by show" folder
          var folder={Links:[],Data:"\u0008\u0001"};
          for(f in folders){
            folder.Links.push({
              Name: folders[f].cat,
              Hash: r[f].Hash,
              Size:rs[f].CumulativeSize});
            //console.log("Entry: ",folders[f].cat,rs[f].CumulativeSize)
          }
          //console.log("by show subs : ",folder);

          ipfs.object.put(new Buffer(JSON.stringify(folder)),'json',function(e,r){
            var hash=r.Hash;
            resolve({Name:"by show",Hash:hash});

          });

        });      


      });


    });  
  });  
  
},

//OBSOLETE
//update_by_show_folder
//update_by_date_folder
/*
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
}, */

add_to_collection: function(title,mhash,fhash,date,cat){
  var mdata=this.collection.data.media.filter(function(x){return x.media_hash!=mhash})
  mdata.push(
   {title: title, media_hash:mhash, folder_hash:fhash, date:date , category:cat}
  );
  this.collection.data.media=mdata;
  global.imports_running--;
}, 

// Step 3 create folder for media+meta
create_media_folder: function(file_hash,fname,fext,meta_hash,mname,meta,poster_hash){
  

  console.log("Create media folder for:",fname);
  var nono=["/","#","?","|",":"];
  var pp=fname;
  for(var i=0;i<nono.length;i++){pp=pp.split(nono[i]).join(" ");}
  var title=pp;
  var mng = this.collection.manage;

  Promise.all([
      ipfs.object.stat(file_hash),
      ipfs.object.stat(poster_hash),
      ipfs.object.stat(meta_hash)
  ]).then(function(r){
    var folder={Links:[
          {Name:title + "." + fext,Hash:file_hash,Size:r[0].CumulativeSize},
          {Name:"poster.jpg",Hash:poster_hash,Size:r[1].CumulativeSize},
          {Name:mname,Hash:meta_hash,Size:r[2].CumulativeSize}
      ],Data:"\u0008\u0001"};

    ipfs.object.put(new Buffer(JSON.stringify(folder)),'json',function(e,r){
      var hash=r.Hash;
      //console.log("media folder:",hash);

      var cat="misc";
      var cats=mng.collection.data.categories;
      for(s in cats) {
        for(f in cats[s].find) {
          if(title.toLowerCase().indexOf(cats[s].find[f])>=0){
            //console.log("is: ",cats[s].title);
            cats[s].ep_count=cats[s].ep_count+1;
            cat=cats[s].short
          }
        }
      }
      mng.add_to_collection(title,file_hash,hash,meta.publish_date,cat);

    });
  
  });

},

// Step 2 transform yt json and add to IPFS
create_meta_data: function(file_hash,poster_hash,meta_obj,sha256){
  var m={};
  m.publish_date        = new Date(meta_obj.upload_date.substr(0,4),parseInt(meta_obj.upload_date.substr(4,2))-1,meta_obj.upload_date.substr(6,2));
  m.title               = meta_obj.fulltitle;
  m.media_type           = "video";
  m.file_type           = meta_obj.ext;
  m.description         = meta_obj.description;
  m.resolution          = {height:meta_obj.height, width:meta_obj.width};
  m.youtube_uploader    = meta_obj.uploader;
  m.youtube_id          = meta_obj.id;
  m.mediafile_sha256    = sha256;
  
  var meta_file=new Buffer(JSON.stringify(m));
  var mng = this.collection.manage;
  ipfs.add(meta_file,function(e,r){
    //console.log("Added meta file:",r[0].Hash);
    mng.create_media_folder(file_hash,m.title,m.file_type,r[0].Hash,".media.json",m,poster_hash);
  })


},


// Step 1 import mediafile to IPFS
import_media_file: function(stream, pstream, meta_obj, sha256){
  var mng = this.collection.manage;
  //var ipr = global.imports_running;
  ipfs.add(stream,function(e,r){
    if(!mng.collection_modified){
      mng.collection_modified=true;mng.collection_links=[];
    }
    var hash=r[0].Hash;
    //console.log("Added media file:",hash);
    ipfs.add(pstream,function(e,r){
      mng.create_meta_data(hash,r[0].Hash,meta_obj,sha256);
    });
  })

},

import_queue:[],

stage_media_folders_import: function(root,pattrn){
  var mng = this.collection.manage;
  //var ipr = global.imports_running;var ipl = global.max_paralell_imports;
  var queue=[];
  var lst=fs.readdirSync(root).filter(function(f){return f.substr(0,pattrn.length)==pattrn;});
  //console.log(lst,root,pattrn.length,fs.readdirSync(root).filter(function(f){return f.substr(0,6)=="201408";}));
  lst.forEach(function(x){
    var mp4=root+ "/" + x + "/" + fs.readdirSync(root+x).filter(function(f){return f.substr(f.length-4,4)==".mp4"})[0];
    var ytm=root+ "/" + x + "/YoutubeInfo.json"
    var pstr=root+ "/" + x + "/poster.jpg"
    var shnt=root+ "/" + x + "/ShowNotes.md"
    //console.log(mp4,ytm);
    mp4strm=fs.createReadStream(mp4);
    pstrstrm=fs.createReadStream(pstr);
    ytmobj=require("./" + ytm);
    var sha256=fs.readFileSync(shnt).toString().split("\n")[5].split(":  ")[1];
    //console.log(sha256)

    queue.push({stream:mp4strm, meta:ytmobj, poster:pstrstrm, sha256:sha256})
  });
  this.import_queue=queue;
  return queue.length>0;
},

run_queue_item:function(){
      var itm=this.import_queue.pop();
      console.log("start media file import of ", itm.meta.title);
      this.import_media_file(itm.stream,itm.poster,itm.meta,itm.sha256);
},

run_import_queue: function(){
  var mng = this.collection.manage;
  return new Promise(function(resolve, reject) {
    global.imports_resolve=resolve;
    function runq(){
      if(global.imports_running<global.imports_max_paralell && mng.import_queue.length > 0){
        global.imports_running++;
        mng.run_queue_item();

      }
      if(mng.import_queue.length > 0 || global.imports_running > 0){
        //console.log("waiting..")
        setTimeout(runq,1500);
      }else{
          //console.log("ok",global.imports_running,resolve);
          resolve();
      }

    }
    runq();
  });
}

}

}