/**
 * Módulo de router que maneja las peticiones de ratings
 */

var express = require('express');


module.exports = function (app) {

    var router = express.Router({mergeParams: true});

    var Poi = app.models.Poi;


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





    return router;

};
