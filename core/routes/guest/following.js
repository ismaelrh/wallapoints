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
    router.all('/:username', checkGuestExists);

    //Método GET / -> Devuelve un listado de todos los followings
    router.get("/",function(req,res){

        var guest = req.guest;

        res.status(200).send({error:"false",message:guest.returnFollowingListObjectWithLinks()});



    });

    //PUT / -> Inserta un seguido para el usuario
    //Basta con pasar en la ruta
    router.put("/:username",function(req,res){


        console.log(req.guest);
        if(!req.params.username){
            res.status(400).send({error:"true",message:"Please provide an object with a username"});
            return;
        }

        //Mirar si el username realmente existe
        var usernameExists = true; //todo -> poner de verdad

        var guest = req.guest;

        //Miramos si ya esta insertado
        var alreadyInserted = false;
        for(var i = 0; !alreadyInserted && i < guest.favourite.length; i++){
            if(guest.following[i]==req.params.username){
                alreadyInserted = true;
            }
        }

        if(!alreadyInserted){
            guest.following.push(req.params.username);
        }

        guest.save(function(err,response){
            if(err){
                res.status(500).send({error:"true",message:"Error while inserting following"});
                return;
            }
            else{
                res.status(200).send({error:"false",message:response.returnInsertedFollowingWithLink(req.params.username)});
                return;
            }
        });



    });

    //Método GET /:poiId -> Devuelve un favorito
    router.delete("/:username",function(req,res){

        var username = req.params.username;
        var guest = req.guest;

        //Miramos si esta añadido como favorito
        var alreadyFollowing = false;
        var followingIndex = -1;
        for(var i = 0; !alreadyFollowing && i < guest.following.length; i++){
            if(guest.following[i] == username){
                alreadyFollowing = true;
                followingIndex = i;
            }
        }

        if(alreadyFollowing){ //Si esta añadido, borramos
            guest.following.splice(followingIndex,1);
            guest.save(function(err,saved){
                if(err){
                    res.status(500).send({error:"true",message:"Error while deleting following"});
                }
                else{
                    res.status(200).send({error:"true",message:saved.returnAllFollowingObject()});
                }
            });

        }
        else{ //No existe -> 404
            res.status(404).send({error:"true",message:"Following not found"});
        }


    });



    return router;

};
