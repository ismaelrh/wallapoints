var mongoose = require('mongoose');

//Definimos esquema
var FollowingSchema = mongoose.Schema({
    mail: {type:String, required:true},
    username: {type:String, required: true}
});

//(Opcional) definimos funciones que añadan algo de lógica al esquema

//Compilamos modelo
Following = mongoose.model('Following', FollowingSchema)

//Exportamos sólo los modelos que queramos (puede haber modelos sin exportar)
module.exports = Following;
