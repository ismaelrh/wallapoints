var mongoose = require('mongoose');

//Definimos esquema
var Poi = mongoose.Schema({
    name: {type: String, required:true},
    description: {type: String, required:true},
    multimediaUrl: {type: String},
    keywords: {type: Array, "default":[] },
    lat: {type: Number, required:true},
    long: {type: Number, required:true},
    creator: {type: String, required:true}
});

//(Opcional) definimos funciones que añadan algo de lógica al esquema

//Compilamos modelo
Poi = mongoose.model('Poi', Poi);

//Exportamos sólo los modelos que queramos (puede haber modelos sin exportar)
module.exports = Poi;
