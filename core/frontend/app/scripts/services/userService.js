'use strict';


angular.module('frontend')

    .service('UserService', ['jwtHelper','localStorageService', function (jwtHelper,localStorageService) {


        var self = this;

        self.currentlyLogged = false; //Indicates if we have information about a token or not

        self.user = undefined;       //Current user's object
        self.token=undefined;       //Current token in text


        /**
         * Sets new token from "newToken" from String
         */
        self.setNewToken = function(newToken){

            self.token = newToken;
            self.user = jwtHelper.decodeToken(self.token);

            self.currentlyLogged = true; //Set flag to TRUE

            //Save token to local storage
            localStorageService.set("jwt", self.token);

            if(self.user.type=="user"){
                console.log("[LOGIN] Obtained token for user " + self.user.username);
            }
            else if(self.user.type=="guest"){
                console.log("[LOGIN] Obtained token for guest " + self.user.mail);
            }
            else{
                console.error("[LOGIN] Unknown type of user");
            }

        };




        /*
         Loads token from local storage and returns true.
         If does not exists, returns false;
         */
        self.loadFromStorage = function(){

            var token = localStorageService.get("jwt");
            if(token){
                self.setNewToken(token);
                return true;
            }
            return false;

        };



        /**
         * Deletes all data of token from memory and storage
         */
        self.deleteCurrentToken = function(){

            //Delete from storage
             localStorageService.remove("jwt");


            //Delete from memory
            self.user = undefined;
            self.token=undefined;

            //Set flag to false
            self.currentlyLogged = false;
        };


        //At start, load from local storage
        self.loadFromStorage();


    }]);
