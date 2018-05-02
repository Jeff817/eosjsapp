var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
//app.set('view engine', 'jade');
app.set("view engine","ejs");  

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);






//===
//===

Eos = require('eosjs');
var {api, ecc, json, Fcbuffer, format} = Eos.modules;
var islocal=false;//是否为本地，fasle 为服务器
//====本地key

/***

shanghaishiyufanyideMacBook-Pro:cleos worldnese$ ./cleos create key
Private key: 5JoQioDc8gkSfSbypwSumq24nb7KyajjsDswZRaBfLUPQAtF7ks
Public key: EOS5uSUVNVspG2wwfPBcRx29rVs1RN9vNtVjwgFLapWn3WjYQpW6F

shanghaishiyufanyideMacBook-Pro:cleos worldnese$ ./cleos create key
Private key: 5J9vX9vDtjG7iCLmah2zLUEnVnBPKifGieY8zJELJpN5G9cpdJB
Public key: EOS6UJqj1oBgFoe3f11TJ895WcJQhXG7DBVzjKnt4j88WkVvXTab8
*/
var initaPrivateOwen = '5JoQioDc8gkSfSbypwSumq24nb7KyajjsDswZRaBfLUPQAtF7ks';
var	initaPublicOwen = 'EOS5uSUVNVspG2wwfPBcRx29rVs1RN9vNtVjwgFLapWn3WjYQpW6F';

var initaPrivateActiv = '5J9vX9vDtjG7iCLmah2zLUEnVnBPKifGieY8zJELJpN5G9cpdJB';
var	initaPublicActiv = 'EOS6UJqj1oBgFoe3f11TJ895WcJQhXG7DBVzjKnt4j88WkVvXTab8';

var eosioProductPriv='5KQwrPbwdL6PhXujxW37FSSQZ1JiwsST4cqQzDeyXtP79zkvFD3';
var eosioProductPub='EOS6MRyAjQq8ud7hVNYcfnVPJqcVpscN5So8BhtHuGYqET5GDW5CV';
//服务器
if(!islocal){

/**
	
	Private key: 5KAPaEiooNWoxoeHPRbWMychxwWVrMSnaHoKdWbbPhxEB39r8PC
Public key: EOS5H46zURZo3qNQRGu6JEUfpmbd4kTwUJdzLS3T6HwdSpVNgzFeD
root@iZbp1einlbe5h87nkphdr9Z:/opt/eos/def/eosio/bin# ./cleos create key
Private key: 5KVab2oypoEK6CeYCaVeZMH3YgXmu2rJPqWYzz6HJUAeq5CgiVA
Public key: EOS51yk9UArfjHWbD2rZstm8qsTNTXKBnGqEdoSuRXEjhRkCh1Y7Z
	*/
	
	initaPrivateOwen = '5KAPaEiooNWoxoeHPRbWMychxwWVrMSnaHoKdWbbPhxEB39r8PC';
	initaPublicOwen = 'EOS5H46zURZo3qNQRGu6JEUfpmbd4kTwUJdzLS3T6HwdSpVNgzFeD';
	
	initaPrivateActiv = '5KVab2oypoEK6CeYCaVeZMH3YgXmu2rJPqWYzz6HJUAeq5CgiVA';
	initaPublicActiv = 'EOS51yk9UArfjHWbD2rZstm8qsTNTXKBnGqEdoSuRXEjhRkCh1Y7Z';
	
	
	eosioProductPriv='5KQwrPbwdL6PhXujxW37FSSQZ1JiwsST4cqQzDeyXtP79zkvFD3';
	eosioProductPub='EOS6MRyAjQq8ud7hVNYcfnVPJqcVpscN5So8BhtHuGYqET5GDW5CV';
}


/***

获取eos基本信息
http://127.0.0.1/eos?hi=zhao
*/
app.get("/eos",function (req, res){
	console.log("eos");
	var msg=req.body;
	console.log("msg"+msg);
	console.log("hi:"+req.query.hi);
	eos = Eos.Localnet({keyProvider: initaPrivateOwen});
	// eos.getBlock(1).then(result => {
// 		//console.log(result);
// 		c
// 		return;
// 	})
	//
	// eos.getInfo({}).then(result => {
// 		//console.log(result);
// 		res.send(result);
// 		return;
// 	})
	
	callback = (err, result) => {
		//err ? console.error(err) : console.log(result)
		if(err){
			res.send(err);
			return;
		}else{
			res.send(result);
			return;
		}
		
	}
	eos.getBlock(1, callback)

});

