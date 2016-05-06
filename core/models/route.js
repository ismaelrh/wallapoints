/**
 * Modelo que guarda las rutas.
 * @author Ismael Rodríguez, Sergio Soro, David Vergara. 2016.
 */
var mongoose = require('mongoose');
var Poi = require('./poi'); //Se importa el model de POI pues se usa

//Definimos esquema
var RouteSchema = mongoose.Schema({
    name: {type: String, required:true},
    creator: {type: String, required:true},
    pois: [{type: mongoose.Schema.Types.ObjectId, ref: 'Poi' }],
    distance: {type: Number, required: false}, //No se muestra al público
    date: {type: Date, default: Date.now },
    time: {type:Number, required: false}      //No se muestra al público
});


//Devuelve un objeto de ruta listo para ser mostrado en una lista
RouteSchema.methods.cleanRouteForList = function(){
    var object = this.toJSON();
    object.href = "/routes/" + this._id;
    delete object.pois;
    delete object.distance;
    delete object.time;
    delete object.__v;
    return object;
};

//Devuelve un objeto de ruta listo para ser mostrado en detalle
RouteSchema.methods.cleanRouteForDetail = function(){
    var object = this.toJSON();
    delete object.__v;
    var pois = object.pois;
    object.pois = [];
    delete object.distance;
    delete object.time;
    for(var i = 0; i < pois.length; i++){
        var p = pois[i];
        object.pois.push({_id:p._id,name:p.name,lat:p.lat,long:p.long,href: "/pois/" + p._id});

    }
    return object;
};

//Devuelve un objeto de ruta listo para ser devuelto para estadísticas
RouteSchema.methods.cleanRouteForStats = function(){
    var object = this.toJSON();
    delete object.__v;
    var pois = object.pois;
    object.pois = [];

    for(var i = 0; i < pois.length; i++){
        var p = pois[i];
        object.pois.push({_id:p._id,name:p.name,lat:p.lat,long:p.long,href: "/pois/" + p._id});

    }
    return object;
};


//Compilamos modelo
Route = mongoose.model('Route', RouteSchema);

//Exportamos sólo los modelos que queramos (puede haber modelos sin exportar)
module.exports = Route;