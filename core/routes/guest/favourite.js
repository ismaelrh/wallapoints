/**
 * Módulo de router que maneja los pois favoritos de un invitado.
 */
var express = require('express');


module.exports = function(app){

    var router = express.Router({mergeParams: true});


    var Guest = app.models.Guest;

    /**
     * Comprueba que existe el "guest" al que se refieren las llamadas de este módulo.
     * Se ejecutará antes que el resto de llamadas, descartándolas si no existe o
     * sucede algún error.
     */
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

    router.all('/', checkGuestExists);
    router.all('/:poiId', checkGuestExists);


    /**
     * GET /
     * Devuelve un array de los identificadores de los pois favoritos del usuario.
     * links.guestInfo -> Enlace a todos los favoritos de dicho invitado.
     */
    router.get("/",function(req,res){

        var guest = req.guest;

        if(guest.favourite.length==0){ //Si array vacio -> no se realiza transformación
            res.status(200).send({
                error:"false",
                message:guest.favourite,
                links: [{guestInfo: "/guests/" + guest.mail}]
            });
        }
        else{ //Si no vacío -> Obtener el título de cada POI -> ¿POR HTTP?

            var finalArray = [];
            guest.favourite.forEach(function (i, idx, array) {

                finalArray.push({id: i, title: "Por hacer", href: "/poi/" + i});
                if (idx === array.length - 1) {
                    res.send(
                        {
                            "error": false,
                            "message": finalArray
                        });
                }
            });

        }


    });

    //PUT / -> Inserta un favorito para el usuario
    //Basta con pasar en la ruta

    /**
     * PUT /:poiId
     * Inserta como favorito el poi con id :poiId para el invitado actual.
     */
    router.put("/:poiId",function(req,res){


        if(!req.params.poiId){
            res.status(400).send({error:"true",message:"Please provide a poiId parameter"});
            return;
        }

        //Mirar si el poi realmente existe
        var poiExists = true; //todo -> poner de verdad

        var guest = req.guest;

        //Miramos si ya está marcado como favorito
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
                res.status(200).send({error:"false",
                    message:response.favourite,
                    links: [{favouriteList: "/guests/" + guest.mail + "/favourite"}]});
                return;
            }
        });



    });


    /**
     * DELETE /:poiId
     * Desmarca como favorito del invitado actual el poi con id :poiId
     */
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
                    res.status(200).send({error:"false",
                        message:"Poi deleted from fav list",
                        links: [{favouriteList: "/guests/" + guest.mail + "/favourite"}]});
                }
            });

        }
        else{ //No existe -> 404
            res.status(404).send({error:"true",message:"Fav not found"});
        }


    });




    return router;

};
