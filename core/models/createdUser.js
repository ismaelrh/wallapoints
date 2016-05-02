var mongoose = require('mongoose');

//Definimos esquema
var CreatedUserSchema = mongoose.Schema({
    username: {type: String, required:true},
    createDate: {type: Date, required:true}
});

//(Opcional) definimos funciones que añadan algo de lógica al esquema

//Compilamos modelo
CreatedUser = mongoose.model('CreatedUser', CreatedUserSchema);

//Exportamos sólo los modelos que queramos (puede haber modelos sin exportar)
module.exports = CreatedUser;
