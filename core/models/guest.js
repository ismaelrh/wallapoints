var mongoose = require('mongoose');
var Poi = require('./poi'); //Se importa el model de POI pues se usa
var User = require('./user'); //Se importa el model de USER pues se usa

//Definimos esquema
var GuestSchema = mongoose.Schema({
    mail: {type:String, required:true, unique: true},
    password: {type: String, required: true },
    favourite: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Poi' }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
});


/**
 * Devuelve un objeto imprimible en una lista de guests.
 * Añade un href y elimina atributos como __v, _id y password.
 */
GuestSchema.methods.cleanGuestForList = function(){
    var object = this.toJSON();
    object.href = "/guests/" + this.mail;
    delete object.__v;
    delete object._id;
    delete object.password;
    return object;
};

/**
 * Devuelve un objeto imprimible en un detalle de guests.
 * Añade un href y elimina atributos como __v, _id y password.
 */
GuestSchema.methods.cleanGuestForDetail = function(){

    var object = this.cleanGuestForList();
    object.favourite = "/guests/" + this.mail + "/favs";
    object.following = "/guests/" + this.mail + "/following";
    delete object.password;
    return object;
};



//Compilamos modelo
Guest = mongoose.model('Guest', GuestSchema);

//Exportamos sólo los modelos que queramos (puede haber modelos sin exportar)
module.exports = Guest;