app.get("/getBlock",function (req, res){
	console.log("getBlock");
	var id=req.query.id;
	
	console.log("id:"+id);
	eos = Eos.Localnet({keyProvider: initaPrivateOwen});
	
	if(!id){		
		res.send("区块id不能为空");
		return;

	}
	callback = (err, result) => {
		//err ? console.error(err) : console.log(result)
		if(err){
			res.send(err);
			return;
		}else{
			res.send(result);
			return;
		}
		
	}
	eos.getBlock(id, callback)

});

app.get("/getAccount",function (req, res){
	console.log("getAccount");
	var id=req.query.id;
	
	console.log("id:"+id);
	eos = Eos.Localnet({keyProvider: initaPrivateOwen});
	
	if(!id){		
		res.send("区块id不能为空");
		return;

	}
	callback = (err, result) => {
		//err ? console.error(err) : console.log(result)
		if(err){
			res.send(err);
			return;
		}else{
			res.send(result);
			return;
		}
		
	}
	var p={"scope":id, "code":"currency", "table":"accounts", "json": true};
	eos.getTableRows(p).then(result => {
		//console.log(result);
		res.send(result);
		return;
	})

});


/***
转账
参数：
http://47.97.194.173//zhuanzhang?toaccount=xiaoming&num=1 EOS&desc=1yibai
http://127.0.0.1/zhuanzhang?toaccount=eosio&num=1 CUR&desc=1yibai
http://127.0.0.1/zhuanzhang?toaccount=bb&num=1 CUR&desc=1yibai

toaccount:账户名
num：数量
desc：描述
*/

app.get("/zhuanzhang",function (req, res){
	console.log("zhuanzhang");
	var toaccount=req.query.toaccount;
	var num=req.query.num;
	var desc=req.query.desc;

	console.log("zhuanzhang toaccount"+toaccount);
	
	if(!toaccount){		
		res.send("toaccount不能为空");
		return;

	}
	else if(!num){		
		res.send("num不能为空");
		return;

	}
	else if(!desc){		
		res.send("desc不能为空");
		return;

	}
	else
	{		
	   // initaPrivate = '5KVab2oypoEK6CeYCaVeZMH3YgXmu2rJPqWYzz6HJUAeq5CgiVA'
// 	  initaPublic = 'EOS51yk9UArfjHWbD2rZstm8qsTNTXKBnGqEdoSuRXEjhRkCh1Y7Z'
	  
	  keyProvider = initaPrivateActiv;
	  eos = Eos.Localnet({keyProvider});
	  options = {broadcast: false};
	  //zhuangzhang 1
	  eos.transaction('currency', currency => {
	      currency.transfer('currency', toaccount, num, desc)
	  }).then(result => {
			console.log(result);
			res.send(result);
			return;
		})	


// callback = (err, result) => {
// 		console.error("callback");
// 		//err ? console.error(err) : console.log(result)
// 		if(err){
// 		    console.error("error"+err);
// 			res.render('error', { title: '<h1>Eos demo</h1>'
//                           ,error:err 
//             });
// 			return;
// 		}else{
// 			res.send(result);
// 			return;
// 		}
// 		
// 	}
	
		// eos.transaction('currency', currency => {
// 	      currency.transfer('currency', toaccount, num, desc)
// 	    },options,callback);
	    
		
	//zhuang zhang 2
	
		//eos.transfer({from: 'currency', to: toaccount, quantity: num, memo: desc}, options,callback)
	
	
	
			
	}
});

/***
创建账户
http://127.0.0.1/newAccount?name=bb

**/
app.get("/newAccount",function (req, res){
	console.log("newAccount");
	var name=req.query.name;
	console.log("newAccount name"+name);
	if(name){		
		eos = Eos.Localnet({keyProvider: eosioProductPriv})
		eos.newaccount({
		  creator: 'eosio',
		  name: name,
		  owner: eosioProductPub,
		  active: eosioProductPub,
		  recovery: 'eosio'
		}).then(result => {
			console.log(result);
			res.send(result);
			return;
		})
	}else{
		res.send("name不能为空");
		return;
		
	}	

});


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});



module.exports = app;





