/**
 * Módulo que se encarga de limpiar la BD e insertar el usuaro de admin en la misma
 * conforme a lo establecido en el fichero de configuración.
 */
var mongoose = require('mongoose'),
    config = require("./config"),
    models = require("./models"),
    crypto = require('crypto'),
    express = require("express");



var User = models.User;
var Route = models.Route;
var Poi = models.Poi;
var CreatedUser = models.CreatedUser;
var DeletedUser = models.DeletedUser;
var Guest = models.Guest;
var Rating = models.Rating;

var app = express();

//Database URL
var dbUrl = process.env.MONGODB_URI || config.db[app.settings.env];


console.log("[INFO] Starting deploy in " + app.settings.env +  " mode!");
//Conectamos y lanzamos el servidor
mongoose.connect(dbUrl);
mongoose.connection.once('open', function () {

    console.log("[INFO] Connected to MongoDB via Mongoose " + dbUrl);

    var adminUser = new User(
        {
            username: "admin",
            password: crypto.createHash('md5').update(config.deploy.admin.password).digest('hex'),
            email: config.deploy.admin.email,
            name: config.deploy.admin.name,
            surname: config.deploy.admin.surname,
            registerDate: new Date()
        }
    );

    CreatedUser = models.CreatedUser;
    var DeletedUser = models.DeletedUser;
    var Guest = models.Guest;
    var Rating = models.Rating;


    Route.remove({})
        .then(function (response) {
            console.log('* Route collection cleaned');
            return Poi.remove({})
        })
        .then(function (response) {
            console.log('* Poi collection cleaned');
            return User.remove({})
        })
        .then(function (response) {
            console.log('* User collection cleaned');
            return CreatedUser.remove({})
        })
        .then(function (response) {
            console.log('* Created User collection cleaned');
            return DeletedUser.remove({})
        })
        .then(function (response) {
            console.log('* DeletedUser collection cleaned');
            return Guest.remove({})
        })
        .then(function (response) {
            console.log('* DeletedUser collection cleaned');
            return Guest.remove({})
        })
        .then(function (response) {
            console.log('* Guest collection cleaned');
            return Rating.remove({})
        })
        .then(function (response) {
            console.log('* User collection cleaned');
            return adminUser.save()
        })
        .then(function (response) {
            console.log('* Admin user added!');
            console.log('[DONE] Deploy finished');
        })


});

