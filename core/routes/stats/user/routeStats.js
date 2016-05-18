/**
 * Módulo de router que maneja las estadísticas de rutas de usuarios.
 * @author Ismael Rodríguez, Sergio Soro, David Vergara. 2016.
 */

var express = require('express');
var Q = require("q");


//Empieza en /stats/users/:username/routes

module.exports = function (app) {

    var Route = app.models.Route;
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


    router.get("/validCount",function(req,res){

        var username = req.params.username;


        Route.count({creator: username, distance: {$gte: 0}, time: {$gte: 0}})
            .then(function(result){

                var count = 0;
                if(result){
                    count = result;
                }

                res.status(200).send({
                    error: "false",
                    message: {count:count},
                    links: generateRouteStatsLinks(username)
                });


            })
            .catch(function(exception){
                res.status(500).send({"error": true, "message": "Error obtaining number of valid routes " + exception});
                return;
            })

    });

    /**
     * GET /stats/users/:username/routes/avgDistance
     * Devuelve la distancia media de todas las rutas del usuario.
     * Objeto {avgDistance: distancia en metros, count: total de pois con distancias}
     *
     */
    router.get("/avgDistance", function (req, res) {


        var username = req.params.username;

        Route.aggregate(
            {
                $match: {creator: username} //Todo: match
            },
            {
                $group: {
                    "_id": null,
                    avgDistance: {$avg: "$distance"},
                    count: {$sum:1}
                }
            },
            function (err, response) {

                if (err) {
                    res.status(500).send({"error": true, "message": "Error obtaining mean route distance"});
                    return;
                }
                if (!response || response.length == 0) {
                    res.status(404).send({"error": true, "message": "No avgRoute stats for user " + username});
                    return;
                }
                res.status(200).send({
                    error: "false",
                    message: {avgDistance: response[0].avgDistance,count:response[0].count},
                    links: generateRouteStatsLinks(username)
                });

            });

    });

    /**
     * GET /stats/users/:username/routes/avgTime
     * Devuelve el tiempo medio de todas las rutas del usuario.
     * Objeto {avgTime: distancia en metros, count: total de pois con distancias}
     *
     */
    router.get("/avgTime", function (req, res) {


        var username = req.params.username;

        Route.aggregate(
            {
                $match: {creator: username} //Todo: match
            },
            {
                $group: {
                    "_id": null,
                    avgTime: {$avg: "$time"},
                    count: {$sum:1}
                }
            },
            function (err, response) {

                if (err) {
                    res.status(500).send({"error": true, "message": "Error obtaining average route time"});
                    return;
                }
                if (!response ||response.length == 0) {
                    res.status(404).send({"error": true, "message": "No avgRoute stats for user " + username});
                    return;
                }
                res.status(200).send({
                    error: "false",
                    message: {avgTime: response[0].avgTime,count:response[0].count},
                    links: generateRouteStatsLinks(username)
                });

            });

    });

    /**
     * Devuelve la ruta con mayor distancia creada por el usuario indicado.
     * Devuelve objeto de ruta.
     */
    router.get("/maxDistance", function (req, res) {


        var username = req.params.username;

        Route
            .findOne({creator: username, distance: {$gt: 0}})
            .populate('pois')
            .sort('-distance')  //Máxima distancia
            .exec(function (err, response) {


                if (err ) {
                    res.status(500).send({"error": true, "message": "Error obtaining max distance route"});
                    return;
                }

                if (!response ||response.length == 0) {
                    res.status(404).send({"error": true, "message": "No maxDistanceRoute stats for user " + username});
                    return;
                }

                res.status(200).send({
                    error: "false",
                    message: response.cleanRouteForStats(),
                    links: generateRouteStatsLinks(username)
                });


            });


    });


    /**
     * Devuelve la ruta con mayor tiempo en coche creada por el usuario indicado.
     * Devuelve objeto de ruta.
     */
    router.get("/maxTime", function (req, res) {


        var username = req.params.username;

        Route
            .findOne({creator: username, time: {$gt: 0}})
            .populate('pois')
            .sort('-time')  //Máxima distancia
            .exec(function (err, response) {


                if (err ) {
                    res.status(500).send({"error": true, "message": "Error obtaining max time route"});
                    return;
                }

                if (!response ||response.length == 0) {
                    res.status(404).send({"error": true, "message": "No max time route stats for user " + username});
                    return;
                }

                res.status(200).send({
                    error: "false",
                    message: response.cleanRouteForStats(),
                    links: generateRouteStatsLinks(username)
                });


            });


    });
    /**
     * Devuelve la ruta con menor distancia creada por el usuario indicado.
     * Devuelve objeto de ruta.
     */
    router.get("/minDistance", function (req, res) {


        var username = req.params.username;

        Route
            .findOne({creator: username, distance: {$gt: 0}})
            .populate('pois')
            .sort('distance')  //Mínima distancia
            .exec(function (err, response) {


                if (err ) {
                    res.status(500).send({"error": true, "message": "Error obtaining min distance route "});
                    return;
                }

                if (!response ||response.length == 0) {
                    res.status(404).send({"error": true, "message": "No minDistanceRoute stats for user " + username});
                    return;
                }

                res.status(200).send({
                    error: "false",
                    message: response.cleanRouteForStats(),
                    links: generateRouteStatsLinks(username)
                });


            });

    });

    /**
     * Devuelve la ruta con menor tiempo en coche creada por el usuario indicado.
     * Devuelve objeto de ruta.
     */
    router.get("/minTime", function (req, res) {


        var username = req.params.username;

        Route
            .findOne({creator: username, time: {$gt: 0}})
            .populate('pois')
            .sort('time')  //Mínima distancia
            .exec(function (err, response) {


                if (err ) {
                    res.status(500).send({"error": true, "message": "Error obtaining min time route"});
                    return;
                }

                if (!response ||response.length == 0) {
                    res.status(404).send({"error": true, "message": "No minTimeRoute stats for user " + username});
                    return;
                }

                res.status(200).send({
                    error: false,
                    message: response.cleanRouteForStats(),
                    links: generateRouteStatsLinks(username)
                });


            });

    });

    /**
     * Devuelve el número de rutas creadas por el usuario agrupados por distintos rangos de longitud.
     * Devuelve objeto con  {data: [X,Y,Z,..], labels: [X',Y',Z'...]} preparado para Chart.js
     */
    router.get("/groupedByDistance", function (req, res) {


        var username = req.params.username;

        // menos de 1km, entre 1-10 km, entre 10-100km, entre 100-1000km, más de 1000km
        var ranges = [[0, 1000], [1001, 10000], [10001, 100000], [100001, 1000000], [1000001, -1]];


        var promiseArray = []; //Array de promises para poder realizar acción cuando terminen todas las consultas

        //Se hacen consultas de cuentas para cada uno de estos
        ranges.forEach(function (range) {


            if (range[1] == -1) {
                var promise = Route.count({creator: username, distance: {$gte: range[0]}});
            }
            else {
                var promise = Route.count({creator: username, distance: {$gte: range[0], $lte: range[1]}});
            }

            promiseArray.push(promise);

        });

        Q.all(promiseArray)
            .then(function (results) {
                var data = results;
                var labels = ["< 1Km", "1-10km", "10-100km", "100-1000km", ">1000km"];

                res.status(200).send({
                    error: "false",
                    message: {data: data, labels: labels},
                    links: generateRouteStatsLinks(username)
                });

            })
            .catch(function (exception) {
                console.error(exception);
                res.status(500).send({"error": true, "message": "Error obtaining grouped by distance route"});
                return;
            });


    });

    /**
     * Devuelve el número de rutas creadas por el usuario agrupados por distintos rangos de tiempo.
     * Devuelve objeto con  {data: [X,Y,Z,..], labels: [X',Y',Z'...]} preparado para Chart.js
     */
    router.get("/groupedByTime", function (req, res) {


        var username = req.params.username;

        // menos de 15 minutos, entre 15min-1h, entre 1h-5h, entre 5h-10h, entre 10h-24h, más de 1 dia
        var ranges = [[0, 900], [901, 3600], [3601, 18000], [18001, 36000], [36001, 86400], [86401, -1]];


        var promiseArray = []; //Array de promises para poder realizar acción cuando terminen todas las consultas

        //Se hacen consultas de cuentas para cada uno de estos
        ranges.forEach(function (range) {

            if (range[1] == -1) {
                var promise = Route.count({creator: username, time: {$gte: range[0]}});
            }
            else {
                var promise = Route.count({creator: username, time: {$gte: range[0], $lte: range[1]}});
            }


            promiseArray.push(promise);

        });

        Q.all(promiseArray)
            .then(function (results) {
                var data = results;
                var labels = ["< 15 min", "15min-1h", "1-5h", "5-10h", "10-24h", "> 1 day"];

                res.status(200).send({
                    error: false,
                    message: {data: data, labels: labels},
                    links: generateRouteStatsLinks(username)
                });

            })
            .catch(function (exception) {
                console.error(exception);
                res.status(500).send({"error": true, "message": "Error obtaining grouped by time route"});
                return;
            });


    });

    function generateRouteStatsLinks(username){
        return [
            {"validRoutesCount": "/stats/users/" + username + "/routes/validCount"},
            {"averageRoutesDistance": "/stats/users/" + username + "/routes/avgDistance"},
            {"maxDistanceRoute": "/stats/users/" + username + "/routes/maxDistance"},
            {"minDistanceRoute": "/stats/users/" + username + "/routes/minDistance"},
            {"averageRoutesTime": "/stats/users/" + username + "/routes/avgTime"},
            {"maxTimeRoute": "/stats/users/" + username + "/routes/maxTime"},
            {"minTimeRoute": "/stats/users/" + username + "/routes/minTime"},
            {"groupedByDistance": "/stats/users/" + username + "/routes/groupedByDistance"},
            {"groupedByTime": "/stats/users/" + username + "/routes/groupedByTime"}
        ];
    }


    return router;

};


