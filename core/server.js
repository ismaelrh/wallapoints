/**
* Ḿódulo principal de la aplicación. Configura la aplicación,
* carga las dependencias (modelos, rutas) mediante inyección
* y lanza el servidor.
*/
var express = require("express"),
    mongoose = require('mongoose'),
    bodyParser = require("body-parser");;


var app = express();

//Aceptaremos JSON y valores codificados en la propia URL
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));

//Cargamos los modelos
app.models = require('./models');

//Servimos el frontend en "/"
console.log(express.static('frontend/app'));
app.use(express.static('./frontend/app'));

//Cargamos las rutas
require('./routes')(app);



//Conectamos y lanzamos el servidor
mongoose.connect('mongodb://localhost/blog');
mongoose.connection.once('open', function(){

  console.log("[INFO] Connected to MongoDB via Mongoose");
  app.listen(8888,function(){
    console.log("[INFO] Express server running on port 8888");
  });
});
