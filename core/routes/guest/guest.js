/**
 * Módulo de router que maneja las peticiones de guest.
 */

var express = require('express');
var crypto = require('crypto');

module.exports = function (app) {

    var router = express.Router();

    var Guest = app.models.Guest;


    /**
     * GET /
     * Obtiene una lista de todos los invitados disponibles, mostrando
     * su mail y enlaces a sus listas de favoritos, usuarios que sigue y
     * puntuaciones que ha puesto.
     */
    router.get("/", function (req, res) {

        console.log(req.user);

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

                finalArray.push(i.cleanGuestForList());
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


            var newGuest = new Guest(req.body);

            if (!newGuest.mail || !newGuest.password) {
                res.status(400).send({"error": true, "message": "Bad request, please provide mail and password"});
                return;
            }


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
                        message: result.cleanGuestForDetail(),
                        links: [{guestList: "/guests/"}]
                    });
                }
            });

        }
    )
    ;


    /**
     * GET /:id
     * Devuelve los detalles (mail y enlaces a favoritos, usuarios que sigue y puntuaciones)
     * de un invitado.
     * links.guestList = enlace a lista de invitados
     */
    router.get("/:mail", function (req, res) {


        Guest.findOne({mail: req.params.mail}, 'mail', function (err, result) {
            if (err) {
                res.status(500).send({"error": true, "message": "Error retrieving data"});
            }
            else if (result == null) {
                res.status(404).send({"error": true, "message": "User does not exists"});
            }
            else {
                res.send({
                    error: false,
                    message: result.cleanGuestForDetail(),
                    links: [{guestList: "/guests/"}]
                });
            }

        });

    });

    /**
     * PUT /:id
     * Actualiza el password de un invitado.
     * Links.guestList -> Lista de invitados
     */
    router.put("/:mail", function (req, res) {

        Guest.findOne({mail: req.params.mail}, 'mail', function (err, result) {
            if (err) {
                res.status(500).send({"error": true, "message": "Error updating guest"});
                return;
            }
            if (result == null) {
                res.status(404).send({"error": true, "message": "Guest does not exists"});
                return;
            }


            /*if(req.body.mail){
                result.mail = req.body.mail;
            }*/

            if(req.body.password){
                result.password = crypto.createHash('md5').update(req.body.password).digest('hex');
            }


            result.save(function (err, updatedGuest) {
                if (err) {
                    res.status(500).send({"error": true, "message": "Error updating guest"});
                    return;
                }
                res.send({
                    error: false,
                    message: updatedGuest.cleanGuestForDetail(),
                    links: [{guestList: "/guests/"}]
                });

            });


        });

    });


    /**
     * DELETE /:id
     * Borra un invitado.
     * Links.guestList -> Lista de invitados
     */
    router.delete("/:mail", function (req, res) {

        Guest.remove({mail: req.params.mail}, function (err, result) {


            if (err) {
                res.status(500).send({"error": true, "message": "Error deleting guest"});
                return;
            }


            if (result.result.n == 0) {
                /* No existe el invitado */
                res.status(500).send({"error": true, "message": "The guest does not exist in the db "});
                return;
            }
            res.status(200).send({
                error: "false",
                message: "The guest has been deleted",
                links: [{guestList: "/guests/"}]
            });


        });
    });

    return router;

}
;