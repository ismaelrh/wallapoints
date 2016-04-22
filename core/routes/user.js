/**
* Módulo de router que maneja las peticiones de user.
*/

var express = require('express');


module.exports = function(app){

  var router = express.Router();

  //Importamos el modelo de User
  var User = app.models.User;
  var DeletedUser = app.models.DeletedUser;
  var userLoged = "";


  /* Método GET /user, solo el admin puede obtener la lista con todos los usuarios del sistema */
  router.get("/",function(req,res){
    /* Si el usuario es el admin */
    if (userLoged == "Admin"){
      User.find({},'_id username email name surname registerDate lastAccessDate',function(err,results){
        if(err){
          res.status(500).send({"error":true,"message":"Error retrieving data"});
        }
        else{
          res.send({"error":false,"message":results});
        }
      });
      /* Si no es admin se deniega el acceso*/
    } else{
      res.status(500).send({"error":true,"message":"You are not the Admin, access denied"});
    }
  });


  /* Método Post /user, solo el admin puede hacer post de un user */
  router.post("/",function(req,res){
    // Se comprueba que sea el admin
    if (userLoged == "Admin") {
      //Se comprueba que estén todos los campos
      if (req.body.username && req.body.email && req.body.name && req.body.surname){

        //Se genera contraseña aleatoria de 12 caracteres
        var pass =randomstring.generate({
          length: 12,
          charset: 'alphabetic'
        });

        /*Se encripta la contraseña para guardarla en la bd */
        var passHash = crypto.createHash('md5').update(pass).digest('hex');

        var newUser = new User(
            {
              username: req.body.username,
              password: passHash,
              email: req.body.email,
              name: req.body.name,
              surname: req.body.surname,
              registerDate:new Date()
            }
        );

        newUser.save(function (err, result) {

          if (err) {
            res.send({"error": true, "message": "Error saving data"});
          }
          else {
            //Se mostrará la contraseña en claro
            result.password=pass;
            res.send({"error": false, "message": result});
          }
        });
      } else{
        res.status(400).send({"error":true,"message":"You have to fill all the parameters"});
      }

    } else{
      res.status(401).send({"error":true,"message":"You are not the Admin, access denied"});
    }

  });

  /* Método GET /user/:id, se devuelve la información de un usuario */
  router.get("/:id",function(req,res){
    User.findOne({username:req.params.username},'_id username email name surname registerDate lastAccessDate',function(err,results){
      if(err){
        res.status(500).send({"error":true,"message":"Error retrieving data"});
      }
      else{
        if(res){
          res.send({"error":false,"message":results});
        } else{
          res.status(500).send({"error":true,"message ":"The user does not exit"});
        }
      }
    });
  });

  /* Método PUT /user/:id, se acutaliza la información de un usuario
   * campos _id, username, registerDate y lastAccessDate no se pueden modificar
   **/
    router.put("/:id",function(req,res){
        if (userLoged == "Admin") {
            User.findOne({username:req.params.username}, function (err, user) {
                /* No hay error de la bd */
                if (!err) {

                    /* No hay error, el usuario existe, hay que actualizarlo */
                    if (req.body.password !== undefined) {
                        /* Updatear pass */
                        user.password = crypto.createHash('md5').update(req.body.password).digest('hex');
                    }
                    if (req.body.email !== undefined) {
                        /* Updatear email */
                        user.email = req.body.email;
                    }
                    if (req.body.name !== undefined) {
                        /* Updatear pass */
                        user.name = req.body.name;
                    }
                    if (req.body.surname !== undefined) {
                        /* Updatear apellido */
                        user.surname = req.body.surname;
                    }

                    /* Updatear user*/
                    user.save(function (err, userSaved) {
                        if (err) {
                            res.send({"error": true, "message": "Error saving data"});
                        }
                        else {
                            res.send({"error": false, "message": result});
                        }
                    });
                }
                /* Error de la bd */
                else {
                    res.status(500).send({"error": true, "message": "Database error"});
                }
            });
        } else{
            res.status(500).send({"error":true,"message":"You are not the Admin, access denied"});
        }
    });

    /*Método DELETE /User/:id, se borra la información del usuario*/
    router.delete("/:id",function(req,res){
        /* Si el usuario es el admin */
        if (userLoged == "Admin"){
            User.delete({username:req.params.username},function(err,results){

                var result = results.toJSON();
                if(err){
                    res.status(500).send({"error":true,"message":"Error deleting data"});
                    return;
                }


                if(result.n == 0){
                    /* No existe el usuario */
                    res.status(500).send({"error":true,"message":"The user does not exit in the db "});
                    return;
                }

                //Se crea estructuctura a guardar del usuario que se ha borrado
                var newDeletedUser = new DeletedUser(
                    {
                        username: req.params.username,
                        deleteDate: new Date()
                    }
                );
                newDeletedUser.save(function(err,response){
                        console.log("An error appeared saving the deleted user")
                    });


                /////////////////////////////////////////////////////////////////////////////BORRAR DE LAS LISTAS DE FAVORITOS
                res.send({"error":false,"message":"User deleted "+results});



            });
            /* Si no es admin se deniega el acceso*/
        } else{
            res.status(500).send({"error":true,"message":"You are not the Admin, access denied"});
        }
    });


  return router;

};
