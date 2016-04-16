/**
* Módulo de router que maneja las peticiones de post.
*/

var express = require('express');

module.exports = function(app){

  var router = express.Router();
  //Importamos el modelo de Post
  var Post = app.models.Post;

  //Método GET / - Devuelve lista de POST
  router.get("/",function(req,res){

    console.log("Processing GET /post");
    Post.find({},function(err,results){
      if(err){
        res.status(500).send({"error":true,"message":"Error retrieving data"});
      }
      else{
        res.send({"error":false,"message":results});
      }

      });

  });


  //Método POST / - Añade un nuevo POST
  router.post("/",function(req,res){

    console.log("Processing POST /post");
    var newPost = new Post(req.body);
    newPost.save(function(err,saved){

      if(err){
        res.status(500).send({"error":true,"message":"Error adding data"});
      }
      else{
        res.send({"error":false,"message":saved});
      }
    });


  });

  //Método DELETE /:id - Borra un post
  router.delete("/:id",function(req,res){

    console.log("Processing DELETE /post/:id" + req.params.id);
    Post.remove({_id:req.params.id},function(err,deleted){

      if(err){
        res.status(500).send({"error":true,"message":"Error deleting data"});
      }
      else{
        res.send({"error":false,"message":deleted});
      }
    });


  });

  //...

  return router;

};
