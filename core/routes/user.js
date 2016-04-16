/**
* Módulo de router que maneja las peticiones de user.
*/

var express = require('express');

module.exports = function(app){

  var router = express.Router();
  //Importamos el modelo de User
  var User = app.models.User;

  //Método GET /
  router.get("/",function(req,res){

    User.find({},function(err,results){
      if(err){
        res.send({"error":true,"message":"Error retrieving data"});
      }
      else{
        res.send({"error":false,"message":results});
      }

      });

  });

  router.post("/",function(req,res){
    res.send("Not implemented");
  });

  //...

  return router;

};
