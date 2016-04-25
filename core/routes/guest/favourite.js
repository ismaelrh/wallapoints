/**
 * Módulo de router que maneja los pois favoritos de un invitado.
 */
var express = require('express');


module.exports = function(app){

    var router = express.Router({mergeParams: true});


    var Guest = app.models.Guest;
    var Poi = app.models.Poi;

    /**
     * Comprueba que existe el "guest" al que se refieren las llamadas de este módulo.
     * Se ejecutará antes que el resto de llamadas, descartándolas si no existe o
     * sucede algún error.
     * Además, mete en req.guest el objeto de guest con los favoritos poblados.
     * Comprueba también que el acceso es admin o el propio invitado.
     */
    function checkGuestExists(req,res,next){

        if( !(
            (req.user.type == "guest" && req.user.mail == req.params.mail) ||
            (req.user.type == "user" && req.user.username == "admin"))
        )
        {
            res.status(403).send({"error": true, "message": "Forbidden. You are not authorized."});
            return;
        }


        Guest.findOne({mail:req.params.guestMail})
            .populate('favourite')
            .exec(function(err,result){

            if(err){
                res.status(500).send({error:true,message:"Error"});
                return;
            }
            if(result==null){
                res.status(404).send({error:true,message:"Guest does not exist"});
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
     * Devuelve un array de los pois favoritos del usuario. Incluye _id, name y un href al recurso completo.
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
        else{


            var finalArray = [];
            guest.favourite.forEach(function (i, idx, array) {

                finalArray.push({id: i._id, name: i.name, lat: i.lat, long: i.long, href: "/pois/" + i._id});
                if (idx === array.length - 1) {
                    res.send(
                        {
                             error: false,
                             message: finalArray,
                             links: [{guestInfo: "/guests/" + guest.mail}]
                        });
                }
            });

        }


    });



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
        Poi.findOne({_id:req.params.poiId},function(err,result){

            if(err){
                res.status(500).send({error:"true",message:"Error while inserting favourite " + err});
                return;
            }

            if(!result){
                res.status(404).send({error:"true",message:"No such poi"});
                return;
            }

            var guest = req.guest;

            //Miramos si ya está marcado como favorito
            var alreadyInserted = false;
            for(var i = 0; !alreadyInserted && i < guest.favourite.length; i++){
                if(guest.favourite[i]._id==req.params.poiId){
                    alreadyInserted = true;
                }
            }

            if(!alreadyInserted){
                guest.favourite.push(result._id);
            }

            guest.save(function(err,response){
                if(err){
                    res.status(500).send({error:"true",message:"Error while inserting favourite " + err});
                    return;
                }
                else{

                    res.status(200).send({error:"false",
                        message:{_id:result._id,name:result.name,lat: result.lat, long: result.long, href: "/poi/" + result._id},
                        links: [{favouriteList: "/guests/" + guest.mail + "/favs"}]});
                    return;
                }
            });


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
            if(guest.favourite[i]._id == poi){
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
                        links: [{favouriteList: "/guests/" + guest.mail + "/favs"}]});
                }
            });

        }
        else{ //No existe -> 404
            res.status(404).send({error:"true",message:"Fav not found"});
        }


    });




    return router;

};
