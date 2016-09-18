'strict';

function SrsHttpManager(options){
    
    var opt = {
        root: "",
        el: $('#srsManagerRootEl'),
        proto: "http",
        username: "",
        password: "",
        auth: false,
        domain: window.location.hostname,
        port: 1985,
        pathRoot: "/api/v1"
    };

    $.extend(opt, options);

    opt.root = opt.proto + "://" + opt.domain + (opt.port ? ":"+opt.port : "") + opt.pathRoot;
        

    
    var el = opt.el, 
        handlers,
        rootObjsEl = el.find('.rootObjs'),
        contentEl = el.children('.content'),
        modalInfoEl = el.children('.modal.modalInfo')
        ;
    
    if( !(el instanceof jQuery) ){        
        log("el must be jQuery");
        return false;
    }
        
    jQuery.ajaxSetup({
        timeout: 30000,
        beforeSend: function(){                                    
            el.addClass('working');
        },                
        complete: function(){
            el.removeClass('working');
        }
    })


        
    function req(path, o){
        
        return new Promise(function(resolve, reject) {
            o = o || {};
            var url = opt.root + "/" + path,
                data = {}, jsonpParse = false;
                ;

            //alert(url);

            var optAjax = {      
                method: "GET",
                url: url,
                //crossDomain: true,
                data: data,
                error: function(xhr, error, error2){
                    alert("Error request: "+error+", url: " + url)
                    reject(error);
                },
                success: function(res){
                    if(jsonpParse){

                        //workarround...
                        var JSON_CALLBACK = function(opt){
                            resolve(opt.code == 0 ? true : false);
                        }

                        eval(res);

                    }else{
                        resolve(res)
                    }

                },
                dataType: 'json'
            }

            if(o.method){
                data.callback = "JSON_CALLBACK";
                data.method = o.method;
                optAjax.dataType = 'html';
                jsonpParse = true;
            }


            if(opt.auth){
                /*
                optAjax.username =  opt.username;
                optAjax.password =  opt.password;
                
                
                optAjax.beforeSend = function (xhr) {
                    xhr.setRequestHeader ("Authorization", "Basic " + btoa(opt.username + ":" + opt.password));
                };    
                
                optAjax.headers = {
                    "X-Requested-With": XMLHttpRequest,
                    "Authorization": "Basic " + btoa(opt.username + ":" + opt.password)
                };                
                
                */
                
                
                optAjax.xhrFields = {
                      withCredentials: true
                }
                
                
            }
                        
            $.ajax(optAjax);
        });

    }    
    
    function createTopMenu(){
        return req("", {}).then(function(res){
                        
            if('urls' in res){

                $.each(res.urls, function(item, val){                    
                    $('<a class="btn btn-default '+item+'" title="'+val+'" href="#'+item+'">'+item+'</a>').appendTo(rootObjsEl);
                })
            }else{
                alert('Error get root items');
            }
            
        }).catch(function(err){
            log(err)
        })
    }
    
    function router(){
        var hash = window.location.hash;
        if(hash.length > 0){
            hashs = hash.split('#')[1].split('/');
            var handler = hashs[0];

            rootObjsEl.children('.btn').removeClass('active');
            rootObjsEl.find('.'+handler).addClass('active');

            if( handler in handlers && typeof handlers[handler] == 'function'){
                handlers[handler].call(this, hashs);
            }else{
                handlers['__default'].call(this, hashs);
                log("not implemented");
            }
            
            
        }
    }
    
    function table(optTable){

        optTable = optTable || {};

        var tblEl = $('<table class="table table-striped table-bordered table-hover tableObjsItems"></table>'),
            headerEl = $('<thead></thead>'),
            bodyEl = $('<tbody></tbody>'),
            headerItems, self = this, trHeader,
            hasActions = false
            ;


            
        tblEl.append(headerEl);
        tblEl.append(bodyEl);

        if( ('draw' in optTable && optTable.draw) || !('draw' in optTable) ){
            contentEl.append(tblEl)
        }
        
        this.header = function(o){
            trHeader = $('<tr/>').appendTo(headerEl);
            headerItems = o;
            $.each(headerItems, function(name, label){
                trHeader.append('<th class="header-'+name+'">'+label+'</td>');
            })
            
            headerEl.append(trHeader)
        }
        
        function rowObj(o){
            var tr = $('<tr/>').appendTo(bodyEl),
                _row = this, rowOpt = o;
                ;
            $.each(headerItems, function(key, value){
                var valueRow = key in o ? o[key] : "";
                if(valueRow instanceof Object) valueRow = objPrint(valueRow);
                tr.append('<td class="row-'+name+'">'+(valueRow ? valueRow : '&mdash;')+'</td>');
            })            
            
            this.actions = function(o){
                if(!self.hasActions){
                    //prepend empty cell to header
                    self.hasActions = true;
                    $('<th></th>').prependTo(trHeader);                    
                }
                                
                var tdActions = $('<td class="actions"></td>').prependTo(tr);
                $.each(o, function(key, obj){
                    var glyphicon = "glyphicon-asterisk";
                    if(key == 'delete'){
                        glyphicon = 'glyphicon glyphicon-remove';
                    }else if(key == 'info'){
                        glyphicon = 'glyphicon glyphicon-info-sign';
                    }
                    var icon = $('<span class="glyphicon '+glyphicon+'"></span>'),
                        label = obj.label
                        ;
                    
                    $('<button class="btn btn-default" title="'+label+'"/>').appendTo(tdActions).append(icon).on('click', function(){
                        if('func' in obj && typeof obj.func == "function"){
                            if('confirm' in obj){
                                if(confirm(typeof obj.confirm  == "string" ? obj.confirm : "Really?")){
                                    obj.func.call(_row, rowOpt.id)
                                }
                            }else{
                                obj.func.call(_row, rowOpt.id)
                            }
                        }else{
                            if(key == "info"){
                                _row.openInfo();
                            }
                        }
                    })
                })
                
                return _row;
            }

            this.openInfo = function(){

                var body = "";

                var tbl = new table({
                    draw: false
                });
                tbl.header({
                    name: "Name",
                    value: "Value"
                });

                var items = rowOpt.__all || rowOpt;

                $.each(items, function(name, val){

                    tbl.row({
                        name: headerItems[name] || name,
                        value: val
                    });

                })

                modalInfoEl.modal('show');
                modalInfoEl.find('.modal-body').html(body).append(tbl.table);

            }

            this.remove = function(){
                tr.remove();
            }
            
            this.opt = rowOpt;
            this.tr = tr;
        }
        
        this.row = function(o){
            return new rowObj(o);            
        }

        this.table = tblEl;
        
    }

    function loadHandler(name){
        
        return new Promise(function(resolve, reject) {
            contentEl.html('Loading content...');
            req(name, {}).then(function(res){
                var defNameObj = "data";
                contentEl.html('');

                if(name in res && res[name].length > 0){
                    resolve(res[name]);
                }else if(defNameObj in res){
                    resolve(res[defNameObj]);
                }else{
                    contentEl.html('Empty result.');
                }

            }).catch(function(err){
                reject(err);
                contentEl.html(err);
            })            
        })
        

    }
    
    handlers = {
        streams: function(hashs){
            var obj = hashs[0];
            loadHandler(obj).then(function(res){

                var tbl = new table();
                tbl.header({
                    id: 'Id',
                    name: 'Name',
                    app: 'App',
                    clients: "Clients",
                    kbps: "Bandwidth(recv/send)",
                    //active: "Active",
                    bytes: "Bytes(recv/send)",

                })

                res.forEach(function(item){

                    bytesHtml = mb(item.recv_bytes) + " / " +  mb(item.send_bytes);
                    kbpsHtml = "";


                    kbpsHtml += item.kbps.recv_30s + " / " + item.kbps.send_30s + " kbps";

                    var row =tbl.row({
                        id: item.id,
                        name: item.name,
                        app: item.app,
                        clients: item.clients,
                        bytes: bytesHtml,
                        kbps: kbpsHtml,
                        cid: item.publish.active ? item.publish.cid : 0,
                        __all: item

                    }).actions({
                        "delete": {
                            label: "Remove",
                            confirm: "Stop stream?",
                            func: function(id){
                                var thisrow = this;
                                req("clients/"+thisrow.opt.cid, {method: "DELETE"}).then(function(res){
                                    if(res) {
                                        thisrow.remove();
                                    }else{
                                        alert("Error delete stream: " + thisrow.opt.id);
                                    }
                                }).catch(function(err){

                                })
                            }
                        },

                        info: {
                            label: "Info about the stream"
                        }

                    });

                    row.tr.addClass(item.publish.active ? 'success' : 'danger');
                })

                
            }).catch(function(err){                
                log(err);
            })
        },
        
        clients: function(hashs){
            var obj = hashs[0];
            loadHandler(obj).then(function(res){

                var tbl = new table();
                tbl.header({
                    id: 'Id',
                    ip: 'IP',
                    publish: "Publish",
                    stream: "Stream",
                    pageUrl: "pageUrl",
                    url: "URL",
                    vhost: "vhost",

                })

                res.forEach(function(item){
                    var row = tbl.row({
                        id: item.id,
                        ip: item.ip,
                        publish: item.publish ? '<span class="glyphicon glyphicon-ok"></span>' : "",
                        stream: item.stream,
                        pageUrl: item.pageUrl,
                        url: item.url,
                        vhost: item.vhost,
                        __all: item
                    }).actions({
                        "delete": {
                            label: "Remove",
                            confirm: "Remove this client?",
                            func: function(id){
                                var thisrow = this;
                                req("clients/"+thisrow.opt.id, {method: "DELETE"}).then(function(res){
                                    if(res) {
                                        thisrow.remove();
                                    }else{
                                        alert("Error delete client: " + thisrow.opt.id);
                                    }
                                }).catch(function(err){

                                })
                            }
                        },
                        info: {
                            label: "Info about the client"
                        }
                    })

                    row.tr.addClass(item.publish ? 'success' : '');
                })

                
            }).catch(function(err){                
                log(err);
            })
        },

        __default: function(hashs){

            var obj = hashs[0],
                returnName = 'data'
                ;

            loadHandler(obj).then(function(res){

                if(res instanceof Object){
                    var tbl = new table();
                    tbl.header({
                        name: 'Name',
                        value: 'Value',
                    })
                }else if(res instanceof Array){

                }

                $.each(res, function(item, value){


                    if(res instanceof Object){



                        if(value instanceof Object){
                            value = objPrint(value);
                        }

                        var row = tbl.row({
                            name: item,
                            value: value
                        })

                    }else if(res instanceof Array){

                    }



                })


            }).catch(function(err){
                log(err);
            })
        }
        
        
    }

    
    function init(){
        
        $(window).bind('hashchange', function() {
            router()
        });

        el.find(".toolbar .refresh").on('click', function(){
            router()
        })


        
        createTopMenu().then(function(){
            router();
        })

    }

    function objPrint(value){
        value = JSON.stringify(value, false, 4);
        value = "<pre>" + value + "</pre>";
        return value;
    }

    function mb(bytes){
        if      (bytes>=1000000000) {bytes=(bytes/1000000000).toFixed(2)+' GB';}
        else if (bytes>=1000000)    {bytes=(bytes/1000000).toFixed(2)+' MB';}
        else if (bytes>=1000)       {bytes=(bytes/1000).toFixed(2)+' KB';}
        else if (bytes>1)           {bytes=bytes+' b.';}
        else if (bytes==1)          {bytes=bytes+' b.';}
        else                        {bytes='0 b.';}
        return bytes;
    }

    function log(s){
        if('console' in window && 'warn' in console){
            console.warn(s);
        }
    }
    
    init();
    
    
}
