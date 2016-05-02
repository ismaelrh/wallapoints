/**
 * Módulo de router que maneja las peticiones de poi.
 */

var express = require('express');
var GoogleMapsAPI = require('googlemaps');
var publicConfig = {
    key: 'AIzaSyBUPexZRNdGWU0u151pYbdPKK4Ib8DPZCA',
    stagger_time:       1000, // for elevationPath
    encode_polylines:   false,
    secure:             true, // use https
};
var gmAPI = new GoogleMapsAPI(publicConfig);



module.exports = function (app) {

    var router = express.Router();

    var Poi = app.models.Poi;


    /**
     * GET /
     * Devuelve una lista de todos los POI.
     * Para cada POI, devuelve el _id, name, lat y long. (Datos básicos para mostrarlo).
     */
    router.get("/", function (req, res) {
        Poi.find({}, "_id name lat long", function (err, results) {
            if (err) {
                res.status(500).send({"error": true, "message": "Error retrieving poi list"});
            }
            else {
                if (results.length == 0) { //Si array vacio -> no se realiza transformación
                    res.status(200).send({
                        error: "false",
                        message: results
                    });
                }
                else {

                    var finalArray = [];
                    results.forEach(function (i, idx, array) {

                        finalArray.push(i.cleanObjectAndAddHref());

                        if (idx === array.length - 1) {
                            res.send(
                                {
                                    error: false,
                                    message: finalArray
                                });
                        }
                    });

                }

            }
        });
    });


    /**
     * POST /
     * Crea un nuevo POI para el usuario logueado.
     *
     */
    router.post("/", function (req, res) {

        if(req.user.type=="guest"){
            res.status(403).send({"error": true, "message": "Forbidden. You are not authorized."});
        }


        var creator = req.user.username;


        //Se comprueba que estén todos los campos (multimediaUrl es opcional)

        if (!req.body.name || !req.body.description || !req.body.lat || !req.body.long) {
            res.status(400).send({
                "error": true,
                "message": "You have to fill all the parameters: name, description, lat & long are mandatory"
            });
            return;
        }

        // reverse geocode API
        var reverseGeocodeParams = {
            "latlng":        req.body.lat+","+req.body.long,
            "result_type":   "postal_code",
            "language":      "en",
            "location_type": "APPROXIMATE"
        };

        // Realiza una petición al API Google Maps Geocoding para obtener la direccion
        gmAPI.reverseGeocode(reverseGeocodeParams, function(err, result){
            var formatted_address = 'unknown';
            if (result != undefined){
                formatted_address = result.results[0].formatted_address;
            }

            var keywords = [];
            if (req.body.keywords) {
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
                    formatted_address: formatted_address,
                    creator: creator
                }
            );

            newPoi.save(function (err, result) {

                if (err) {
                    res.send({"error": true, "message": "Error saving data"});
                }
                else {
                    res.send({
                        "error": false,
                        "message": result.cleanObjectAndAddHref(),
                        links: [{"poiList": "/pois"}]
                    });
                }
            });
        });
    });


    /**
     * DELETE /
     * Borra los poi de un usuario pasado por payload {"creator": "fulanito"}.
     */
    router.delete("/", function (req, res) {




        if (!req.body.creator) {
            res.status(400).send({"error": true, "message": "You have to fill the creator parameter"});
            return;
        }

        if( !(
            (req.user.type == "user" && req.user.username == req.body.creator) ||
            (req.user.type == "user" && req.user.username == "admin"))
        )
        {
            res.status(403).send({"error": true, "message": "Forbidden. You are not authorized."});
            return;
        }



        Poi.remove({creator: req.body.creator}, function (err, results) {


            if (err) {
                res.status(500).send({"error": true, "message": "Error deleting data"});
                return;
            }

            if (results.result.n == 0) {
                res.status(500).send({"error": true, "message": "The user doesn't have Pois "});
                return;
            }

            res.send({
                "error": false,
                "message": "Pois deleted successfully",
                links: [{"poiList": "/pois"}]
            });

        });


    });


    /**
     * GET /:id
     * Devuelve información completa de un POI concreto.
     * Links.poiList -> lista de pois
     */
    router.get("/:id", function (req, res) {

        Poi.findOne({_id: req.params.id}, function (err, result) {
            if (err) {
                res.status(500).send({"error": true, "message": "Error retrieving data"});
                return;
            }

            if (!result) {
                res.status(404).send({"error": true, "message ": "The poi does not exist"});
                return;
            }

            res.send({
                "error": false,
                "message": result.cleanObjectAndAddHref(),
                links: [{"poiList": "/pois"}]
            });

        });
    });


    /**
     * PUT /:id
     * Actualiza los campos name, description, multimediaUrl, keywords, lat y long de un poi.
     * Links.poiList -> lista de pois
     */
    router.put("/:id", function (req, res) {



        Poi.findOne({_id: req.params.id}, function (err, poi) {


            if (err) {
                res.status(500).send({"error": true, "message": "Error retrieving poi to update"});
                return;
            }

            if( !(
                (req.user.type == "user" && req.user.username == poi.creator) ||
                (req.user.type == "user" && req.user.username == "admin"))
            )
            {
                res.status(403).send({"error": true, "message": "Forbidden. You are not authorized."});
                return;
            }

            if (req.body.name) {
                poi.name = req.body.name;
            }
            if (req.body.description) {
                poi.description = req.body.description;
            }
            if (req.body.multimediaUrl) {
                poi.multimediaUrl = req.body.multimediaUrl;
            }
            if (req.body.keywords) {
                poi.keywords = req.body.keywords;
            }
            if (req.body.lat) {
                poi.lat = req.body.lat;
            }
            if (req.body.long) {
                poi.long = req.body.long;
            }

            poi.save(function (err, result) {
                if (err) {
                    res.send({"error": true, "message": "Error updating poi"});
                }
                else {
                    res.send({
                        "error": false,
                        "message": result.cleanObjectAndAddHref(),
                        links: [{"poiList": "/pois"}]
                    });
                }
            });

        });

    });


    /**
     * DELETE /:id
     * Borra un poi (sólo puede borrarlo el usuario creador y admin). Lo quita también de favoritos
     * y de las rutas.
     * Links.poiList -> lista de pois
     */
    router.delete("/:id", function (req, res) {




        Poi.findOne({_id:req.params.id},function(err,poi){

            if (err) {
                res.status(500).send({"error": true, "message": "Error deleting poi"});
                return;
            }

            if(poi==null){
                res.status(404).send({"error": true, "message": "The poi does not exist in the db"});
            }


            if( !(
                (req.user.type == "user" && req.user.username == poi.creator) ||
                (req.user.type == "user" && req.user.username == "admin"))
            )
            {
                res.status(403).send({"error": true, "message": "Forbidden. You are not authorized."});
                return;
            }

            Poi.remove({_id: req.params.id}, function (err, result) {


                if (err) {
                    res.status(500).send({"error": true, "message": "Error deleting poi"});
                    return;
                }


                res.send({"error": false,
                    "message": "Poi deleted successfully",
                    links: [{"poiList": "/pois"}]
                });


            });

        });





    });


    /**
     * POST /search
     * Crea recurso 'search' que se encarga de devolver una lista de POIs dependiendo
     * de los parámetros de búsqueda introducidos
     */
    router.post("/search", function (req, res) {

        var searchObject = {};
        if(req.body.date){
            var date = new Date(req.body.date);
            searchObject.date = req.body.date;
            var month = date.getUTCMonth(); //months from 1-12
            var day = date.getUTCDate() +1;
            var year = date.getUTCFullYear();

            var start = new Date(year,month,day,0,0,0,0);
            var end = new Date(year,month,day+1,23,59,59,99);


            console.log("Searching for " + new Date(year,month,day));
            searchObject.date = {"$gte": new Date(year,month,day,0,0,0), "$lte": new Date(year,month,day,23,59,59)};
            //Extraemos dia, año y mes
        }

        if(req.body.creator){
            searchObject.creator = req.body.creator;
        }

        if(req.body.keywords && req.body.keywords.length > 0){
            searchObject.keywords = {$all: req.body.keywords}
        }


        Poi.find(searchObject,"_id name lat long", function (err, results) {


            if (err) {
                res.status(500).send({"error": true, "message": "Error searching POIs"});
                return;
            }


            if (results.length == 0) { //Si array vacio -> no se realiza transformación
                res.status(200).send({
                    error: "false",
                    message: results
                });
            }
            else {

                var finalArray = [];
                results.forEach(function (i, idx, array) {

                    finalArray.push(i.cleanObjectAndAddHref());

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


    return router;

};
