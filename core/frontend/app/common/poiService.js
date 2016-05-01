'use strict';

/**
 * Servicio que se encarga de la gestión de tokens de usuario.
 */
angular.module('frontend')

    .service('PoiService', ['$http',
        function ($http) {


            var self = this;

            self.loadDetailPoi = function(poiId){

                return $http.get("/pois/" + poiId)

                    .then(function(response){

                        return response.data.message;

                    })
                    .catch(function(exception){

                        console.error(exception);
                    });

            };


            self.setFav = function(guestMail,poiId){
                return $http.put("/guests/" +guestMail + "/favs/" + poiId,{})
                    .then(function(response){

                        return response.data.message;
                    })
                    .catch(function(exception){
                        console.error(exception);

                    });

            };

            self.unsetFav = function(guestMail,poiId){
                return $http.delete("/guests/" +guestMail + "/favs/" + poiId)
                    .then(function(response){

                        return response.data.message;
                    })
                    .catch(function(exception){
                        console.error(exception);

                    });

            };

            self.followUser = function(guestMail,user){

                return $http.put("/guests/" + guestMail + "/following/" + user,{})
                    .then(function(response){

                        return response.data.message;
                    })
                    .catch(function(exception){
                        console.error(exception);

                    });

            };

            self.unfollowUser = function(guestMail,user){

                return $http.delete("/guests/" + guestMail + "/following/" + user)
                    .then(function(response){

                        return response.data.message;
                    })
                    .catch(function(exception){
                        console.error(exception);

                    });
            };

            self.searchPois = function (searchObject) {

                return $http.post("/pois/search", searchObject)
                    .then(function (response) {
                        return response.data.message;
                    })
                    .catch(function (error) {
                        return null;
                        console.error("Error obtaining pois");
                    });


            };

            self.searchRoutes = function (searchObject) {

                return $http.post("/routes/search", searchObject)
                    .then(function (response) {
                        return response.data.message;
                    })
                    .catch(function (error) {
                        return null;
                        console.error("Error obtaining pois");
                    });


            };

            self.loadDetailRoute = function(routeId){
                return $http.get("/routes/" + routeId)
                    .then(function(result){

                        return result.data.message;
                    })
                    .catch(function(err){
                        console.error(err);
                    });
            }



        }]);
