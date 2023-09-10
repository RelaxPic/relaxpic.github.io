##  功能使用说明

#### 1. WebDAV备份

慢图浏览目前只支持同步路径的方式同步照片，并且在你的WebDAV目录下面创建一个`/慢图浏览/public/`目录，用于存放公开的照片，未来私密相册都会存放在`/慢图浏览/private/`目录下面。

未来也会支持以日期的方式存放照片，例如`/慢图浏览/public/2021/01/01/`，这样可以方便的查看某一天的照片。目前国内的小米，华为，OPPO，VIVO等手机都是使用目录的方式存放照片的，例如`/DCIM/Camera/`，所以慢图浏览也是使用目录的方式存放照片。
但是Google，三星的相册依然使用的是日期目录的方式来备份。所以慢图浏览会支持两种方式，目录和日期的方式来备份照片。

WebDAV备份功能需要你有一个WebDAV服务器，如果你没有，可以使用[Alist](https://alist.nn.ci/)或者[flydav](https://github.com/pluveto/flydav/)搭建一个。

搭建好Alist Webdav后，需要创建WebDAV服务。

##### Alist 配置
1. 打开Alist，点击左边菜单栏存储。
2. 点击上方添加按钮。
3. 驱动选择： 本地存储
4. 挂载路径： `/webdav` ， 这里的 `/webdav` 可以换成你喜欢的路径。
5. 根文件夹路径： 

   linux 下面配置为 `/home/xiaoming/webdav`

   windows 下面配置为 `C:\Users\xiaoming\webdav`

   macos  下面配置为 `/Users/xiaoming/webdav` 
 
   上面的路径建议配置为你的用户目录下面，其中`xiaoming`可以替换成你自己的用户名， 这样会最大程度避免权限问题。目前Alist 不能配置为根目录`/`，建议配置为用户目录下面，这是一个Alist的一个已知的BUG。

6. 其他的配置如果没有其他的需求，可以不需要修改。

完成上述配置后，在慢图浏览中可以配置账号功能。账号如果上面的挂载路径为`/webdav`，那么WebDAV 服务器地址就是: `http://ip:5244/dav/webdav`， Alist访问webdav必须带上`/dav/`+挂载路径，其中`ip`是你的Alist服务器的IP地址。账号/密码就是你的Alist的账号密码。


##### flydav 配置

1. flydav 的path 配置为 `/webdav` ， 这里的 `/webdav` 可以换成你喜欢的路径。
2. 启动flydav后，可以在慢图浏览中配置账号功能。
3. 如果上面的挂载路径为`/webdav`，那么WebDAV 服务器地址就是: `http://ip:7086/webdav`， 其中`ip`是你的flydav服务器的IP地址，`7086`是flydav的默认端口 。账号/密码就是你的flydav的账号密码。


由于慢图浏览暂时不支持自签名证书，所以如果你的WebDAV服务器使用的是自签名证书，可能会出现无法登录账号的情况。这种情况依然可以使用`Zerotier`或者`frp`，内网穿透的方式来访问你的WebDAV服务器，或者配置`ACME`的https证书来访问你的WebDAV服务器。

