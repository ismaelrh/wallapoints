/**
 * Módulo de router que maneja las peticiones de user.
 */

var express = require('express');
var crypto = require('crypto');

module.exports = function(app){

    var router = express.Router({mergeParams: true});


    var Guest = app.models.Guest;


    function checkGuestExists(req,res,next){
        Guest.findOne({mail:req.params.guestMail},function(err,result){

            if(err){
                res.status(500).send({error:"true",message:"Error"});
                return;
            }
            if(result==null){
                res.status(404).send({error:"true",message:"Guest does not exist"});
                return;
            }

            req.guest = result;
            next(); //El guest existe -> Pasamos control al siguiente middleware

        });
    }

    //Este comprueba que existe el invitado al que se refiere
    //Se ejecuta antes que el resto de llamadas
    router.all('/', checkGuestExists);
    router.all('/:poiId', checkGuestExists);

    //Método GET / -> Devuelve un listado de todos los favoritos del usuario
    router.get("/",function(req,res){

        var guest = req.guest;

        res.status(200).send({error:"false",message:guest.returnFavListObjectWithLinks()});



    });

    //PUT / -> Inserta un favorito para el usuario
    //Basta con pasar en la ruta
    router.put("/:poiId",function(req,res){


        console.log(req.guest);
        if(!req.params.poiId){
            res.status(400).send({error:"true",message:"Please provide an object with a poi attribute"});
            return;
        }

        //Mirar si el poi realmente existe
        var poiExists = true; //todo -> poner de verdad

        var guest = req.guest;

        //Miramos si ya esta insertado
        var alreadyInserted = false;
        for(var i = 0; !alreadyInserted && i < guest.favourite.length; i++){
            if(guest.favourite[i]==req.params.poiId){
                alreadyInserted = true;
            }
        }

        if(!alreadyInserted){
            guest.favourite.push(req.params.poiId);
        }

        guest.save(function(err,response){
            if(err){
                res.status(500).send({error:"true",message:"Error while inserting favourite"});
                return;
            }
            else{
                res.status(200).send({error:"false",message:response.returnInsertedFavWithLink(req.params.poiId)});
                return;
            }
        });



    });

    //Método GET /:poiId -> Devuelve un favorito
    router.delete("/:poiId",function(req,res){

        var poi = req.params.poiId;
        var guest = req.guest;

        //Miramos si esta añadido como favorito
        var alreadyFav = false;
        var favIndex = -1;
        for(var i = 0; !alreadyFav && i < guest.favourite.length; i++){
            if(guest.favourite[i] == poi){
                alreadyFav = true;
                favIndex = i;
            }
        }

        if(alreadyFav){ //Si esta añadido, borramos
            guest.favourite.splice(favIndex,1);
            guest.save(function(err,saved){
                if(err){
                    res.status(500).send({error:"true",message:"Error while deleting favourite"});
                }
                else{
                    res.status(200).send({error:"false",message:saved.returnAllFavouriteObject()});
                }
            });

        }
        else{ //No existe -> 404
            res.status(404).send({error:"true",message:"Fav not found"});
        }


    });




    return router;

};
