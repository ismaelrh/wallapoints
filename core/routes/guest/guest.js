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
        Guest.find({},'_id mail',function(err,results){
            if(err){
                res.send({"error":true,"message":"Error retrieving data"});
            }
            else{

                var finalArray = [];
                if(results.length == 0){
                    res.send({"error":false,"message":finalArray});
                    return;
                }

                results.forEach(function(i, idx, array){

                    finalArray.push(i.returnObjectWithLinksForList());
                    if (idx === array.length - 1){
                        res.send({"error":false,"message":finalArray});
                    }
                });


            }

        });

    });

    //Método POST / -> Nuevo invitado con mail y password (por lo menos)
    router.post("/",function(req,res){

        console.log(req.body);
        var newGuest = new Guest(req.body);


        if(newGuest.mail && newGuest.password){ //Datos necesarios provistos

            //Se calcula el hash
            newGuest.password = crypto.createHash('md5').update(newGuest.password).digest('hex');

            newGuest.save(function(err,result){

                if(err){
                    res.send({"error":true,"message":"Error saving data " + err});
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
        Guest.findOne({mail:req.params.id},'_id mail favs following ratings',function(err,result){
            if(err){
                res.status(500).send({"error":true,"message":"Error retrieving data"});
            }
            else if(result==null){
                res.status(404).send({"error":true,"message":"User does not exists"});
            }
            else{
                res.send({"error":false,"message":result.returnObjectWithLinksForDetail()});
            }

        });

    });







    //...

    return router;

};
