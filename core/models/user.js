var mongoose = require('mongoose');

//Definimos esquema
var UserSchema = mongoose.Schema({
  username: String,
  password: String,
  email: String,
  birthDate: Date
});

//(Opcional) definimos funciones que añadan algo de lógica al esquema

//Compilamos modelo
User = mongoose.model('User', UserSchema)

//Exportamos sólo los modelos que queramos (puede haber modelos sin exportar)
module.exports = User;
