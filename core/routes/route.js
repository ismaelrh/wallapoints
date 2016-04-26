/**
 * Módulo de router que maneja las peticiones de user.
 */

var express = require('express');

module.exports = function(app){

    var router = express.Router();

    //Importamos el modelo de Userouter
    var User = app.models.Route;
    var Poi =app.models.Poi;
    var userLoged = "";

    /* Método GET /route, lista con todas las rutas del sistema */
    router.get("/",function(req,res){


        User.find({})
            .populate('pois')
            .exec(function(err,result){

                if(err){
                    res.status(500).send({error:true,message:"Error"});
                    return;
                }

                result.forEach(function ( i, idx, array)
                    resut.pois.forEach((i, idx, array)){

                }


                req.guest = result;
                next(); //El guest existe -> Pasamos control al siguiente middleware

            });

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




        User.find({},function(err,results){
            if(err){
                res.status(500).send({"error":true,"message":"Error retrieving data"});
            }
            else{
                res.send({"error":false,"message":results});
            }
        });

    });

    /* Método POST /route, se define una ruta nueva
     * Se deberá utilizar teniendo como input:
     * - name (nombre de la ruta)
     * - Opcionalmente se puede definir una lista de pois pois []
     * El creador no se define, se obtiene automáticamente a raiz de la cookie
     * */
    router.post("/",function(req,res){
        // Se comprueba que sea un usuario registrado
        // if (userLoged) {
            //Se comprueba que estén todos los campos

            if (req.body.name){
                var poisArray = [];
                //Si se ha definido lista de pois
                if (req.body.pois){
                    if (checkValidPoisId(req.body.pois)){
                        poisArray=req.body.pois;

                    }else{
                        res.status(400).send({"error":true,"message":"The pois do not exist!"});
                        return;
                    }

                }
                var newRoute = new Route(
                    {
                        name: req.body.name,

                        // Se obtiene el creator de la cookie
                        creator: req.user.username,
                        pois: poisArray
                    }
                );

                newRoute.save(function (err, result) {

                    if (err) {
                        res.send({"error": true, "message": "Error saving data "+err});
                    }
                    else {
                        res.send({"error": false, "message": result});
                    }
                });
            } else{
                res.status(400).send({"error":true,"message":"You have to fill all the parameters"});
            }

        //} else{
        //  res.status(401).send({"error":true,"message":"You are not a loged user, log in in the system"});
        //}

    });

    function checkValidPoisId(pois,callback){
        var correct = true;
        pois.forEach(function(value){
            var contador = pois.length;
            Poi.findOne({_id:value},function(err,result){

                if(err){
                    correct = false;
                }
                if(result==null){
                    correct =false;
                }
                contador--;
                if (contador ==0){
                    result(correct)
                }
            });

        });

    }

    return router;

};

