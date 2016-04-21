var mongoose = require('mongoose');

//Definimos esquema
var FavouriteSchema = mongoose.Schema({
    mail: {type:String, required:true, unique: true},
    poi: {type: mongoose.Schema.Types.ObjectId, required: true, unique: true}
});


FavouriteSchema.methods.setPoi = function (poiString) {
    this.poi = mongoose.Types.ObjectId(poiString);
};

/**
 * Inserta en la BD el objeto favorito, y llama a callback con el objeto insertado.
 * Si ya existía, no lo inserta y llama a callback con el objeto ya existente.
 */
FavouriteSchema.methods.insertIfUnique = function(callback){
    var self = this;
    return this.model('Favourite').findOne({ mail: this.mail, poi: this.poi }, function(err,result){
        if(err){ //Error
            callback(err);
        }
        else{
            if(result!=null){ //Ya existe favorito de ese usuario hacia ese mail, no se hace nada
                callback(null,result);
            }
            else{

               self.save(callback);

            }
        }
    });
};


//(Opcional) definimos funciones que añadan algo de lógica al esquema

//Compilamos modelo
Favourite = mongoose.model('Favourite', FavouriteSchema)

//Exportamos sólo los modelos que queramos (puede haber modelos sin exportar)
module.exports = Favourite;
