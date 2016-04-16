var mongoose = require('mongoose');

//Definimos esquema
var PostSchema = mongoose.Schema({
  title: {type: String },
  author: {type: String },
  text: {type: String }
});

//(Opcional) definimos funciones que añadan algo de lógica al esquema

//Compilamos modelo
Post = mongoose.model('Post', PostSchema)

//Exportamos sólo los modelos que queramos (puede haber modelos sin exportar)
module.exports = Post;
