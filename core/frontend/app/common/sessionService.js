'use strict';

/**
 * Servicio que se encarga de la gestión de tokens de usuario.
 */
angular.module('frontend')

    .service('SessionService', ['jwtHelper', 'localStorageService', '$q', '$location',
        function (jwtHelper, localStorageService, $q, $location) {


            var self = this;

            self.currentlyLogged = false; //Indicates if we have information about a token or not
            self.user = undefined;       //Current user's object
            self.token = undefined;       //Current token in text


            /**
             * Sets new token from "newToken" from String
             */
            self.setNewToken = function (newToken) {

                self.token = newToken;
                self.user = jwtHelper.decodeToken(self.token);

                self.currentlyLogged = true; //Set flag to TRUE

                //Save token to local storage
                localStorageService.set("jwt", self.token);

                if (self.user.type == "user") {
                    console.log("[LOGIN] Obtained token for user " + self.user.username);
                }
                else if (self.user.type == "guest") {
                    console.log("[LOGIN] Obtained token for guest " + self.user.mail);
                }
                else {
                    console.error("[LOGIN] Unknown type of user");
                }

            };


            /**
             * Devuelve true si el usuario no está logueado, reject(Not Authenticated) en otro caso.
             */
            self.isAnonymous = function () {
                if (self.currentlyLogged == false) {
                    return true;
                }
                else {
                    return $q.reject('Not Authenticated');
                }
            };


            /**
             * Si no se pasa como parámetro nada, devuelve true si el usuario está autentificado como user. Si no, reject(not authenticated).
             * Si se pasa como parámetro algo, se mira que sea con dicho username. Si ok, true. Si no, reject(forbidden).
             * @returns {*}
             */
            self.isAuthenticatedUser = function (allowedUsername) {

                if (!self.currentlyLogged || !self.user.type == "user") { //No autenticado o autenticado como guest
                    return $q.reject('Not Authenticated');
                }

                if (allowedUsername) { //Si se pasa como parámetro usuario, se comprueba que sea él
                    console.log("hola");
                    if (self.user && self.user.username == allowedUsername) {
                        return true;
                    }
                    else {
                        return $q.reject('Forbidden');
                    }
                }

                return true; //Sólo queda que sea usuario logueado.


            };


            /**
             * Devuelve true si el usuario está autenticado como invitado, reject('not authenticated') en otro caso.
             */
            self.isAuthenticatedGuest = function () {
                if (self.currentlyLogged == true && self.user && self.user.type == "guest") {
                    return true;
                }
                else {
                    return $q.reject('Not Authenticated');
                }
            };


            /*
             Loads token from local storage and returns true.
             If does not exists, returns false;
             */
            self.loadFromStorage = function () {

                var token = localStorageService.get("jwt");
                if (token) {
                    self.setNewToken(token);
                    return true;
                }
                return false;

            };

            self.isTokenExpired = function(){
                var date = jwtHelper.getTokenExpirationDate(self.token);
                return (new Date()) >= date;
            };

            /**
             * Deletes all data of token from memory and storage
             */
            self.deleteCurrentToken = function () {

                //Delete from storage
                localStorageService.remove("jwt");


                //Delete from memory
                self.user = undefined;
                self.token = undefined;

                //Set flag to false
                self.currentlyLogged = false;
            };
            self.logOut = function () {

                self.deleteCurrentToken();
                $location.path("");
            };

            //At start, load from local storage
            self.loadFromStorage();


        }]);
