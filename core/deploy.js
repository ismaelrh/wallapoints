/**
* Ḿódulo principal de la aplicación. Configura la aplicación,
* carga las dependencias (modelos, rutas) mediante inyección
* y lanza el servidor.
*/
var mongoose = require('mongoose'),
    config = require("./config"),
    models = require("./models"),
    crypto = require('crypto');

  var User = app.models.User;

//Database URL
var dbUrl = process.env.MONGODB_URI || config.db[app.settings.env];


//Conectamos y lanzamos el servidor
mongoose.connect(dbUrl);
mongoose.connection.once('open', function(){

  console.log("[INFO] Connected to MongoDB via Mongoose " + dbUrl);

  var adminUser = new User(
      {username: "admin",
        password: "",
        email: config.deploy.admin.email,
        name: config.deploy.admin.name,
        surname: config.deploy.admin.surname,
        registerDate: new Date()
       }
  );


});



module.exports = app;