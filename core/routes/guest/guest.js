/**
 * Módulo de router que maneja las peticiones de guest.
 * @author Ismael Rodríguez, Sergio Soro, David Vergara. 2016.
 */

var express = require('express');
var crypto = require('crypto');
var jwt = require('jsonwebtoken');


module.exports = function (app) {

    var router = express.Router();

    var Guest = app.models.Guest;


    /**
     * GET /
     * Obtiene una lista de todos los invitados disponibles, mostrando
     * su mail y enlaces a sus listas de favoritos, usuarios que sigue y
     * puntuaciones que ha puesto.
     * Acceso: user admin
     */
    router.get("/", function (req, res) {


        if(req.user.type != "user" || req.user.username != "admin"){
            res.status(403).send({"error": true, "message": "Forbidden. You are not authorized."});
            return;
        }


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

            //Se mira si ya existía
            Guest.findOne({mail:newGuest.mail},function(err,response){

                if (err) {
                    res.status(500).send({"error": true, "message": "Error checking guest existence"});
                    return;
                }

                if(response!=null){
                    res.status(400).send({"error": true, "message": "Mail already registered"});
                    return;
                }

                newGuest.save(function (err, result) {

                    if (err) {

                        res.status(500).send({"error": true, "message": "Error registering guest" });
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

            });



        }
    )
    ;


    /**
     * GET /:id
     * Devuelve los detalles (mail y enlaces a favoritos, usuarios que sigue y puntuaciones)
     * de un invitado.
     * links.guestList = enlace a lista de invitados
     * Acceso = admin o propio invitado
     */
    router.get("/:mail", function (req, res) {

        //Cuando NO se es el propio invitado o admin -> error
        if( !(
                (req.user.type == "guest" && req.user.mail == req.params.mail) ||
                (req.user.type == "user" && req.user.username == "admin"))
            )
        {
            res.status(403).send({"error": true, "message": "Forbidden. You are not authorized."});
            return;
        }


        Guest.findOne({mail: req.params.mail}, 'mail', function (err, result) {
            if (err) {
                res.status(500).send({"error": true, "message": "Error retrieving data"});
            }
            else if (result == null) {
                res.status(404).send({"error": true, "message": "Guest does not exists"});
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
     * Acceso = admin o propio invitado
     */
    router.put("/:mail", function (req, res) {


        if( !(
            (req.user.type == "guest" && req.user.mail == req.params.mail) ||
            (req.user.type == "user" && req.user.username == "admin"))
        )
        {
            res.status(403).send({"error": true, "message": "Forbidden. You are not authorized."});
            return;
        }

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
     * Acceso = admin o propio invitado
     */
    router.delete("/:mail", function (req, res) {

        if( !(
            (req.user.type == "guest" && req.user.mail == req.params.mail) ||
            (req.user.type == "user" && req.user.username == "admin"))
        )
        {
            res.status(403).send({"error": true, "message": "Forbidden. You are not authorized."});
            return;
        }

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
                error: false,
                message: "The guest has been deleted",
                links: [{guestList: "/guests/"}]
            });


        });
    });


    /* Método Post /users/login, intenta loguear a un usuario en el sistema y devuelve un JSON web token en caso
     * de que se pueda realizar el logueo
     **/
    router.post("/login", function (req, res) {


        if (!req.body.mail || !req.body.password) {
            res.status(400).send({"error": true, "message ": "Not a correct body, insert mail and password"});
            return;
        }

        /*Se encripta la contraseña para compararla con la almacenada*/
        var passHash = crypto.createHash('md5').update(req.body.password).digest('hex');

        /* Se busca el usuario y se devuelve la password en caso de que exista*/
        Guest.findOne({mail: req.body.mail}, function (err, result) {

            if(err){
                res.status(500).send({"error": true, "message": "Error retrieving guests data "});
                return;
            }


            if (result) {
                if (passHash == result.password) {
                    /* Log in correcto */

                    var guestObject = result.cleanGuestForList();
                    guestObject.type = "guest";
                    delete guestObject.password;

                    /*Se genera token de sesion, guardando dentro info de usuario */
                    var token = jwt.sign(guestObject, app.get('jwtsecret'), {
                            expiresIn: "99h"
                        } // expires in 1 hour
                    );

                    // Se actualiza la ultima fecha de acceso
                    result.lastAccessDate = new Date();
                    // Se guarda en la db
                    result.save();

                    res.send({
                        "error": false,
                        "message": token,
                        "links": [
                            {"poiList":"/pois"}
                        ]});
                } else {
                    res.status(401).send({"error": true, "message": "Incorrect mail or password"});
                }

            } else {
                res.status(404).send({"error": true, "message ": "The guest does not exist"});
            }

        });


    });

    return router;

}
;
