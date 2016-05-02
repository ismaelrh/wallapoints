/**
 * Módulo de router que maneja las peticiones de poi.
 */

var express = require('express');


module.exports = function (app) {

    var router = express.Router();

    var User = app.models.User;
    var DeletedUser = app.models.DeletedUser;


    /**
     * GET /users/date
     *
     */
    router.get("/users/date", function (req, res) {
        // req.poi.creator ya tiene el creador por el metodo checkPoiExists
        console.log("Put /pois/:id/ratings/mean");
        var today = new Date();
        today.setHours(today.getHours() - 360);
        console.log(today.toString());
        User.aggregate(
            {   //agrega los valores de fecha mayores de today
                $match: {registerDate: {'$gt' : today}}
            },
            { $group: {
                _id: {year : { $year : "$registerDate" },
                    month : { $month : "$registerDate" },
                    day : { $dayOfMonth : "$registerDate"}
                },
                count: {$sum: 1}
            }}
            ,function (err, altas) {
                if (err) {
                    console.log(err);
                    res.send({"error": true, "message": "Error getting mean"});
                }
                else {
                    console.log(altas);
                    DeletedUser.aggregate(
                        {   //agrega los valores de fecha mayores de today
                            $match: {deleteDate: {'$gt' : today}}
                        },
                        { $group: {
                            _id: {year : { $year : "$registerDate" },
                                month : { $month : "$registerDate" },
                                day : { $dayOfMonth : "$registerDate"}
                            },
                            count: {$sum: 1}
                        }}
                        ,function (err, bajas) {
                            if (err) {
                                console.log(err);
                                res.send({"error": true, "message": "Error getting mean"});
                            }
                            else {
                                console.log(bajas);
                                var message = procesarUsers(altas, bajas);
                                console.log(message);
                                res.status(200).send({
                                    error: "false",
                                    message: message,
                                    links: [{"poiInfo": "/poi/:"+req.params.id}]
                                });
                            }
                        });

                }
            });
    });

    function procesarUsers(altas, bajas) {
        console.log(altas);
        console.log(bajas);
        var fecha187 = new Date();
        var arrayAltas = [];
        var arrayBajas = [];
        var arrayFechas = [];
        fecha187.setHours(fecha187.getHours()-360);
        var cuentaA = altas.length - 1;
        var cuentaB = bajas.length - 1;
        for (var i = 0; i <= 360; i=i + 24){
            var d = fecha187.getDate();
            // se suma 1 dado que los meses van de 1-12 y se obtienen de 0-11
            var m = fecha187.getUTCMonth() + 1;
            var y = fecha187.getFullYear();
            //introducimos la fecha en el array de fechas
            arrayFechas.push(d+"-"+m+"-"+y);
            if(altas[cuentaA] != undefined){
                // si coincide con el dia de alta, metemos el numero de altas en el array de altas
                if(altas[cuentaA]._id.day == d){
                    arrayAltas.push(altas[cuentaA].count);
                    cuentaA--;
                }
                else {
                    arrayAltas.push(0);
                }
            }
            else{
                arrayAltas.push(0);
            }
            if(bajas[cuentaB] != undefined){
                // si coincide con el dia de bajas, metemos el numero de bajas en el array de bajas
                if(altas[cuentaB]._id.day == d){
                    arrayBajas.push(altas[cuentaB].count);
                    cuentaB--;
                }
            }
            else{
                arrayBajas.push(0);
            }

            fecha187.setHours(fecha187.getHours()+24);

        }
        console.log(arrayAltas);
        console.log(arrayBajas);
        console.log(arrayFechas);
        //devuelve el array de fechas y dos arrays de altas y fechas que coinciden en indice con el de fechas
        return {dates:arrayFechas, userData:[arrayAltas,arrayBajas]}


    }

    return router;

};
