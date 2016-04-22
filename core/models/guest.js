var mongoose = require('mongoose');

//Definimos esquema
var GuestSchema = mongoose.Schema({
    mail: {type:String, required:true, unique: true},
    password: {type: String, required: true },
    favourite: {type: Array, "default":[], required:false},
    following: {type: Array, "default":[], required:false},
    rating:  {type: Array, "default":[], required:false}
});


GuestSchema.methods.returnObjectWithLinksForDetail = function(){
    var object = this.toJSON();
    object.favourite = "/guests/" + this.mail + "/favourite";
    object.following = "/guests/" + this.mail + "/following";
    object.allGuestsList = "/guests";
    return object;
};

GuestSchema.methods.returnObjectWithLinksForList = function(){
    var object = this.toJSON();
    object.href = "/guests/" + this.mail;
    return object;
};

GuestSchema.methods.returnFavListObjectWithLinks = function(){

    var object = {"guest":"/guests/" + this.mail,"favouriteList":this.favourite};
    return object;
};

GuestSchema.methods.returnFollowingListObjectWithLinks = function(){

    var object = {"guest":"/guests/" + this.mail,"followingList":this.favourite};
    return object;
};

GuestSchema.methods.returnAllFollowingObject = function(){

    var object = {"allFollowing":"/guests/" + this.mail + "/following"};
    return object;
};

GuestSchema.methods.returnAllFavouriteObject = function(){

    var object = {"allFavourite":"/guests/" + this.mail + "/following"};
    return object;
};

GuestSchema.methods.returnInsertedFavWithLink = function(inserted){
    var object = {"insertedFav": inserted, "allFavourite": "/guests/" + this.mail + "/favourite"};
    return object;
};


GuestSchema.methods.returnInsertedFollowingWithLink = function(inserted){
    var object = {"insertedFollowing": inserted, "allFollowing": "/guests/" + this.mail + "/following"};
    return object;
};


//(Opcional) definimos funciones que añadan algo de lógica al esquema

//Compilamos modelo
Guest = mongoose.model('Guest', GuestSchema)

//Exportamos sólo los modelos que queramos (puede haber modelos sin exportar)
module.exports = Guest;
