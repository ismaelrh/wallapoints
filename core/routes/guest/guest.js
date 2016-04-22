/**
 * Módulo de router que maneja las peticiones de user.
 */

var express = require('express');
var crypto = require('crypto');

module.exports = function (app) {

    var router = express.Router();

    //Importamos el modelo de Guest
    var Guest = app.models.Guest;


    /**
     * GET /
     * Obtiene una lista de todos los invitados disponibles, mostrando
     * su mail y enlaces a sus listas de favoritos, usuarios que sigue y
     * puntuaciones que ha puesto.
     */
    router.get("/", function (req, res) {


        Guest.find({}, 'mail', function (err, results) {

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

                finalArray.push(i.returnObjectWithLinksForList());
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
     * Nuevo invitado a partir de un mail y password.
     * El mail debe ser único.
     * links.guestList = enlace a lista de guests
     */
    router.post("/", function (req, res) {

        console.log(req.body);
        var newGuest = new Guest(req.body);


        if (newGuest.mail && newGuest.password) { //Datos necesarios provistos

            //Se calcula el hash
            newGuest.password = crypto.createHash('md5').update(newGuest.password).digest('hex');

            newGuest.save(function (err, result) {

                if (err) {
                    res.send({"error": true, "message": "Error saving data " + err});
                    console.error(err);
                }
                else {
                    res.send({
                        error: false,
                        message: result,
                        links: [{guestList: "/guests/"}]
                    });
                }
            });

        }
        else { //No provistos

            res.status(400).send({"error": true, "message": "Bad request, please provide mail and password"});

        }

    });


    /**
     * GET /:id
     * Devuelve los detalles (mail y enlaces a favoritos, usuarios que sigue y puntuaciones)
     * de un invitado.
     * links.guestList = enlace a lista de invitados
     */
    router.get("/:id", function (req, res) {


        Guest.findOne({mail: req.params.id}, 'mail', function (err, result) {
            if (err) {
                res.status(500).send({"error": true, "message": "Error retrieving data"});
            }
            else if (result == null) {
                res.status(404).send({"error": true, "message": "User does not exists"});
            }
            else {
                res.send({
                    error: false,
                    message: result.returnObjectWithLinksForDetail(),
                    links: [{guestList: "/guests/"}]
                });
            }

        });

    });



    return router;

};
