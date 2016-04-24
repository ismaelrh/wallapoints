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


GuestSchema.methods.returnObjectWithLinksForDetail = function(){
    var object = this.toJSON();
    object.favourite = "/guests/" + this.mail + "/favourite";
    object.following = "/guests/" + this.mail + "/following";
    delete object.__v;
    delete object._id;
    delete object.password;
    return object;
};


GuestSchema.methods.returnObjectWithLinksForList = function(){
    var object = this.toJSON();
    object.href = "/guests/" + this.mail;
    return object;
};


//(Opcional) definimos funciones que añadan algo de lógica al esquema

//Compilamos modelo
Guest = mongoose.model('Guest', GuestSchema);

//Exportamos sólo los modelos que queramos (puede haber modelos sin exportar)
module.exports = Guest;
