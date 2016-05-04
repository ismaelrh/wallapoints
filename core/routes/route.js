/**
 * Módulo de router que maneja las peticiones de user.
 */

var express = require('express');
var GoogleMapsAPI = require('googlemaps');
var publicConfig = {
    key: 'AIzaSyD6pa36NtjEyNdffeAwWJFY44k_C4z2lh8',
    stagger_time: 1000, // for elevationPath
    encode_polylines: false,
    secure: true
};
var Q = require("q");

var gmAPI = new GoogleMapsAPI(publicConfig);

module.exports = function (app) {

    var router = express.Router({mergeParams: true});

    //Importamos el modelo de Userouter
    var Route = app.models.Route;
    var Poi = app.models.Poi;





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

            if (req.user.type != "user") {
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


            //Se obtienen todos los puntos. Si hay error en alguno, se devolverá 400.
            getCompletePois(req.body.pois)
                .then(function (response) {
                    //Se han obtenido todos los pois correctamente -> existen

                    var newRoute = new Route(
                        {
                            name: req.body.name,
                            creator: req.user.username,
                            pois: req.body.pois
                        }
                    );

                    //Se guarda la ruta en la BD, se devuelve resultado al usuario y tras ello
                    //se calculan datos de distancia y tiempo para guardar en estadísticas
                    newRoute.save(function (err, result) {

                        if (err) {
                            res.send({"error": true, "message": "Error saving data " + err});
                            return;
                        }

                        res.send({
                            error: false,
                            message: result.cleanRouteForDetail(),
                            links: [{guestList: "/routes/"}]
                        });

                        //Se calculan las distancias y se guarda en la BD para las estadísticas
                        calcularDistanciaRuta(response)
                            .then(function (distanceResults) {

                                newRoute.distance = distanceResults.distance;
                                newRoute.time = distanceResults.time;

                                newRoute.save();

                            })
                            .catch(function (error) {
                                //Ruta imposible -> No se puede calcular distancias ni tiemops
                            });


                    });


                })
                .catch(function (error) {
                    //Error al obtener todos los pois, puede que alguno no exista.
                    res.status(400).send({
                        "error": true,
                        "message": "Bad array pois[]"
                    });
                    return;
                });




        }
    );

    /* Actualiza una ruta si existe con el name y la lista de pois
     * pasados en el payload.
     * Además, guarda tras contestar la distancia y tiempo total, según Google Maps.
     */
    router.put("/:_id", function (req, res) {


        Route.findOne({_id: req.params._id})
            .populate('pois')
            .exec(function (err, result) {

                if (err) {
                    res.status(500).send({"error": true, "message": "Error retrieving data"});
                    return;
                }
                else if (result == null || result == undefined) {
                    res.status(404).send({"error": true, "message": "Route does not exists"});
                    return;
                }

                //Si no es admin o no es el creador -> Error
                if (!(
                    (req.user.type == "user" && req.user.username == result.creator) ||
                    (req.user.type == "user" && req.user.username == "admin"))
                ) {
                    res.status(403).send({"error": true, "message": "Forbidden. You are not authorized."});
                    return;
                }

                if (req.body.name) {
                    result.name = req.body.name;
                }

                var poisChanged = false;
                if (req.body.pois) {
                    poisChanged = true;
                    result.pois = req.body.pois;
                }

                if(poisChanged){
                    var promise = getCompletePois(result.pois);
                }
                else{
                    //Ya tenemos los pois completos
                    var promise = Q(result.pois);
                }

                //Comprobamos que los pois existan, cogiendo sus detalles completos (o no si ya los hemos obtenido)
                promise
                    .then(function(completePois){

                        //Se actualiza y se vuelven a calcular las distancias y tiempos
                        result.save(function (err, saveResult) {

                            if (err) {
                                res.status(500).send({"error": true, "message": "Error saving data " + err});
                                console.error(err);
                                return;
                            }

                            res.send({
                                error: false,
                                message: saveResult.cleanRouteForDetail(),
                                links: [{guestList: "/routes/"}]
                            });

                            //Se calculan las distancias y se guarda en la BD para las estadísticas TRAS CONTESTAR
                            if(poisChanged){
                                calcularDistanciaRuta(completePois)
                                    .then(function (distanceResults) {

                                        result.distance = distanceResults.distance;
                                        result.time = distanceResults.time;

                                        console.log("Saved distance " + result.distance + " and time " + result.time);
                                        result.save();

                                    })
                                    .catch(function (error) {
                                        //Ruta imposible -> No se puede calcular distancias ni tiemops
                                    });
                            }


                        });


                    })
                    .catch(function(exception){
                        console.log(exception);
                        res.status(400).send({
                            "error": true,
                            "message": "Bad array pois[]"
                        });
                        return;
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
            .exec(function (err, result) {
                if (err) {
                    res.status(500).send({"error": true, "message": "Error retrieving data"});
                }
                else if (result == null) {
                    res.status(404).send({"error": true, "message": "Route does not exists"});
                }
                else {

                    var finalArray = [];
                    res.send(
                        {
                            error: false,
                            message: result.cleanRouteForDetail(),
                            links: [{guestInfo: "/routes/"}]
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

        Route.findOne({_id: req.params.id}, function (err, result) {


            if (err) {
                res.status(500).send({"error": true, "message": "Error deleting guest"});
                return;
            }
            if (result == null) {
                res.status(404).send({"error": true, "message": "The route does not exist in the db "});
                return;
            }

            Route.remove({_id: req.params._id}, function (err, result) {


                if (err) {
                    res.status(500).send({"error": true, "message": "Error deleting guest"});
                    return;
                }

                //Si no es admin o no es el creador -> Error
                if (!(
                    (req.user.type == "user" && req.user.username == result.creator) ||
                    (req.user.type == "user" && req.user.username == "admin"))
                ) {
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


        if (req.body.creator) {
            searchObject.creator = req.body.creator;
        }

        if (req.body.pois) {
            var poisList = req.body.pois;
            searchObject.pois = {$in: poisList};

        }


        var query = Route.find(searchObject, {_id: 1, name: 1});


        query.exec(function (err, results) {


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


    /** Función que, dada una lista de objetos con _id,
     * obtiene de la base de datos todos los objetos completos.
     * Devuelve promesas. Si éxito, habrá un array con todos los resultados
     * */
    function getCompletePois(pois) {
        var deferred = Q.defer();
        var promiseArray = [];
        for (var i = 0; i < pois.length; i++) {
            var currentPoi = pois[i];
            var promise = Poi.findOne({_id: currentPoi._id});
            promiseArray.push(promise);
        }

        Q.all(promiseArray).then(function (result) {
                var hasError = false;
                for (var j = 0; j < result.length; j++) {
                    if (!result[j]) {
                        hasError = false;
                    }
                }
                if (hasError) {
                    deferred.reject("Poi does not exists");
                }
                else {
                    deferred.resolve(result);
                }

            })
            .catch(function (error) {
                deferred.reject(error);
            });

        return deferred.promise;


    }

    /**
     * Convierte la llamada a gmAPI en una promesa.
     */
    function distanceCall(params) {
        var deferred = Q.defer();
        gmAPI.distance(params, function (err, data) {
            if (err) deferred.reject(err); 
            else deferred.resolve(data);
        });
        return deferred.promise;
    }

    /**
     * Calcula la distancia de una ruta completa, pasando por todos sus puntos,
     * tanto en tiempo como en distancia.
     * Devuelve una promesa con objeto con atributos "distance" (en km) y "time" (en segundos).
     * En caso de fallo, devuelve una promesa fallida con un mensaje de error.
     */
    function calcularDistanciaRuta(pois) {


        var deferred = Q.defer();
        if (pois.length <= 1) {
            return 0;
        }


        var promisesArray = [];
        for (var i = 0; i < pois.length - 1; i++) {

            var origenActual = pois[i];
            var destinoActual = pois[i + 1];

            console.log(origenActual);
            var params = {
                origins: origenActual.lat + "," + origenActual.long,
                destinations: destinoActual.lat + "," + destinoActual.long
            };

            //var distance = Q.denodeify(gmAPI.distance(params));
            promisesArray.push(distanceCall(params));

        }

        Q.all(promisesArray)
            .then(function (response) {

                var allDistancesCanBeCalculated = true;
                var totalDistance = 0;
                var totalTime = 0;
                for (var i = 0; allDistancesCanBeCalculated && i < response.length; i++) {
                    var elems = response[i].rows[0].elements[0];
                    if (elems.status != 'OK') {
                        console.log(elems);
                        allDistancesCanBeCalculated = false;
                    }
                    else {
                        totalDistance += elems.distance.value;
                        totalTime += elems.duration.value;
                    }

                }
                if (allDistancesCanBeCalculated) {
                    deferred.resolve({distance: totalDistance, time: totalTime});
                }
                else {
                    deferred.reject("Distance can not be calculated");
                }


            })
            .catch(function (error) {

                deferred.reject("Distance can not be calculated");
            });

        return deferred.promise;

    }

    return router;

};

