/**
 * Módulo de router que maneja las peticiones de user.
 */

var express = require('express');
var crypto = require('crypto');

module.exports = function(app){

    var router = express.Router({mergeParams: true});


    var Favourite = app.models.Favourite;
    var Guest = app.models.Guest;

    //Este comprueba que existe el invitado al que se refiere
    //Se ejecuta antes que el resto de llamadas
    router.all('/', function (req, res, next) {


        Guest.findOne({mail:req.params.guestMail},function(err,result){

            if(err){
                res.status(500).send({error:"true",message:"Error"});
                return;
            }
            if(result==null){
                res.status(404).send({error:"true",message:"Guest does not exist"});
                return;
            }

            console.log("hey");
            next(); //El guest existe -> Pasamos control al siguiente middleware

        });

    });

    //Método GET / -> Devuelve un listado de todos los favoritos del usuario
    router.get("/",function(req,res){

        Favourite.find({mail:req.params.guestMail},function(err,result){

            if(err){
                res.status(500).send({error:"true",message:"Error"});
                return;
            }

            res.status(200).send({error:"false",message:result});

        });


    });

    //POST / -> Inserta un favorito para el usuario
    //Basta con pasar en el body el parametro "poi", lo demas se ignorara
    router.post("/",function(req,res){

        if(!req.body.poi){
            res.status(400).send({error:"true",message:"Please provide an object with a poi attribute"});
            return;
        }

        //Mirar si el poi realmente existe
        var poiExists = true; //todo -> poner de verdad

        var newFav = new Favourite({mail: req.params.guestMail});
        newFav.setPoi(req.body.poi); //Convierte de String a ObjectID el atributo poi

        newFav.insertIfUnique(function(err,saved){
            if(err){
                res.status(500).send({error:"true",message:"Error while saving fav into database " });
            }
            else{
                res.status(200).send({error:"false",message:saved});
            }

        });


    });

    //Método GET /:poiId -> Devuelve un favorito
    router.get("/:poiId",function(req,res){

        Favourite.findOne({mail:req.params.guestMail,poi:req.params.poiId},function(err,result){

            if(err){
                res.status(500).send({error:"true",message:"Error while retrieving favourite"});
                return;
            }
            if(result==null){
                res.status(404).send({error:"true",message:"Favourite not found"});
                return;
            }

            res.status(200).send({error:"false",message:result});

        });


    });

    //DELETE /:poiId -> Borra un favorito
    router.delete("/:poiId",function(req,res){

        Favourite.remove({mail:req.params.guestMail,poi:req.params.poiId},function(err,result){

            if(err){
                res.status(500).send({error:"true",message:"Error while deleting favourite"});
                return;
            }

            if(result.result.n == 0){
                res.status(404).send({error:"true",message:"Favourite not found"});
                return;
            }

            res.status(200).send({error:"false",message:"Favourite deleted"});

        });


    });

    //PUT /:poiId -> Actualiza un favorito
    //No tiene en cuenta el mail, solo cambia el atributo poi
    //¿Utilidad? Poca...
    router.put("/:poiId",function(req,res){

        //¿Tiene sentido actualizar? Si, actualizamos solo el POI, no el mail
        if(!req.body.poi){
            res.status(400).send({error:"true",message:"Please provide an object with a poi attribute"});
            return;
        }

        //Mirar si el poi realmente existe
        var poiExists = true; //todo -> poner de verdad

        //Obtener el objeto favorito



        Favourite.findOne({mail:req.params.guestMail,poi:req.params.poiId},function(err,result){

            if(err){
                res.status(500).send({error:"true",message:"Error while retrieving favourite"});
                return;
            }
            if(result==null){
                res.status(404).send({error:"true",message:"Favourite not found"});
                return;
            }

            result.poi = req.body.poi; //Actualizamos el poi con los datos pasados en el body
            result.save(function(err,saved){

                if(err){
                    res.status(500).send({error:"true",message:"Error while updating favourite" });
                }
                else{
                    res.status(200).send({error:"false",message:saved});
                }
            });


        });



    });



    return router;

};
