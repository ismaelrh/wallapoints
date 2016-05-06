/**
 * Módulo de router que maneja las estadísticas de rutas de usuarios.
 */

var express = require('express');
var Q = require("q");


//Empieza en /stats/users/:username/pois

module.exports = function (app) {

    var User = app.models.User;

    var router = express.Router({mergeParams: true});


    /**
     * Comprueba antes de cada petición que el usuario al que se refieren las estadísticas
     * existe, y que es el logueado (o admin).
     */
    function checkUserExistsAndIsLoged(req,res,next){

        User.findOne({username:req.params.username})
            .exec(function(err,result){

                if(err){
                    res.status(500).send({error:true,message:"Error"});
                    return;
                }
                if(result==null){
                    res.status(404).send({error:true,message:"User does not exist"});
                    return;
                }

                if( !(
                    (req.user.type == "user" && req.user.username == req.params.username) ||
                    (req.user.type == "user" && req.user.username == "admin"))
                )
                {
                    res.status(403).send({"error": true, "message": "Forbidden. You are not authorized."});
                    return;
                }


                next(); //El guest existe -> Pasamos control al siguiente middleware

            });
    }

    router.all('/*', checkUserExistsAndIsLoged);

    //Pícale David


    return router;

};


