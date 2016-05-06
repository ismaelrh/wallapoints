/**
 * Modelo que guarda la fecha de baja de cada usuario.
 * @author Ismael Rodríguez, Sergio Soro, David Vergara. 2016.
 */
var mongoose = require('mongoose');

//Definimos esquema
var RatingSchema = mongoose.Schema({
    mail: {type:String, required:true},
    poi: {type: mongoose.Schema.Types.ObjectId, required: true},
    points: {type: Number, required:true}
});

/**
 * Devuelve un objeto imprimible en una lista de guests.
 * Añade un href y elimina atributos como __v, _id y password.
 */
RatingSchema.methods.cleanRatingForList = function(){
    var object = this.toJSON();
    delete object.__v;
    delete object._id;
    delete object.poi;
    return object;
};

//(Opcional) definimos funciones que añadan algo de lógica al esquema

//Compilamos modelo
Rating = mongoose.model('Rating', RatingSchema)

//Exportamos sólo los modelos que queramos (puede haber modelos sin exportar)
module.exports = Rating;
