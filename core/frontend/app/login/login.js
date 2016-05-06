'use strict';

angular.module('frontend')

.controller('LoginCtrl', ['$http','SessionService', '$location', function($http,SessionService,$location) {


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
    /**
     * Hace login de usuario normal.
     */

    self.login =function(){
        $http.post('/users/login', self.loginUser).then(function(response){
            self.errorPassword ="";
            var jwtToken = response.data.message;

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


    console.log("You are on login ctrl");

}]);