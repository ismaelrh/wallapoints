var mongoose = require('mongoose');

//Definimos esquema
var Route = mongoose.Schema({
    name: {type: String, required:true},
    creator: {type: String, required:true},
    pois: {type: Array, "default":[], required:true}
});


//(Opcional) definimos funciones que añadan algo de lógica al esquema

//Compilamos modelo
Route = mongoose.model('Route', Route);

//Exportamos sólo los modelos que queramos (puede haber modelos sin exportar)
module.exports = Route;