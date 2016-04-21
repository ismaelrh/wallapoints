var mongoose = require('mongoose');

//Definimos esquema
var DeletedUserSchema = mongoose.Schema({
    udername: {type: String, required:true},
    deleteDate: {type: Date, required:true}
});

//(Opcional) definimos funciones que añadan algo de lógica al esquema

//Compilamos modelo
DeletedUser = mongoose.model('DeletedUser', DeletedUserSchema);

//Exportamos sólo los modelos que queramos (puede haber modelos sin exportar)
module.exports = User;
