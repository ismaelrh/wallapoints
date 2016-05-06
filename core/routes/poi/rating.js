/**
 * Módulo de router que maneja las peticiones de ratings
 */

var express = require('express');
var ObjectID = require('mongodb').ObjectID;


module.exports = function (app) {

    var router = express.Router({mergeParams: true});

    var Poi = app.models.Poi;
    var Rating = app.models.Rating;


    /**
     * Comprueba que existe el "poi" al que se refieren las llamadas de este módulo.
     * Se ejecutará antes que el resto de llamadas, descartándolas si no existe o
     * sucede algún error.
     */
    function checkPoiExists(req, res, next) {

        Poi.findOne({_id: req.params.id})
            .exec(function (err, result) {


                if (err) {
                    res.status(500).send({error: true, message: "Error " + err});
                    return;
                }
                if (result == null) {
                    res.status(404).send({error: true, message: "Poi does not exist"});
                    return;
                }


                req.poi = result; //En los demas metodos tenemos disponible el objeto req.poi, ya cargado.
                next(); //El guest existe -> Pasamos control al siguiente middleware

            });
    }


    //Para que la función anterior se ejecute antes de todo
    router.all('/', checkPoiExists);
    router.all('/:guestMail', checkPoiExists);

    /**
     * GET /
     * Devuelve una lista de todos los rating de un Poi.
     * Para cada Rating, devuelve el mail y pois.
     */
    router.get("/", function (req, res) {
        // req.poi.creator ya tiene el creador por el metodo checkPoiExists


        // si el usuario que accede no es el creador del poi o admin forbidden
        if((req.user.type == "user" && req.user.username != req.poi.creator) || (req.user.type == "user" && req.user.name != "admin")){
            res.status(403).send({"error": true, "message": "Forbidden. You are not authorized."});
            return;
        }

        Rating.find(req.params.id, "mail points", function (err, results) {
            if (err) {
                res.status(500).send({"error": true, "message": "Error retrieving rating list"});
            }
            else {
                res.status(200).send({
                    error: "false",
                    message: results,
                    links: [{"poiInfo": "/poi/:"+req.params.id}]
                });
            }
        });
    });

    /**
     * POST /
     * Inserta un rating de un poi que se pasa por parametro como id
     * Devuelve el rating insertado o error y un link de los ratings del poi.
     */
    router.post("/", function (req, res) {


        // si el usuario que accede no es el creador del poi o admin forbidden
        if(req.user.type != "guest"){
            res.status(403).send({"error": true, "message": "Forbidden. You are not authorized."});
            return;
        }

        //Se comprueba que estén todos los campos y que sean correctos
        if (!req.body.rating) {
            res.status(400).send({
                "error": true,
                "message": "You have to fill all the parameters: rating is mandatory"
            });
            return;
        }

        //Se comprueba que rating este entre 0 y 5
        if (req.body.rating < 0 || req.body.rating > 5) {
            res.status(400).send({
                "error": true,
                "message": "Rating must be between 0 and 5"
            });
            return;
        }

        var rating = new Rating (
        {
            mail: req.user.mail,
            poi: req.params.id,
            points: req.body.rating
        }
        );


        rating.save(function (err, results) {
            if (err) {
                res.send({"error": true, "message": "Error saving data"});
            }
            else {
                res.send({
                    "error": false,
                    "message": results,
                    links: [{"ratingList": "/pois/"+req.params.id+ "/ratings"}]
                });
            }
        });
    });

    /**
     * Get /mean
     * Devuelve la media de la puntuación de un poi
     */
    router.get("/mean", function (req, res) {
        // req.poi.creator ya tiene el creador por el metodo checkPoiExists


        var oid = new ObjectID(req.params.id);

        Rating.aggregate(
            {
                $match: {poi: oid}
            },
            { $group: {
                _id: '$poi',
                pointsAvg: { $avg: '$points'}
            }}
        ,function (err, results) {
            if (err) {

                res.send({"error": true, "message": "Error getting mean"});
            }
            else {
                var message = {_id: 'undefinec',pointsAvg: 0};
                if(results[0] != undefined){
                    message = results[0];
                }
                res.status(200).send({
                    error: "false",
                    message: message,
                    links: [{"poiInfo": "/poi/:"+req.params.id}]
                });
            }
        });

    });

    /**
     * GET /:guestMail
     * Devuelve información sobre rating de un invitado a ese poi si este es el creador del mismo.
     */
    router.get("/:guestMail", function (req, res) {
        // req.poi.creator ya tiene el creador por el metodo checkPoiExists



        // si el usuario que accede no es guest o no es el creador del rating o no es admin forbidden
        if((req.user.type == "guest" && (req.user.mail != req.params.guestMail)) || (req.user.type == "user" && req.user.name != "admin")){
            res.status(403).send({"error": true, "message": "Forbidden. You are not authorized."});
            return;
        }

        Rating.findOne({poi: req.params.id, mail: req.params.guestMail}, "mail points", function (err, results) {
            if (err) {
                res.status(500).send({"error": true, "message": "Error retrieving poi list"});
            }
            else if(results == null){
                res.status(404).send({
                    error: "true",
                    message: "Undefined Ratings for this poi",
                    links: [{"ratingList": "/pois/"+req.params.id+ "/ratings"}]
                });
            }
            else{
                res.status(200).send({
                    error: "false",
                    message: results,
                    links: [{"ratingList": "/pois/"+req.params.id+ "/ratings"}]
                });
            }
        });
    });

    /**
     * Put /:guestMail
     * Modifica point del rating del guest logueado del poi con :id
     */
    router.put("/:guestMail", function (req, res) {
        // req.poi.creator ya tiene el creador por el metodo checkPoiExists



        // si el usuario que accede no es guest o no es el creador del rating o no es admin forbidden
        if((req.user.type == "guest" && (req.user.mail != req.params.guestMail)) || (req.user.type == "user" && req.user.name != "admin")){
            res.status(403).send({"error": true, "message": "Forbidden. You are not authorized."});
            return;
        }
        // parametro point necesario
        if (!req.body.rating) {
            res.status(400).send({
                "error": true,
                "message": "You have to fill new rating"
            });
            return;
        }

        Rating.findOne({poi: req.params.id}, function (err, rating) {

            if (err) {
                res.status(500).send({"error": true, "message": "Error retrieving poi to update"});
                return;
            }

            if (req.body.rating) {
                rating.points = req.body.rating;
            }

            rating.save(function (err, results) {
                if (err) {
                    res.send({"error": true, "message": "Error updating rating"});
                }
                else {

                    res.status(200).send({
                        error: "false",
                        message: results.cleanRatingForList(),
                        links: [{"ratingList": "/pois/"+req.params.id+ "/ratings"}]
                    });
                }
            });

        });
    });

    /**
     * Delete /:guestMail
     * Borra el rating de un invitado sobre un poi.
     */
    router.delete("/:guestMail", function (req, res) {
        // req.poi.creator ya tiene el creador por el metodo checkPoiExists



        // si el usuario que accede no es guest o no es el creador del rating o no es admin forbidden
        if((req.user.type == "guest" && (req.user.mail != req.params.guestMail)) || (req.user.type == "user" && req.user.name != "admin")){
            res.status(403).send({"error": true, "message": "Forbidden. You are not authorized."});
            return;
        }

        Rating.remove({poi: req.params.id}, function (err, result) {

            if (err) {
                res.status(500).send({"error": true, "message": "Error deleting poi"});
                return;
            }

            if (result.result.n == 0) {
                res.status(500).send({"error": true, "message": "The Rating does not exist in the db"});
                return;
            }

            res.send({"error": false,
                "message": "Rating deleted successfully",
                links: [{"ratingList": "/pois/"+req.params.id+ "/ratings"}]
            });


        });
    });



    return router;

};
