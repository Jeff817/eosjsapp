# eosjsapp
基于eos实现，功能：可以创建账户，转账，查询余额

# 使用框架
express+ejs+eosjs

# eosjsapp启动
- clone https://github.com/eosDeveloper/eosjsapp.git
- npm start ，默认端口80
- 如果启动失败，报类似下面错误
- 
```
myMacBook-Pro:eosjsapp worldnese$ npm start 

> app@0.0.0 start /Users/apple/eosjsapp
> node ./bin/www

Port 80 requires elevated privileges
npm ERR! code ELIFECYCLE
npm ERR! errno 1
npm ERR! app@0.0.0 start: `node ./bin/www`
npm ERR! Exit status 1
npm ERR! 
npm ERR! Failed at the app@0.0.0 start script.
npm ERR! This is probably not a problem with npm. There is likely additional logging output above.

npm ERR! A complete log of this run can be found in:
npm ERR!     /Users/apple/.npm/_logs/2018-05-01T11_52_21_099Z-debug.log

```

- 改成：sudo npm start，原因：权限不够

# 端口修改
打开文件/Users/apple/eosjsapp/bin/www
```
var port = normalizePort(process.env.PORT || '80');
```

#安装使用express
- npm install express --save
- sudo npm install -g express 
- 查看版本：express -V
- npm install -g express-generator
- 创建项目： express app
- 启动项目：npm start ，默认端口3000

# eosjs安装
 npm i eosjs@dawn3



# 联系方式
- 微信:zhiming817
- 邮箱:zhiming_817@qq.com

