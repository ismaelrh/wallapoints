/**
 * Módulo de router que maneja las peticiones de poi.
 */

var express = require('express');


module.exports = function (app) {

    var router = express.Router();

    var User = app.models.User;


    /**
     * GET /users/date
     *
     */
    router.get("/users/date", function (req, res) {
        // req.poi.creator ya tiene el creador por el metodo checkPoiExists
        console.log("Put /pois/:id/ratings/mean");

        var oid = new ObjectID(req.params.id);

        User.aggregate(
            {
                $match: {poi: oid}
            },
            { $group: {
                _id: '$poi',
                pointsAvg: { $avg: '$points'}
            }}
            ,function (err, results) {
                if (err) {
                    console.log(err);
                    res.send({"error": true, "message": "Error getting mean"});
                }
                else {
                    var message = {_id: 'undefinec',pointsAvg: 0};
                    if(results[0] != undefined){
                        message = results[0];
                    }
                    res.status(200).send({
                        error: "false",
                        message: message,
                        links: [{"poiInfo": "/poi/:"+req.params.id}]
                    });
                }
            });
    });

    return router;

};
