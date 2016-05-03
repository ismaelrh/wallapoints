'use strict';

/**
 * Servicio que se encarga de la gestión de usuarios
 */
angular.module('frontend')

    .service('UserService', ['$http','$rootScope',
        function ($http,$rootScope) {


            var self = this;


            var broadcastAlert = function(message){
                $rootScope.$broadcast("errorMessage",
                    { message: message });
            };

            self.getUserDetail = function(username){

                return $http.get("/users/" + username)

                    .then(function(response){

                        return response.data.message;

                    })
                    .catch(function(exception){

                        broadcastAlert("Could not load user detail");

                        console.error(exception);
                        throw exception;
                    });

            };





        }]);
