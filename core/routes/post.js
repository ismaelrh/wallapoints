/**
* Módulo de router que maneja las peticiones de post.
*/

var express = require('express');

module.exports = function(app){

  var router = express.Router();
  //Importamos el modelo de Post
  var Post = app.models.Post;

  //Método GET /
  router.get("/",function(req,res){

    Post.find({},function(err,results){
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
