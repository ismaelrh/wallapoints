/**
 * Módulo de router que maneja las peticiones de ratings
 */

var express = require('express');


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

                console.log("Checking for " + req.params.id);
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
     * Para cada POI, devuelve el _id, name, lat y long. (Datos básicos para mostrarlo).
     */
    router.get("/", function (req, res) {
        // req.poi.creator ya tiene el creador por el metodo checkPoiExists


        // si el usuario que accede no es el creador del poi o admin forbidden
        if(req.user.type != "user" || req.user.username != "admin" || req.user.username != req.poi.creator){
            res.status(403).send({"error": true, "message": "Forbidden. You are not authorized."});
            return;
        }

        Rating.find(req.params.id, "mail points", function (err, results) {
            if (err) {
                res.status(500).send({"error": true, "message": "Error retrieving poi list"});
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





    return router;

};
