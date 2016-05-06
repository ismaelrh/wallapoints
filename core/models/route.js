var mongoose = require('mongoose');
var Poi = require('./poi'); //Se importa el model de POI pues se usa

//Definimos esquema
var RouteSchema = mongoose.Schema({
    name: {type: String, required:true},
    creator: {type: String, required:true},
    date: {type: Date, default: Date.now },
    pois: [{type: mongoose.Schema.Types.ObjectId, ref: 'Poi' }]
});


//(Opcional) definimos funciones que añadan algo de lógica al esquema
RouteSchema.methods.cleanRouteForList = function(){
    var object = this.toJSON();
    object.href = "/routes/" + this._id;
    delete object.__v;
    return object;
};

RouteSchema.methods.cleanRouteForDetail = function(mes){
    var object = this.toJSON();
    delete object.__v;
    delete object.pois;
    object.pois = mes;
    return object;
};


//Compilamos modelo
Route = mongoose.model('Route', RouteSchema);

//Exportamos sólo los modelos que queramos (puede haber modelos sin exportar)
module.exports = Route;