/**
 * Modelo que guarda la fecha de creación de cada usuario.
 * @author Ismael Rodríguez, Sergio Soro, David Vergara. 2016.
 */
var mongoose = require('mongoose');

//Definimos esquema
var CreatedUserSchema = mongoose.Schema({
    username: {type: String, required:true},
    createDate: {type: Date, required:true}
});


//Compilamos modelo
CreatedUser = mongoose.model('CreatedUser', CreatedUserSchema);

//Exportamos sólo los modelos que queramos (puede haber modelos sin exportar)
module.exports = CreatedUser;
