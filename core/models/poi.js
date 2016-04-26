var mongoose = require('mongoose');

//Definimos esquema
var PoiSchema = mongoose.Schema({
    name: {type: String, required:true},
    description: {type: String, required:true},
    multimediaUrl: {type: String},
    keywords: {type: Array, "default":[] },
    lat: {type: Number, required:true},
    long: {type: Number, required:true},
    date: {type: Date, default: Date.now },
    creator: {type: String, required:true},
    ratings: {type: Array, "default": []}
});


//Devuelve un objeto útil para enviar por la interfaz rest,
//quitando la propiedad __v del poi y añadiendo href.
PoiSchema.methods.cleanObjectAndAddHref = function(){
    var object = this.toJSON();
    object.href = "/pois/" + this._id;
    delete object.__v;
    return object;
};

//Compilamos modelo
Poi = mongoose.model('Poi', PoiSchema);

//Exportamos sólo los modelos que queramos (puede haber modelos sin exportar)
module.exports = Poi;
