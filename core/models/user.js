var mongoose = require('mongoose');

//Definimos esquema
var UserSchema = mongoose.Schema({
  username: {type: String, required:true},
  password: {type: String, required:true},
  email: {type: String, required:true},
  name: {type: String, required:true},
  surname: {type: String, required:true},
  registerDate: {type: Date, required:true},
  lastAccessDate: {type: Date}
});

//(Opcional) definimos funciones que añadan algo de lógica al esquema

//Compilamos modelo
User = mongoose.model('User', UserSchema);

//Exportamos sólo los modelos que queramos (puede haber modelos sin exportar)
module.exports = User;
