/**
 * Modelo que guarda la fecha de baja de cada usuario.
 * @author Ismael Rodríguez, Sergio Soro, David Vergara. 2016.
 */
var mongoose = require('mongoose');

//Definimos esquema
var DeletedUserSchema = mongoose.Schema({
    username: {type: String, required:true},
    deleteDate: {type: Date, required:true}
});

//Compilamos modelo
DeletedUser = mongoose.model('DeletedUser', DeletedUserSchema);

//Exportamos sólo los modelos que queramos (puede haber modelos sin exportar)
module.exports = DeletedUser;
