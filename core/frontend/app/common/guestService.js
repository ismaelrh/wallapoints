'use strict';

/**
 * Servicio que se encarga de llamadas relacionadas con el servicio de guest
 */
angular.module('frontend')

    .service('GuestService', ['$http', '$rootScope',
        function ($http, $rootScope) {


            var self = this;


            /**
             * Envía por broadcast mensajes de error, normalmente son recibidos por
             * controladores que muestran una alerta.
             */
            var broadcastAlert = function (message) {
                $rootScope.$broadcast("errorMessage",
                    {message: message});
            };


            self.login = function (mail, password) {

                return $http.post("/guests/login", {mail: mail, password: password})

                    .then(function (response) {
                        return response.data.message;

                    })
                    .catch(function (exception) {


                        if(exception.status == 401){
                            //Si error 401 -> Datos incorrectos. Hacemos throw para que el controlador lo trate.
                            broadcastAlert(exception.data.message);
                            throw exception;
                        }
                        else{
                            console.error(exception);
                            broadcastAlert("Could not login Guest");
                        }

                    });

            };

            self.getFavs = function (mail) {
                return $http.get("/guests/" + mail + "/favs")
                    .then(function (response) {
                        return response.data.message;

                    })
                    .catch(function (exception) {

                        broadcastAlert("Could not obtain Favs for user");
                        console.error(exception);
                    });
            };

            self.getFollowing = function (mail) {
                return $http.get("/guests/" + mail + "/following")
                    .then(function (response) {
                        return response.data.message;

                    })
                    .catch(function (exception) {

                        broadcastAlert("Could not obtain Following for user");
                        console.error(exception);
                    });
            };

            self.register = function(mail,password){
                return $http.post("/guests", {mail: mail, password: password})
                    .then(function (response) {
                        return response.data.message;
                    })
                    .catch(function (exception) {
                        //Si error al registrar -> Puede que ya exista, hacemos throw para que el controlador lo trate
                        broadcastAlert(exception.data.message);
                        console.error(exception);
                        throw exception;
                    });
            };


            self.setFav = function (guestMail, poiId) {
                return $http.put("/guests/" + guestMail + "/favs/" + poiId, {})
                    .then(function (response) {

                        return response.data.message;
                    })
                    .catch(function (exception) {

                        broadcastAlert("Could not set fav");
                        console.error(exception);

                    });

            };

            self.unsetFav = function (guestMail, poiId) {
                return $http.delete("/guests/" + guestMail + "/favs/" + poiId)
                    .then(function (response) {

                        return response.data.message;
                    })
                    .catch(function (exception) {

                        broadcastAlert("Could not unset fav");
                        console.error(exception);

                    });

            };

            self.followUser = function (guestMail, user) {

                return $http.put("/guests/" + guestMail + "/following/" + user, {})
                    .then(function (response) {

                        return response.data.message;
                    })
                    .catch(function (exception) {

                        broadcastAlert("Could not follow user");
                        console.error(exception);

                    });

            };

            self.unfollowUser = function (guestMail, user) {

                return $http.delete("/guests/" + guestMail + "/following/" + user)
                    .then(function (response) {

                        return response.data.message;
                    })
                    .catch(function (exception) {

                        broadcastAlert("Could not unfollow user");
                        console.error(exception);

                    });
            };



        }]);
