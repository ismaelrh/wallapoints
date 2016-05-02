/**
 * Módulo de router que maneja las peticiones de poi.
 */

var express = require('express');


module.exports = function (app) {

    var router = express.Router();

    var User = app.models.User;
    var DeletedUser = app.models.DeletedUser;
    var CreatedUser = app.models.CreatedUser;



    /**
     * GET /users/date
     *
     */
    router.get("/users/date", function (req, res) {
        // req.poi.creator ya tiene el creador por el metodo checkPoiExists
        console.log("Put /pois/:id/ratings/mean");
        var today = new Date();
        today.setHours(today.getHours() - 360);
        CreatedUser.aggregate(
            {   //agrega los valores de fecha mayores de today
                $match: {createDate: {'$gt' : today}}
            },
            { $group: {
                _id: {year : { $year : "$createDate" },
                    month : { $month : "$createDate" },
                    day : { $dayOfMonth : "$createDate"}
                },
                count: {$sum: 1}
            }}
            ,function (err, altas) {
                if (err) {
                    console.log(err);
                    res.send({"error": true, "message": "Error getting mean"});
                }
                else {
                    DeletedUser.aggregate(
                        {   //agrega los valores de fecha mayores de today
                            $match: {deleteDate: {'$gt' : today}}
                        },
                        { $group: {
                            _id: {year : { $year : "$deleteDate" },
                                month : { $month : "$deleteDate" },
                                day : { $dayOfMonth : "$deleteDate"}
                            },
                            count: {$sum: 1}
                        }}
                        ,function (err, bajas) {
                            if (err) {
                                console.log(err);
                                res.send({"error": true, "message": "Error getting mean"});
                            }
                            else {
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
        var today = new Date();
        var arrayAltas = [];
        var arrayBajas = [];
        var arrayFechas = [];

        var cuentaA = altas.length - 1;
        var cuentaB = bajas.length - 1;
        // desde el dia actual hasta el dia marcado
        var dias = 15;
        today.setHours(today.getHours()-24*dias);

        for (var i = 0; i <= 24*dias; i=i + 24){
            var d = today.getDate();
            // se suma 1 dado que los meses van de 1-12 y se obtienen de 0-11
            var m = today.getUTCMonth() + 1;
            var y = today.getFullYear();
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
                if(bajas[cuentaB]._id.day == d){
                    arrayBajas.push(bajas[cuentaB].count);
                    cuentaB--;
                }
                else{
                    arrayBajas.push(0);
                }
            }
            else{
                arrayBajas.push(0);
            }

            today.setHours(today.getHours()+24);

        }
        //devuelve el array de fechas y dos arrays de altas y fechas que coinciden en indice con el de fechas
        return {dates:arrayFechas, userData:[arrayAltas,arrayBajas]}


    }

    return router;

};
