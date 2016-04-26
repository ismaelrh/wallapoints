'use strict';

angular.module('frontend')

.controller('LoginCtrl', ['$http','UserService',function($http,UserService) {


    var self = this; //Para no perder la variable this, la guardamos en self (de lo contrario se sobreescribe)

    self.user = {};
    self.guest = {};
    self.guestToRegister = {};
    self.userToRegister = {};


    self.isLogged = function(){
        return UserService.currentlyLogged;
    }

    self.getUserObject = function(){
        return UserService.user;
    };
    /**
     * Hace login de usuario normal.
     */
    self.doLoginUser = function(){

        $http.post('/users/login', self.user).then(function(response){

            var jwtToken = response.data.message;

            UserService.setNewToken(jwtToken);
            self.loginUserMessage = "Ok, bienvenido " + UserService.user.username;

        }, function(err){
            self.loginUserMessage = "Error " + err.data.message;
            console.error(err);
        });

    };


    /**
     * Hace login de invitado registrado
     */
    self.doLoginGuest = function(){

        $http.post('/guests/login', self.guest).then(function(response){

            var jwtToken = response.data.message;

            UserService.setNewToken(jwtToken);
            self.loginGuestMessage = "Ok, bienvenido " + UserService.user.mail;

        }, function(err){
            self.loginGuestMessage = "Error " + err.data.message;
            console.error(err);
        });

    };

    self.doRegisterGuest = function(){
        $http.post('/guests', self.guestToRegister).then(function(response){


            self.registerMessage = "Invitado registrado correctamente";

        }, function(err){

            self.registerMessage = "Error al registrar: " + JSON.stringify(err);
            console.error(err);
        });

    };

    self.doRegisterUser = function(){
        $http.post('/users', self.userToRegister).then(function(response){


            self.registerUserMessage = "Usuario registrado. Contraseña: " + response.data.message.password;

        }, function(err){

            self.registerUserMessage = "Error al registrar: " + JSON.stringify(err);
            console.error(err);
        });

    };


    self.logOut = function(){

        UserService.deleteCurrentToken();


    };


    console.log("You are on login ctrl");

}]);