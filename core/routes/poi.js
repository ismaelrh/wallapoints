/**
 * Módulo de router que maneja las peticiones de poi.
 */

var express = require('express');


module.exports = function(app){

    var router = express.Router();
    //Importamos el modelo de Poi
    var Poi = app.models.Poi;
    var userLoged = '';


    /* Método GET /poi, lista todos los poi */
    router.get("/",function(req,res){
        Poi.find({},function(err,results){
            if(err){
                res.status(500).send({"error":true,"message":"Error retrieving data"});
                }
            else{
                res.send({"error":false,"message":results});
                }
        });
    });

    /* Método Post /poi, crea un nuevo poi para el usuario logueado */
    router.post("/",function(req,res){
        // Se comprueba que sea el admin
        if (userLoged != null) {
            //Se comprueba que estén todos los campos
            if (req.body.name && req.body.description && req.body.multimediaUrl && req.body.lat && req.body.long && req.body.creator){

                var keywords = [];
                if(req.body.keywords){
                    keywords = req.body.keywords;
                }

                var newPoi = new Poi(
                    {
                        name: req.body.name,
                        description: req.body.description,
                        multimediaUrl: req.body.multimediaUrl,
                        keywords: keywords,
                        lat: req.body.lat,
                        long: req.body.long,
                        creator: req.body.creator
                    }
                );

                newPoi.save(function (err, result) {

                    if (err) {
                        res.send({"error": true, "message": "Error saving data"});
                    }
                    else {
                        //Se mostrará la contraseña en claro
                        res.send({"error": false, "message": result});
                    }
                });
            } else{
                res.status(400).send({"error":true,"message":"You have to fill all the parameters"});
            }

        } else{
            res.status(401).send({"error":true,"message":"You are not logged in"});
        }

    });

    /*Método DELETE /Poi/, se borra los poi de un usuario pasado por payload*/
    router.delete("/",function(req,res){
        /* cambiar a usuario por el admin  */
        if (userLoged == ''){
            if (req.body.creator){
                Poi.remove({creator:req.body.creator},function(err,results){

                    var result = results.toJSON();
                    if(err){
                        res.status(500).send({"error":true,"message":"Error deleting data"});
                        return;
                    }


                    if(result.n == 0){
                        /* No existe el usuario */
                        res.status(500).send({"error":true,"message":"The user don't have Pois "});
                        return;
                    }

                    res.send({"error":false,"message":"Pois deleted "+results});
                });
            }
            else{
                res.status(400).send({"error":true,"message":"You have to fill the creator"});
            }

            /* Si no es el propio usuario se deniega el acceso*/
        } else{
            res.status(500).send({"error":true,"message":"You are not the Admin, access denied"});
        }
    });

    /* Método GET /poi/:id, se devuelve la información de un usuario */
    router.get("/:id",function(req,res){
        Poi.findOne({_id:req.params.id},function(err,results){
            if(err){
                res.status(500).send({"error":true,"message":"Error retrieving data"});
            }
            else{
                if(res){
                    res.send({"error":false,"message":results});
                } else{
                    res.status(500).send({"error":true,"message ":"The poi does not exit"});
                }
            }
        });
    });

    /* Método PUT /poi/:id, se acutaliza la información de un poi
     * campos name, description, multimediaUrl, keywords, lat, logn y creator
     **/
    router.put("/:id",function(req,res){
        //cambiar en version con gestion de usuarios
        if (userLoged == '') {
            Poi.findOne({_id:req.params.id}, function (err, poi) {
                /* No hay error de la bd */
                if (!err) {

                    /* No hay error, el usuario existe, hay que actualizarlo */
                    if (req.body.name != undefined) {
                        /* Updatear name */
                        poi.name = req.body.name;
                    }
                    if (req.body.description != undefined) {
                        /* Updatear description */
                        poi.description = req.body.description;
                    }
                    if (req.body.multimediaUrl != undefined) {
                        /* Updatear multimediaUrl */
                        poi.multimediaUrl = req.body.multimediaUrl;
                    }
                    if (req.body.keywords != undefined) {
                        /* Updatear keywords */
                        poi.keywords = req.body.keywords;
                    }
                    if (req.body.lat != undefined) {
                        /* Updatear lat */
                        poi.lat = req.body.lat;
                    }
                    if (req.body.long != undefined) {
                        /* Updatear long */
                        poi.long = req.body.long;
                    }
                    if (req.body.creator != undefined) {
                        /* Updatear creator */
                        poi.creator = req.body.creator;
                    }

                    /* Updatear user*/
                    poi.save(function (err, result) {
                        if (err) {
                            res.send({"error": true, "message": "Error saving data"});
                        }
                        else {
                            res.send({"error": false, "message": result});
                        }
                    });
                }
                /* Error de la bd */
                else {
                    res.status(500).send({"error": true, "message": "Database error"});
                }
            });
        } else{
            res.status(500).send({"error":true,"message":"You are not the Admin, access denied"});
        }
    });

    /*Método DELETE /Poi/:id, se borra la información del poi*/
    router.delete("/:id",function(req,res){
        /* cambiar a usuario que creo el poi */
        if (userLoged == ''){
            Poi.remove({_id:req.params.id},function(err,results){

                var result = results.toJSON();
                if(err){
                    res.status(500).send({"error":true,"message":"Error deleting data"});
                    return;
                }


                if(result.n == 0){
                    /* No existe el usuario */
                    res.status(500).send({"error":true,"message":"The poi does not exit in the db "});
                    return;
                }

                res.send({"error":false,"message":"Poi deleted "+results});



            });
            /* Si no es el propio usuario se deniega el acceso*/
        } else{
            res.status(500).send({"error":true,"message":"You are not the Admin, access denied"});
        }
    });

    /* Método Post /search, crea el recurso search que se encarga de devoler una lista de pois
     * dependiendo de los parametros introducidos */
    router.post("/search",function(req,res){
            //Se comprueba que estén todos los campos
            if (req.body.date && req.body.creator){


                Poi.find({creator:req.body.creator,date:req.body.date},function(err,results){
                    if(err){
                        res.status(500).send({"error":true,"message":"Error retrieving data"});
                    }
                    else{
                        if(res){
                            res.send({"error":false,"message":results});
                        } else{
                            res.status(500).send({"error":true,"message ":"The poi does not exit"});
                        }
                    }
                });

            } else if (req.body.date){
                Poi.find({date:req.body.date},function(err,results){
                    if(err){
                        res.status(500).send({"error":true,"message":"Error retrieving data"});
                    }
                    else{
                        if(res){
                            res.send({"error":false,"message":results});
                        } else{
                            res.status(500).send({"error":true,"message ":"The poi does not exit"});
                        }
                    }
                });



            } else if (req.body.creator){
                Poi.find({creator:req.body.creator},function(err,results){
                    if(err){
                        res.status(500).send({"error":true,"message":"Error retrieving data"});
                    }
                    else{
                        if(res){
                            res.send({"error":false,"message":results});
                        } else{
                            res.status(500).send({"error":true,"message ":"The poi does not exit"});
                        }
                    }
                });
            }
            else{
                res.status(400).send({"error":true,"message":"You have to fill all the parameters"});
            }

    });


    return router;

};
