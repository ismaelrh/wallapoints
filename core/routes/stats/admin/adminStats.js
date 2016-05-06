/**
 * Módulo de router que maneja las estadísticas del admin
 */


var express = require('express');


module.exports = function (app) {

    var router = express.Router();

    var DeletedUser = app.models.DeletedUser;
    var CreatedUser = app.models.CreatedUser;
    var Poi = app.models.Poi;
    var Route = app.models.Route;
    var User = app.models.User;


    /**
     * Estadísticas de altas y bajas.
     * GET /stats/admin/usersInOut
     */
    router.get("/usersInOut", function (req, res) {


        var today = new Date();
        today.setHours(today.getHours() - 360);
        CreatedUser.aggregate(
            {   //agrega los valores de fecha mayores de today
                $match: {createDate: {'$gt': today}}
            },
            {
                $group: {
                    _id: {
                        year: {$year: "$createDate"},
                        month: {$month: "$createDate"},
                        day: {$dayOfMonth: "$createDate"}
                    },
                    count: {$sum: 1}
                }
            }
            , function (err, altas) {
                if (err) {

                    res.send({"error": true, "message": "Error obtaining stats"});
                }
                else {
                    DeletedUser.aggregate(
                        {   //agrega los valores de fecha mayores de today
                            $match: {deleteDate: {'$gt': today}}
                        },
                        {
                            $group: {
                                _id: {
                                    year: {$year: "$deleteDate"},
                                    month: {$month: "$deleteDate"},
                                    day: {$dayOfMonth: "$deleteDate"}
                                },
                                count: {$sum: 1}
                            }
                        }
                        , function (err, bajas) {
                            if (err) {

                                res.send({"error": true, "message": "Error obtaining stats"});
                            }
                            else {
                                var message = procesarUsers(altas, bajas);

                                res.status(200).send({
                                    error: "false",
                                    message: message,
                                    links: [{"adminStats": "/statistic"}]
                                });
                            }
                        });

                }
            });
    });

    /**
     * Estadísticas -> Accesos hoy
     * GET /stats/admin/accessesByDay
     */
    router.get("/accessesToday", function (req, res) {

        var today = new Date();
        today.setHours(today.getHours() - 24);
        User.count({lastAccessDate: {'$gt': today}}, function (err, access) {
            if (err) {

                res.send({"error": true, "message": "Error getting accesses today"});
            }
            else {

                res.status(200).send({
                    error: "false",
                    message: access,
                    links: [{"adminStats": "/statistic"}]
                });

            }
        });


    });

    /**
     * Obtiene el número total de pois
     * GET /stats/admin/totalPois
     */
    router.get("/totalPois", function (req, res) {

        Poi.count({}, function (err, pois) {
            if (err) {

                res.send({"error": true, "message": "Error getting total POIs"});
            }
            else {

                res.status(200).send({
                    error: "false",
                    message: pois,
                    links: [{"adminStats": "/statistic"}]
                });

            }
        });

    });

    /**
     * Obtiene el número total de rutas
     * GET /stats/admin/totalRoutes
     */
    router.get("/totalRoutes", function (req, res) {


        Route.count({}, function (err, pois) {
            if (err) {

                res.send({"error": true, "message": "Error getting total routes"});
            }
            else {

                res.status(200).send({
                    error: "false",
                    message: pois,
                    links: [{"adminStats": "/statistic"}]
                });

            }
        });

    });

    /**
     * Obtiene últimos accesos por hora
     * GET /stats/admin/AccessHour
     */
    router.get("/accessesByHour", function (req, res) {


        var today = new Date();
        today.setHours(today.getHours() - 24);
        User.aggregate(
            {   //agrega los valores de fecha mayores de today
                $match: {lastAccessDate: {'$gt': today}}
            },
            {
                $group: {
                    _id: {
                        year: {$year: "$lastAccessDate"},
                        month: {$month: "$lastAccessDate"},
                        day: {$dayOfMonth: "$lastAccessDate"},
                        hour: {$hour: "$lastAccessDate"}
                    },
                    count: {$sum: 1}
                }
            }
            , function (err, access) {
                if (err) {

                    res.send({"error": true, "message": "Error obtaining access by hours"});
                }
                else {
                    var message = byHour(access);

                    res.status(200).send({
                        error: "false",
                        message: message,
                        links: [{"adminStats": "/statistic"}]
                    });

                }
            });
    });

    /**
     * Obtiene estadísticas de puntos actualmente en el sistema
     * GET /stats/admin/poisInSystem
     */
    router.get("/poisInSystem", function (req, res) {


        var today = new Date();
        today.setHours(today.getHours() - 360);
        Poi.aggregate(
            {   //agrega los valores de fecha mayores de today
                $match: {date: {'$gt': today}}
            },
            {$sort: {date: 1}},
            {
                $group: {
                    _id: {
                        year: {$year: "$date"},
                        month: {$month: "$date"},
                        day: {$dayOfMonth: "$date"}
                    },
                    count: {$sum: 1}
                }
            }
            , function (err, pois) {
                if (err) {

                    res.send({"error": true, "message": "Error getting poi statistics"});
                }
                else {


                    var message = procesarPois(pois);

                    res.status(200).send({
                        error: "false",
                        message: message,
                        links: [{"adminStats": "/statistic"}]
                    });

                }
            });
    });

    /**
     * Obtiene estadísticas de rutas
     * GET /stats/admin/routesInSystem
     */
    router.get("/routesInSystem", function (req, res) {


        var today = new Date();
        today.setHours(today.getHours() - 360);
        Route.aggregate(
            {   //agrega los valores de fecha mayores de today
                $match: {date: {'$gt': today}}
            },
            {$sort: {date: 1}},
            {
                $group: {
                    _id: {
                        year: {$year: "$date"},
                        month: {$month: "$date"},
                        day: {$dayOfMonth: "$date"}
                    },
                    count: {$sum: 1}
                }
            }
            , function (err, route) {
                if (err) {

                    res.send({"error": true, "message": "Error getting routes statistics"});
                }
                else {


                    var message = procesarPois(route);

                    res.status(200).send({
                        error: "false",
                        message: message,
                        links: [{"adminStats": "/statistic"}]
                    });

                }
            });
    });

    /**
     * Método privado que genera los datos de estadísticas de altas y bajas.
     */
    function procesarUsers(altas, bajas) {
        var today = new Date();
        var arrayAltas = [];
        var arrayBajas = [];
        var arrayFechas = [];

        var cuentaA = altas.length - 1;
        var cuentaB = bajas.length - 1;
        // desde el dia actual hasta el dia marcado
        var dias = 15;
        today.setHours(today.getHours() - 24 * dias);

        for (var i = 0; i <= 24 * dias; i = i + 24) {
            var d = today.getDate();
            // se suma 1 dado que los meses van de 1-12 y se obtienen de 0-11
            var m = today.getUTCMonth() + 1;
            var y = today.getFullYear();
            //introducimos la fecha en el array de fechas
            arrayFechas.push(d + "-" + m + "-" + y);
            if (altas[cuentaA] != undefined) {
                // si coincide con el dia de alta, metemos el numero de altas en el array de altas
                if (altas[cuentaA]._id.day == d) {
                    arrayAltas.push(altas[cuentaA].count);
                    cuentaA--;
                }
                else {
                    arrayAltas.push(0);
                }
            }
            else {
                arrayAltas.push(0);
            }
            if (bajas[cuentaB] != undefined) {
                // si coincide con el dia de bajas, metemos el numero de bajas en el array de bajas
                if (bajas[cuentaB]._id.day == d) {
                    arrayBajas.push(bajas[cuentaB].count);
                    cuentaB--;
                }
                else {
                    arrayBajas.push(0);
                }
            }
            else {
                arrayBajas.push(0);
            }

            today.setHours(today.getHours() + 24);

        }
        //devuelve el array de fechas y dos arrays de altas y fechas que coinciden en indice con el de fechas
        return {dates: arrayFechas, userData: [arrayAltas, arrayBajas]}


    }

    /**
     * Método privado que genera los datos de estadísticas de pois
     */

    function procesarPois(altas) {
        var today = new Date();
        var arrayAltas = [];
        var arrayFechas = [];

        var cuentaA = altas.length - 1;
        // desde el dia actual hasta el dia marcado
        var dias = 15;
        today.setHours(today.getHours() - 24 * dias);

        for (var i = 0; i <= 24 * dias; i = i + 24) {

            var d = today.getDate();
            // se suma 1 dado que los meses van de 1-12 y se obtienen de 0-11
            var m = today.getUTCMonth() + 1;
            var y = today.getFullYear();
            //introducimos la fecha en el array de fechas
            arrayFechas.push(d + "-" + m + "-" + y);
            var encontrado = false;
            for (var x = 0; (x < altas.length) && !encontrado; x++) {
                if (altas[x]._id.day == d) {
                    arrayAltas.push(altas[x].count);
                    altas.splice(x, 1);

                    encontrado = true;
                }
            }
            if (!encontrado) {
                arrayAltas.push(0);
            }

            today.setHours(today.getHours() + 24);

        }
        //devuelve el array de fechas y dos arrays de altas y fechas que coinciden en indice con el de fechas
        return {dates: arrayFechas, userData: [arrayAltas]}


    }

    /**
     * Método privado que gestiona logins (accesos) en las últimas 24 horas.
     */
    function byHour(access) {

        var today = new Date();
        var arrayAccess = [];
        var arrayFechas = [];

        var cuentaA = access.length - 1;
        // Ultimas 24 horas
        var hours = 24;
        today.setHours(today.getHours() - 1 * hours);

        for (var i = 0; i <= 1 * hours; i = i + 1) {

            var h = today.getHours();
            // se suma 1 dado que los meses van de 1-12 y se obtienen de 0-11
            var m = today.getUTCMonth() + 1;
            var y = today.getFullYear();
            var d = today.getDate();
            //introducimos la fecha en el array de fechas con la hora
            arrayFechas.push(d + "-" + m + "-" + y + "(" + h + ")");
            var encontrado = false;
            for (var x = 0; (x < access.length) && !encontrado; x++) {
                if (access[x]._id.hour == h) {
                    arrayAccess.push(access[x].count);
                    access.splice(x, 1);


                    encontrado = true;
                }
            }
            if (!encontrado) {
                arrayAccess.push(0);
            }

            today.setHours(today.getHours() + 1);

        }
        //devuelve array de fechas con hora junto al array de logins por hora de las ultimas 24 horas
        return {dates: arrayFechas, userData: [arrayAccess]}


    }

    return router;

};
