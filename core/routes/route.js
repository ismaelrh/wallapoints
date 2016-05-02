/**
 * Módulo de router que maneja las peticiones de user.
 */

var express = require('express');

module.exports = function(app){

    var router = express.Router({mergeParams: true});

    //Importamos el modelo de Userouter
    var Route = app.models.Route;
    var Poi =app.models.Poi;



    /**
     * GET /
     * Obtiene una lista de todos las routes disponibles, mostrando
     * su id, name  y enlaces a sus listas de pois
     * Acceso: todos
     */
    router.get("/", function (req, res) {


        Route.find({}, 'id name', function (err, results) {

            if (err) {
                res.send({"error": true, "message": "Error retrieving data"});
                return;
            }

            var finalArray = [];

            if (results.length == 0) { //Devolver array vacío
                res.send({"error": false, "message": finalArray});
                return;
            }

            //Se construye la lista a devolver, añadiendo enlaces
            results.forEach(function (i, idx, array) {

                finalArray.push(i.cleanRouteForList());
                if (idx === array.length - 1) {
                    res.send(
                        {
                            "error": false,
                            "message": finalArray
                        });
                }
            });


        });

    });

    /**
     * POST /
     * Nueva route a partir de un nombre y una lista de pois
     * Autentificacion user
     */
    router.post("/", function (req, res) {

        console.log(req.user);

        if(req.user.type != "user"){
            res.status(403).send({"error": true, "message": "Forbidden. You are not authorized."});
            return;
        }


        //Se comprueba que estén todos los campos
        if (!req.body.name || !req.body.pois) {
            res.status(400).send({
                "error": true,
                "message": "Parameters name, pois[]"
            });
            return;
        }



        checkValidPoisId(req.body.pois,function(callback){
            if(!callback){
                res.status(400).send({
                    "error": true,
                    "message": "Bad array pois[]"
                });
                return;
            }
        });


        var newRoute = new Route(
            {
                name: req.body.name,
                creator: req.user.username,
                pois: req.body.pois
            }
        );


            newRoute.save(function (err, result) {

                if (err) {
                    res.send({"error": true, "message": "Error saving data " + err});
                    console.error(err);
                }
                else {
                    res.send({
                        error: false,
                        message: result.cleanRouteForList(),
                        links: [{guestList: "/routes/"}]
                    });
                }
            });

        }
    );

    /* Actualiza una ruta si existe con el name y la lista de pois
     * pasados en el payload
     */
    router.put("/:_id", function (req, res) {




        Route.findOne({_id: req.params._id})
            .populate('pois')
            .exec(function (err, result){

                if (err) {
                    res.status(500).send({"error": true, "message": "Error retrieving data"});
                    return;
                }
                else if (result == null || result == undefined) {
                    res.status(404).send({"error": true, "message": "Route does not exists"});
                    return;
                }

                //Si no es admin o no es el creador -> Error
                if( !(
                    (req.user.type == "user" && req.user.username == result.creator) ||
                    (req.user.type == "user" && req.user.username == "admin"))
                )
                {
                    res.status(403).send({"error": true, "message": "Forbidden. You are not authorized."});
                    return;
                }

                if (req.body.name) {
                    result.name = req.body.name;
                }

                if (req.body.pois) {
                    checkValidPoisId(req.body.pois,function(callback){
                        if(!callback){
                            res.status(400).send({
                                "error": true,
                                "message": "Bad array pois[]"
                            });
                            return;
                        }
                    });

                    result.pois = req.body.pois;
                }

                result.save(function (err, result) {

                    if (err) {
                        res.status(500).send({"error": true, "message": "Error saving data " + err});
                        console.error(err);
                    }
                    else {
                        res.send({
                            error: false,
                            message: result.cleanRouteForList(),
                            links: [{guestList: "/routes/"}]
                        });
                    }
                });

            });
    });


    /**
     * GET /:id
     * Devuelve los detalles de la route, id, name y lista pois
     * links.guestList = enlace a lista de invitados
     * Acceso = admin o propio invitado
     */
    router.get("/:_id", function (req, res) {


        Route.findOne({_id: req.params._id})
            .populate('pois')
            .exec(function(err,result){
                if (err) {
                    res.status(500).send({"error": true, "message": "Error retrieving data"});
                }
                else if (result == null) {
                    res.status(404).send({"error": true, "message": "Route does not exists"});
                }
                else {

                    var finalArray = [];
                    if(result.pois.length==0 ){
                        res.send(
                            {
                                error: false,
                                message: [],
                                links: [{guestInfo: "/routes/"}]
                            });
                        return;
                    }
                    result.pois.forEach(function (i, idx, array) {

                        finalArray.push({_id: i._id, name: i.name, lat: i.lat, long: i.long, href: "/pois/" + i._id});
                        if (idx === array.length - 1) {
                            res.send(
                                {
                                    error: false,
                                    message: result.cleanRouteForDetail(finalArray),
                                    links: [{guestInfo: "/routes/"}]
                                });
                        }
                    });
                }

            });

    });


    /**
     * DELETE /:id
     * Borra una route.
     * Acceso = admin o propio invitado
     */
    router.delete("/:_id", function (req, res) {

        Route.findOne({_id:req.params.id},function(err,result){


            if(err){
                res.status(500).send({"error": true, "message": "Error deleting guest"});
                return;
            }
            if(result==null){
                res.status(404).send({"error": true, "message": "The route does not exist in the db "});
                return;
            }

            Route.remove({_id: req.params._id}, function (err, result) {


                if (err) {
                    res.status(500).send({"error": true, "message": "Error deleting guest"});
                    return;
                }

                //Si no es admin o no es el creador -> Error
                if( !(
                    (req.user.type == "user" && req.user.username == result.creator) ||
                    (req.user.type == "user" && req.user.username == "admin"))
                )
                {
                    res.status(403).send({"error": true, "message": "Forbidden. You are not authorized."});
                    return;
                }


                res.status(200).send({
                    error: false,
                    message: "The route has been deleted",
                    links: [{guestList: "/routes/"}]
                });


            });
        });



    });

    /**
     * POST /search
     * Crea recurso 'search' que se encarga de devolver una lista de Routes según
     * objeto de búsqueda
     * pois: lista de ids de pois. De esta forma, se devolverán rutas que pasen por alguno de los pois.
     * creator: creador.
     * Se aplica AND a las condiciones
     */
    router.post("/search", function (req, res) {

        var searchObject = {};


        if(req.body.creator){
            searchObject.creator = req.body.creator;
        }

        if(req.body.pois){
            var poisList = req.body.pois;
            searchObject.pois = {$in: poisList};

        }


        var query = Route.find( searchObject ,{_id:1,name:1} );


        query.exec( function (err, results) {


            if (err) {
                res.status(500).send({"error": true, "message": "Error searching Routes " + err});
                return;
            }


            if (results.length == 0) { //Si array vacio -> no se realiza transformación
                res.status(200).send({
                    error: false,
                    message: results
                });
            }
            else {

                var finalArray = [];
                results.forEach(function (i, idx, array) {

                    finalArray.push(i.cleanRouteForList());

                    if (idx === array.length - 1) {
                        res.send(
                            {
                                error: false,
                                message: finalArray
                            });
                    }
                });
            }
        });
    });


    /* Funcion que comprueba una lista de pois */
    function checkValidPoisId(pois, callback){
        var correct = true;
        pois.forEach(function (i, idx, array){
            var contador = array.length;
            Poi.findOne({_id: i._id},function(err,result){

                if(err){
                    correct = false;
                }
                if(!result){
                    correct =false;
                }

                if (contador-idx ==0){
                   callback(correct);
                }
            });

        });

    }

    return router;

};

