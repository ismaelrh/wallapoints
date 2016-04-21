/**
 * Módulo de router que maneja las peticiones de user.
 */

var express = require('express');
var crypto = require('crypto');

module.exports = function(app){

    var router = express.Router();

    //Importamos el modelo de Guest
    var Guest = app.models.Guest;

    //Método GET / -> Devuelve un listado de todos los GUEST, sin contraseñas
    router.get("/",function(req,res){

        //todo: en favs, following y ratings poner enlaces
        Guest.find({},'_id mail favs following ratings',function(err,results){
            if(err){
                res.send({"error":true,"message":"Error retrieving data"});
            }
            else{
                res.send({"error":false,"message":results});
            }

        });

    });

    //Método POST / -> Nuevo invitado con mail y password (por lo menos)
    router.post("/",function(req,res){

        var newGuest = new Guest(req.body);


        if(newGuest.mail && newGuest.password){ //Datos necesarios provistos

            //Se calcula el hash
            newGuest.password = crypto.createHash('md5').update(newGuest.password).digest('hex');

            newGuest.save(function(err,result){

                if(err){
                    res.send({"error":true,"message":"Error saving data "});
                    console.err(err);
                }
                else{
                    res.send({"error":false,"message":result});
                }
            });

        }
        else{ //No provistos

            res.status(400).send({"error":true,"message":"Bad request, please provide mail and password"});

        }

    });

    //Método GET /:id -> Obtiene detalles de un solo guest
    router.get("/:id",function(req,res){

        //todo: en favs, following y ratings poner enlaces
        Guest.findOne({mail:req.params.id},'_id mail favs following ratings',function(err,results){
            if(err){
                res.status(500).send({"error":true,"message":"Error retrieving data"});
            }
            else if(results==null){
                res.status(404).send({"error":true,"message":"User does not exists"});
            }
            else{
                res.send({"error":false,"message":results});
            }

        });

    });


    router.get("/:id/favodurite",function(req,res){

        //todo: en favs, following y ratings poner enlaces
        Guest.findOne({mail:req.params.id},'favs',function(err,result){
            if(err){
                res.status(500).send({"error":true,"message":"Error retrieving data"});
            }
            else if(result==null){
                res.status(404).send({"error":true,"message":"User does not exists"});
            }
            else{
                res.send({"error":false,"message":result.favs});
            }

        });

    });

    //Acepta {"_id": id_del_poi}
    router.post("/:id/favdourite",function(req,res){

        var newFav = req.body;

        var conditions = { mail: req.params.id }
            , update = { $push: { favs: newFav  }};

        //Check if the POI exists
        var exists = true;

        //todo: mirar de POI
        if(!exists){
            res.status(404).send({"error":true,"message":"POI to add does not exists"});
        }
        else{

            Guest.findOne({mail:req.params.id},function(err,data){


                if(err){ //Database error
                    res.status(500).send({"error":true,"message":"Error adding fav"});
                    return;
                }

                if(data==null){   //The guest does not exists
                    res.status(404).send({"error":true,"message":"The guest does not exists"});
                    return;
                }


                var alreadyContained = false;
                for(var i = 0; !alreadyContained && i < data.favs.length; i++){
                    console.log(i);
                    if(data.favs[i]._id == newFav._id){
                        alreadyContained = true;
                    }
                }

                //Si no estaba contenido el favorito, lo añadimos
                if(!alreadyContained){
                    data.favs.push(newFav);
                    data.save();
                }


                res.send({"error":false,"message":data.favs});
                return;



            });

        }



    });


    router.delete("/:id/favodurite/:poiId",function(req,res){

        var favToDelete = req.params.poiId;

        Guest.findOne({mail:req.params.id},function(err,data){


            if(err){
                res.status(500).send({"error":true,"message":"Error adding fav"});
                return;
            }

            if(data==null){
                //The guest does not exists
                res.status(404).send({"error":true,"message":"The guest does not exists"});
                return;
            }


            //Buscamos favorito en el Guest
            var favoriteExists = false;
            var indexToDelete = -1;
            for(var i = 0; !favoriteExists && i < data.favs.length; i++){
                if(data.favs[i]._id == favToDelete){

                    indexToDelete = i;
                    favoriteExists = true;
                }
            }

            //No existe el favorito -> 404
            if(!favoriteExists){
                res.status(404).send({"error":true,"message":"Favourite not found"});
                return;
            }

            //Se guarda el borrado del favorito
            data.favs.splice(indexToDelete,1);
            data.save();
            res.send({"error":false,"message":"The fav has been deleted"});



        });


    });


    router.get("/:id/following",function(req,res){

        //todo: en favs, following y ratings poner enlaces
        Guest.findOne({mail:req.params.id},'following',function(err,result){
            if(err){
                res.status(500).send({"error":true,"message":"Error retrieving data"});
            }
            else if(result==null){
                res.status(404).send({"error":true,"message":"User does not exists"});
            }
            else{
                res.send({"error":false,"message":result.following});
            }

        });

    });

    //Acepta {"_id": id_del_poi}
    router.post("/:id/following",function(req,res){

        var newUser = req.body;


        //Check if the POI exists
        var exists = true;

        //todo: mirar de user
        if(!exists){
            res.status(404).send({"error":true,"message":"User to follow does not exists"});
        }
        else{

            Guest.findOne({mail:req.params.id},function(err,data){


                if(err){
                    res.status(500).send({"error":true,"message":"Error adding user to follow"});
                    return;
                }

                if(data==null){//The guest does not exists
                    res.status(404).send({"error":true,"message":"The guest does not exists"});
                     return;
                }


                var alreadyContained = false;
                for(var i = 0; !alreadyContained && i < data.following.length; i++){
                    console.log(i);
                    if(data.following[i].username == newUser.username){
                        alreadyContained = true;
                    }
                }

                if(!alreadyContained){
                    data.following.push(newUser);
                    data.save();
                }

                res.send({"error":false,"message":"Followed user has been deleted"});



            });

        }



    });


    router.delete("/:id/following/:username",function(req,res){

        var userToDelete = req.params.username;

        Guest.findOne({mail:req.params.id},function(err,data){


            if(err){
                res.status(500).send({"error":true,"message":"Error adding fav"});
                return;

            }
            if(data==null){
                //The guest does not exists
                res.status(404).send({"error":true,"message":"The guest does not exists"});
                return;
            }


            var userExists = false;
            var indexToDelete = -1;
            for(var i = 0; !userExists && i < data.following.length; i++){
                console.log(i);
                if(data.following[i].username == userToDelete){

                    indexToDelete = i;
                    userExists = true;
                }
            }

            //No existe el favorito -> 404
            if(!userExists){
                res.status(404).send({"error":true,"message":"User not found in following list"});
            }
            else{
                data.following.splice(indexToDelete,1);
                data.save();
                res.send({"error":false,"message":"Usuario borrado"});
            }


        });


    });


    router.get("/:id/rating",function(req,res){

        //todo: en favs, following y ratings poner enlaces
        Guest.findOne({mail:req.params.id},'rating',function(err,result){
            if(err){
                res.status(500).send({"error":true,"message":"Error retrieving data"});
            }
            else if(result==null){
                res.status(404).send({"error":true,"message":"User does not exists"});
            }
            else{
                res.send({"error":false,"message":result.rating});
            }

        });

    });

    //Acepta {"_id": id_del_poi}
    router.post("/:id/rating",function(req,res){

        var newRating = req.body;


        //Check if the POI exists
        var exists = true;

        //todo: mirar si existe el poi a puntuar
        if(!exists){
            res.status(404).send({"error":true,"message":"Poi to rate does not exists"});
            return;
        }


        Guest.findOne({mail:req.params.id},function(err,data){


            if(err){
                res.status(500).send({"error":true,"message":"Error adding rating"});
                return;
            }

            if(data==null){//The guest does not exists
                res.status(404).send({"error":true,"message":"The guest does not exists"});
                return;
            }


            var alreadyContained = false;
            for(var i = 0; !alreadyContained && i < data.rating.length; i++){
                console.log(i);
                if(data.rating[i].poi == newRating.poi){
                    alreadyContained = true;
                }
            }

            if(!alreadyContained){
                data.rating.push(newRating);
                data.save();
            }

            if(newRating.points>5 || newRating.points < 0){
                res.status(400).send({"error":true,"message":"Rating must be between 0 and 5"});
                return;
            }

            res.send({"error":false,"message":"Rating has been added"});



        });





    });


    router.delete("/:id/rating/:poi",function(req,res){

        var poiToDelete = req.params.poi;

        Guest.findOne({mail:req.params.id},function(err,data){


            if(err){
                res.status(500).send({"error":true,"message":"Error deleting rating"});
                return;

            }
            if(data==null){
                //The guest does not exists
                res.status(404).send({"error":true,"message":"The guest does not exists"});
                return;
            }


            var ratingExists = false;
            var indexToDelete = -1;
            for(var i = 0; !ratingExists && i < data.rating.length; i++){
                console.log(i);
                if(data.rating[i].poi == poiToDelete){

                    indexToDelete = i;
                    ratingExists = true;
                }
            }

            //No existe el poi en lista de ratings -> error
            if(!ratingExists){
                res.status(404).send({"error":true,"message":"Poi not found in rating list"});
            }
            else{
                data.rating.splice(indexToDelete,1);
                data.save();
                res.send({"error":false,"message":"PUntuacion borrada"});
            }


        });


    });


    router.put("/:id/rating/:poi",function(req,res){

        var updatedPoi = req.body;

        Guest.findOne({mail:req.params.id},function(err,data){


            if(err){
                res.status(500).send({"error":true,"message":"Error updating rating"});
                return;

            }
            if(data==null){
                //The guest does not exists
                res.status(404).send({"error":true,"message":"The guest does not exists"});
                return;
            }

            var ratingExists = false;
            var indexToUpdate = -1;
            for(var i = 0; !ratingExists && i < data.rating.length; i++){
                console.log(i);
                if(data.rating[i].poi == updatedPoi.poi){

                    indexToUpdate = i;
                    ratingExists = true;
                }
            }

            //No existe el poi en lista de ratings -> error
            if(!ratingExists){
                res.status(404).send({"error":true,"message":"Poi to update not found in rating list"});
            }
            else{
                data.rating[indexToUpdate]
                data.rating.splice(indexToUpdate,1);
                data.save();
                res.send({"error":false,"message":"PUntuacion borrada"});
            }


        });


    });




    //...

    return router;

};
