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


            self.updateUser = function(username,userEdited){
                return $http.put('/users/'+username,userEdited)
                    .then(function(response){

                        return response.data.message;

                    })
                    .catch(function(exception){

                        broadcastAlert("Could not update user");

                        console.error(exception);
                        throw exception;
                    });
            };


            self.loginUser = function(userObject){
                return $http.post('/users/login', userObject)
                    .then(function(response){

                        return response.data.message;

                    })
                    .catch(function(exception){

                        if(!exception.code==401){
                            broadcastAlert("Could not login user");
                        }


                        console.error(exception);
                        throw exception;
                    });
            };

            self.getUserList = function(userObject){
                return $http.get('/users')
                    .then(function(response){

                        return response.data.message;

                    })
                    .catch(function(exception){

                        broadcastAlert("Could not get User List");

                        console.error(exception);
                        throw exception;
                    });
            };

            self.addNewUser = function(userObject){

                return $http.post('/users', userObject)
                    .then(function(response){

                        return response.data.message;

                    })
                    .catch(function(exception){

                        broadcastAlert("Could not add new user");

                        console.error(exception);
                        throw exception;
                    });
            };


            self.deleteUser = function(id){
                return $http.delete('/users/' + id)
                    .then(function(response){

                        return response.data.message;

                    })
                    .catch(function(exception){

                        broadcastAlert("Could not delete user");

                        console.error(exception);
                        throw exception;
                    });
            }


        }]);
