var mongoose = require('mongoose');

//Definimos esquema
var UserSchema = mongoose.Schema({
  username: {type: String, required:true, unique: true},
  password: {type: String, required:true},
  email: {type: String, required:true},
  name: {type: String, required:true},
  surname: {type: String, required:true},
  registerDate: {type: Date, required:true},
  lastAccessDate: {type: Date}
});

//(Opcional) definimos funciones que añadan algo de lógica al esquema

//Devuelve un objeto apto para devolver por interfaz rest,
//quitando las propiedades _id y __v del usuario, y añadiendo href
UserSchema.methods.cleanObjectAndAddHref = function(){
  var object = this.toJSON();
  object.href = "/users/" + this.username;
  delete object._id;
  delete object.__v;
  return object;
};


//Compilamos modelo
User = mongoose.model('User', UserSchema);

//Exportamos sólo los modelos que queramos (puede haber modelos sin exportar)
module.exports = User;
