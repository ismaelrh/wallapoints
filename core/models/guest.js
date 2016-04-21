var mongoose = require('mongoose');

//Definimos esquema
var GuestSchema = mongoose.Schema({
    mail: {type:String, required:true},
    password: {type: String, required: true }
});

//(Opcional) definimos funciones que añadan algo de lógica al esquema

//Compilamos modelo
Guest = mongoose.model('Guest', GuestSchema)

//Exportamos sólo los modelos que queramos (puede haber modelos sin exportar)
module.exports = Guest;
