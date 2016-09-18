#Javascript manager the SRS HTTP API

###Requirements
* Bootstrap
* jQuery

Tested on google chrome

Remarks:
Set the http proxy server, such as nginx

nginx.conf
```
listen       1985 ssl;
server_name  localhost;

#auth_basic  "private site";
#auth_basic_user_file .htpasswd;                

location /{       
    add_header Access-Control-Allow-Origin https://example.com/SrsHttpManager;
    add_header Access-Control-Allow-Methods *;
    add_header Access-Control-Allow-Headers *;
    add_header Access-Control-Expose-Headers *;
    add_header Access-Control-Allow-Credentials true;
    
    proxy_pass   http://127.0.0.1:1984;                
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;            
}
```

srs.conf
```
http_api {
    enabled         on;
    listen          127.0.0.1:1984;
    crossdomain     off;
    
}
```

Put the contents https://github.com/thegobot/srs/edit/2.0release/trunk/SrsHttpMamager into a folder on your Web server 
