var mongoose = require('mongoose');

//Definimos esquema
var RatingSchema = mongoose.Schema({
    mail: {type:String, required:true},
    poi: {type: mongoose.Schema.Types.ObjectId, required: true},
    points: {type: Number, required:true}
});

//(Opcional) definimos funciones que añadan algo de lógica al esquema

//Compilamos modelo
Rating = mongoose.model('Rating', RatingSchema)

//Exportamos sólo los modelos que queramos (puede haber modelos sin exportar)
module.exports = Rating;
