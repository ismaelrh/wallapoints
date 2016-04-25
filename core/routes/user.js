/**
 * Módulo de router que maneja las peticiones de user.
 */

var express = require('express');
var randomstring = require('randomstring');
var crypto = require('crypto');
var jwt = require('jsonwebtoken');

module.exports = function (app) {

    var router = express.Router();


    var User = app.models.User;
    var DeletedUser = app.models.DeletedUser;


    /**
     * GET /
     * Lista con todos los usuarios del sistema. Devuelve username, email y href a detalle.
     * Sólo accesible por admin
     */
    router.get("/", function (req, res) {

        User.find({}, 'username email', function (err, results) {

            if (err) {
                res.status(500).send({"error": true, "message": "Error retrieving data"});
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
     * Añade un nuevo usuario al sistema. Params: username, email, name, surname
     * Sólo el admin puede hacer post de un user
     */
    router.post("/", function (req, res) {

        //Se comprueba que estén todos los campos
        if (!req.body.username || !req.body.email || !req.body.name || !req.body.surname) {
            res.status(400).send({
                "error": true,
                "message": "Parameters username, email, name and surname are required"
            });
            return;
        }


        //Se genera contraseña aleatoria de 12 caracteres
        var pass = randomstring.generate({
            length: 12,
            charset: 'alphabetic'
        });

        //Se hashea la contraseña para guardarla en la bd
        var passHash = crypto.createHash('md5').update(pass).digest('hex');

        var newUser = new User(
            {
                username: req.body.username,
                password: passHash,
                email: req.body.email,
                name: req.body.name,
                surname: req.body.surname,
                registerDate: new Date()
            }
        );

        newUser.save(function (err, result) {

            if (err) {
                res.send({"error": true, "message": "Error saving data " + err});
            }
            else {
                //Se mostrará la contraseña en claro en la respuesta
                result.password = pass;
                res.send({
                    "error": false,
                    "message": result.cleanObjectAndAddHref(),
                    links: [{"userList": "/users"}]
                });
            }
        });


    });


    /**
     * GET /:username
     * Devuelve información completa de un usuario en particular.
     */
    router.get("/:username", function (req, res) {
        User.findOne({username: req.params.username}, 'username email name surname registerDate lastAccessDate', function (err, result) {

            if (err) {
                res.status(500).send({"error": true, "message": "Error retrieving user data"});
                return;
            }
            if (!result) {
                res.status(404).send({"error": true, "message": "The user does not exist"});
                return;
            }

            res.send({
                "error": false,
                "message": result.cleanObjectAndAddHref(),
                links: [{"userList": "/users"}]
            });


        });
    });


    /**
     * PUT /:username
     * Actualiza la información de un usuario (todos los campos salvo _id, username, registerDate y lastAccessDate
     * Links.userList -> Lista de usuarios
     */
    router.put("/:username", function (req, res) {


        User.findOne({username: req.params.username}, function (err, user) {

            if (err) {
                res.status(500).send({"error": true, "message": "Database error"});
                return;

            }

            if (!user) {
                res.status(404).send({"error": true, "message": "The user does not exist"});
                return;
            }


            /* No hay error, el usuario existe, hay que actualizarlo */
            if (req.body.password) {
                /* Actualizar pass */
                user.password = crypto.createHash('md5').update(req.body.password).digest('hex');
            }
            if (req.body.email) {
                /* Actualizar email */
                user.email = req.body.email;
            }

            if (req.body.name) {
                /* Actualizar nombre */
                user.name = req.body.name;
            }
            if (req.body.surname) {
                /* Actualizar apellido */
                user.surname = req.body.surname;
            }

            user.save(function (err, userSaved) {
                if (err) {
                    res.send({"error": true, "message": "Error updating user"});
                }
                else {
                    res.send({
                        "error": false,
                        "message": userSaved.cleanObjectAndAddHref(),
                        links: [{"userList": "/users"}]
                    });
                }
            });


        });
    });


    /**
     * DELETE /username
     * Borra un usuario. Además, borra todos los puntos que haya creado,
     * y lo borra de las listas de siguiendo (creo que esto se hace solo).
     */
    router.delete("/:username", function (req, res) {

        User.remove({username: req.params.username}, function (err, result) {


            if (err) {
                res.status(500).send({"error": true, "message": "Error deleting user"});
                return;
            }


            if (result.result.n == 0) {
                /* No existe el usuario */
                res.status(500).send({"error": true, "message": "The user does not exist in the db "});
                return;
            }

            //Se crea estructura a guardar del usuario que se ha borrado
            var newDeletedUser = new DeletedUser(
                {
                    username: req.params.username,
                    deleteDate: new Date()
                }
            );
            //Se guarda en colección de usuarios borrados
            newDeletedUser.save(function (err, response) {
                console.log("An error appeared saving the deleted user")
            });


            //Borra de las listas de siguiendo ->  Creo que lo hace solo


            //todo
            ///////////////////////////////////////////BORRA TODOS LOS PUNTOS

            res.send({
                "error": false,
                "message": "User successfully deleted",
                links: [{"userList": "/users"}]
            });
        });

    });

    /* Método Post /users/login, intenta loguear a un usuario en el sistema y devuelve un JSON web token en caso
     * de que se pueda realizar el logueo
     **/
    router.post("/login", function (req, res) {


        if (!req.body.username || !req.body.password) {
            res.status(400).send({"error": true, "message ": "Not a correct body, insert username and password"});
            return;
        }

        /*Se encripta la contraseña para compararla con la almacenada*/
        var passHash = crypto.createHash('md5').update(req.body.password).digest('hex');

        /* Se busca el usuario y se devuelve la password en caso de que exista*/
        User.findOne({username: req.body.username}, function (err, result) {

            if(err){
                res.status(500).send({"error": true, "message": "Error retrieving data "});
                return;
            }


            if (result) {
                if (passHash == result.password) {
                    /* Log in correcto */

                    var userObject = result.cleanObjectAndAddHref();
                    userObject.type = "user";
                    delete userObject.password;

                    /*Se genera token de sesion, guardando dentro info de usuario */
                    var token = jwt.sign(userObject, app.get('jwtsecret'), {
                            expiresIn: "1h"
                        } // expires in 1 hour
                    );

                    // Se actualiza la ultima fecha de acceso
                    result.lastAccessDate = new Date();
                    // Se guarda en la db
                    result.save();

                    res.send({"error": false, "message": token});
                } else {
                    res.send({"error": true, "message": "Incorrect password"});
                }

            } else {
                res.status(500).send({"error": true, "message ": "The user does not exist"});
            }

        });


    });

    return router;

};
