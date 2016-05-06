'use strict';

/**
 * Controlador de pantalla de login.
 * @author Ismael Rodríguez, Sergio Soro, David Vergara. 2016.
 */
angular.module('frontend')

.controller('LoginCtrl', ['SessionService', '$location', 'UserService','$rootScope', function(SessionService,$location,UserService,$rootScope) {


    var self = this; //Para no perder la variable this

    //Fields login
    self.loginUser={};
    self.errorPassword="";

    self.isLogged = function(){
        return SessionService.currentlyLogged;
    };

    self.getUserObject = function(){
        return SessionService.user;
    };

    //Para mostrar alerta cuando hay errores
    self.alert = {
        show: false,
        message: ""
    };

    //Para mostrar alerta
    $rootScope.$on("errorMessage", function (event, args) {
        showAlert("danger",args.message);
    });


    function showAlert(type,message){
        self.alert.show = true;
        self.alert.type = type;
        self.alert.message = message;
        if(self.alert.type=="danger"){
            self.alert.title = "Error!";
        }
        if(self.alert.type=="warning"){
            self.alert.title = "Warning!"
        }
        if(self.alert.type=="success"){
            self.alert.title = "Success!";
        }
    }

    /**
     * Hace login de usuario normal.
     */

    self.login =function(){
        UserService.loginUser(self.loginUser)
            .then(function(jwt){
            self.errorPassword ="";
            var jwtToken = jwt;

            SessionService.setNewToken(jwtToken);

            if(SessionService.user.username== "admin"){
                $location.path("/admin/")
            } else{
                $location.path("/userMap");
            }

        }, function(err){
            self.errorPassword="Incorrect username or password";
            console.error(err);
        });
    };



    self.goGuestMap = function(){

        $location.path("/map");
    };


    self.logOut = function(){
        SessionService.deleteCurrentToken();
    };




}]);