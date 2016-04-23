/**
 * Ismael Rodríguez Hernández
 * Módulo de router que maneja las peticiones de seguimiento
 * de usuarios por parte de invitados.
 */

var express = require('express');

module.exports = function(app){

    var router = express.Router({mergeParams: true});

    var Guest = app.models.Guest;
    var User = app.models.User;


    /**
     * Comprueba que existe el "guest" al que se refieren las llamadas de este módulo.
     * Se ejecutará antes que el resto de llamadas, descartándolas si no existe o
     * sucede algún error.
     */
    function checkGuestExists(req,res,next){
        Guest.findOne({mail:req.params.guestMail}).
            populate('following')
            .exec(function(err,result){

            if(err){
                res.status(500).send({error:"true",message:"Error"});
                return;
            }
            if(result==null){
                res.status(404).send({error:"true",message:"Guest does not exist"});
                return;
            }

            req.guest = result;
            next(); //El guest existe -> Pasamos control al siguiente middleware

        });
    }

    router.all('/', checkGuestExists);
    router.all('/:username', checkGuestExists);


    /**
     * GET /
     * Devuelve un listado de todos los usuarios a los que sigue el invitado.
     * links.guestInfo apunta a información de dicho invitado.
     */
    router.get("/",function(req,res){

        var guest = req.guest;

        if(guest.following.length==0){ //Si array vacio -> no se realiza transformación
            res.status(200).send({
                error:"false",
                message:guest.following,
                links: [{guestInfo: "/guests/" + guest.mail}]
            });
        }
        else{


            var finalArray = [];
            guest.following.forEach(function (i, idx, array) {

                finalArray.push({username: i.username, name: i.name, href: "/users/" + i.username});
                if (idx === array.length - 1) {
                    res.send(
                        {
                            "error": false,
                            "message": finalArray
                        });
                }
            });

        }




    });


    /**
     * PUT /:username
     * Provoca que el invitado siga al usuario :username (si existe).
     */
    router.put("/:username",function(req,res){


        if(!req.params.username){
            res.status(400).send({error:"true",message:"Please call this method with a username param"});
            return;
        }

        //Mirar si el username realmente existe

        User.findOne({username:req.params.username},function(err,result){

            if(err){
                res.status(500).send({error:"true",message:"Error while inserting following"});
                return;
            }
            if(!result){
                res.status(404).send({error:"true",message:"No such user"});
                return;
            }

            var guest = req.guest;

            //Miramos si ya está siendo seguido por el invitado
            var alreadyInserted = false;
            for(var i = 0; !alreadyInserted && i < guest.following.length; i++){
                if(guest.following[i].username==req.params.username){
                    alreadyInserted = true;
                }
            }

            if(!alreadyInserted){
                guest.following.push(result);
            }

            guest.save(function(err,response){
                if(err){
                    res.status(500).send({error:"true",message:"Error while inserting following"});
                }
                else{
                    res.status(200).send(
                        {error:"false",
                            message:{username: result.username, name: result.name, href: "/users/" + result.username},
                            links: [{followingList: "/guests/" + guest.mail + "/following"}]});
                }
            });

        });






    });


    /**
     * DELETE /:username
     * Provoca que el invitado deje de seguir al usuario :username.
     */
    router.delete("/:username",function(req,res){

        var username = req.params.username;
        var guest = req.guest;

        //Miramos si el invitado está siguiendo a dicho usuario
        var alreadyFollowing = false;
        var followingIndex = -1;
        for(var i = 0; !alreadyFollowing && i < guest.following.length; i++){
            if(guest.following[i] == username){
                alreadyFollowing = true;
                followingIndex = i;
            }
        }

        //Si lo está siguiendo, borramos de lista de following
        if(alreadyFollowing){ //Si esta añadido, borramos
            guest.following.splice(followingIndex,1);
            guest.save(function(err,saved){
                if(err){
                    res.status(500).send({error:"true",message:"Error while deleting following"});
                }
                else{
                    res.status(200).send({
                        error:"true",
                        message:"The user has been unfollowed",
                        links: [{followingList: "/guests/" + guest.mail + "/following"}]});

                }
            });

        }
        else{ //No existe -> 404
            res.status(404).send({error:"true",message:"Following not found"});
        }


    });



    return router;

};
