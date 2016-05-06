/**
 * Módulo de router que maneja las estadísticas de rutas de usuarios.
 */

var express = require('express');
var Q = require("q");


//Empieza en /stats/users/:username/pois

module.exports = function (app) {

    var Poi = app.models.Poi;
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


        Poi.count({creator: username, elevation: {$gte: 0}})
            .then(function(result){

                var count = 0;
                if(result){
                    count = result;
                }

                res.status(200).send({
                    error: "false",
                    message: {count:count},
                    links:generateRouteStatsLinks(username)
                });


            })
            .catch(function(exception){
                res.status(500).send({"error": true, "message": "Error obtaining number of valid pois " + exception});
                return;
            })

    });


    /**
     * GET /stats/users/:username/routes/avgElevation
     * Devuelve la elevación  media de todos los puntos del usuario.
     * Objeto {avgElevation: altura en metros, count: total de pois con elevation}
     *
     */
    router.get("/avgElevation", function (req, res) {


        var username = req.params.username;

        Poi.aggregate(
            {
                $match: {creator: username} //Todo: match
            },
            {
                $group: {
                    "_id": null,
                    avgElevation: {$avg: "$elevation"},
                    count: {$sum:1}
                }
            },
            function (err, response) {

                if (err) {
                    res.status(500).send({"error": true, "message": "Error obtaining average poi elevation"});
                    return;
                }
                if (!response ||response.length == 0) {
                    res.status(404).send({"error": true, "message": "No avgElevation stats for user " + username});
                    return;
                }
                res.status(200).send({
                    error: "false",
                    message: {avgPoiElevation: response[0].avgElevation,count:response[0].count},
                    links:generateRouteStatsLinks(username)
                });

            });

    });

    /**
     * Devuelve el poi con mayor elevation de el usuario indicado.
     * Devuelve objeto de Poi.
     */
    router.get("/maxElevation", function (req, res) {


        var username = req.params.username;

        Poi
            .findOne({creator: username, elevation: {$gt: 0}})
            .sort('-elevation')  //Máxima altitud
            .exec(function (err, response) {


                if (err ) {
                    res.status(500).send({"error": true, "message": "Error obtaining max elevation route"});
                    return;
                }

                if (!response ||response.length == 0) {
                    res.status(404).send({"error": true, "message": "No max elevation stats for user " + username});
                    return;
                }
                res.status(200).send({
                    error: "false",
                    message: response.cleanObjectForStats(),
                    links:generateRouteStatsLinks(username)
                });


            });

    });

    /**
     * Devuelve el poi con menor elevación edl usuario indicado.
     * Devuelve objeto de poi.
     */
    router.get("/minElevation", function (req, res) {


        var username = req.params.username;

        Poi
            .findOne({creator: username, elevation: {$gt: 0}})
            .sort('elevation')  //Mínima altitud
            .exec(function (err, response) {


                if (err ) {
                    res.status(500).send({"error": true, "message": "Error obtaining min elevation route"});
                    return;
                }

                if (!response ||response.length == 0) {
                    res.status(404).send({"error": true, "message": "No minElevation stats for user " + username});
                    return;
                }

                res.status(200).send({
                    error: "false",
                    message: response.cleanObjectForStats(),
                    links:generateRouteStatsLinks(username)

                });


            });

    });


    /**
     * Devuelve el número de pois agrupados por ciudades
     * Devuelve objeto con  {data: [X,Y,Z,..], labels: [X',Y',Z'...]} preparado para Chart.js
     */
    router.get("/groupedByCity", function (req, res) {
        var username = req.params.username;
        Poi.aggregate(
            {   //agrega los valores de fecha mayores de today
                $match: {creator:username, city: {'$ne' : 'unknown'}}
            },
            { $group: {
                _id: "$city",
                count: {$sum: 1}
            }}
            ,function (err, result) {
                if (err) {
                    console.error(err);
                    res.status(500).send({"error": true, "message": "Error obtaining cities grouped"});
                    return;
                }
                else {

                    //var message = procesarPois(pois);
                    var data = [];
                    var labels = [];
                    for (var i = 0; i < result.length; i++) {
                        labels.push(result[i]._id);
                        data.push(result[i].count);
                    }
                    res.status(200).send({
                        error: "false",
                        message: {data: data, labels: labels,links:generateRouteStatsLinks(username)}
                    });
                }
            });
    });


    /**
     * Devuelve el número de pois creadas por el usuario agrupados por paises
     * Devuelve objeto con  {data: [X,Y,Z,..], labels: [X',Y',Z'...]} preparado para Chart.js
     */
    router.get("/groupedByCountry", function (req, res) {
        var username = req.params.username;

        Poi.aggregate(
            {   //agrega los valores de fecha mayores de today
                $match: {creator:username,city: {'$ne' : 'unknown'}}
            },
            { $group: {
                _id: "$country",
                count: {$sum: 1}
            }}
            ,function (err, result) {
                if (err) {
                    console.error(err);
                    res.status(500).send({"error": true, "message": "Error obtaining countries grouped"});
                    return;
                }
                else {

                    //var message = procesarPois(pois);
                    var data = [];
                    var labels = [];
                    for (var i = 0; i < result.length; i++) {
                        labels.push(result[i]._id);
                        data.push(result[i].count);
                    }
                    res.status(200).send({
                        error: "false",
                        message: {data: data, labels: labels,links:generateRouteStatsLinks(username)}
                    });
                }
            });
    });


    function generateRouteStatsLinks(username){
        return [
            {"validPoisCount": "/stats/users/" + username + "/pois/validCount"},
            {"averagePoiElevation": "/stats/users/" + username + "/pois/avgElevation"},
            {"maxElevationPoi": "/stats/users/" + username + "/pois/maxElevation"},
            {"minElevationPoi": "/stats/users/" + username + "/pois/minElevation"},
            {"groupedByCity": "/stats/users/" + username + "/pois/groupedByCity"},
            {"groupedByCountry": "/stats/users/" + username + "/pois/groupedByCountry"}
        ];
    }

    return router;

};


