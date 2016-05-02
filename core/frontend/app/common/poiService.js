'use strict';

/**
 * Servicio que se encarga de la gestión pois
 */
angular.module('frontend')

    .service('PoiService', ['$http','$rootScope',
        function ($http,$rootScope) {


            var self = this;


            var broadcastAlert = function(message){
                $rootScope.$broadcast("errorMessage",
                    { message: message });
            };

            self.loadDetailPoi = function(poiId){

                return $http.get("/pois/" + poiId)

                    .then(function(response){

                        return response.data.message;

                    })
                    .catch(function(exception){

                        broadcastAlert("Could not load POI detail");

                        console.error(exception);
                    });

            };



            self.searchPois = function (searchObject) {

                return $http.post("/pois/search", searchObject)
                    .then(function (response) {
                        return response.data.message;
                    })
                    .catch(function (exception) {
                        broadcastAlert("Could not search POIs");
                        console.error(exception);
                    });


            };

            self.searchRoutes = function (searchObject) {

                return $http.post("/routes/search", searchObject)
                    .then(function (response) {
                        return response.data.message;
                    })
                    .catch(function (exception) {
                        broadcastAlert("Could not search routes");
                        console.error(exception);
                    });


            };

            self.loadDetailRoute = function(routeId){
                return $http.get("/routes/" + routeId)
                    .then(function(result){

                        return result.data.message;
                    })
                    .catch(function(exception){
                        broadcastAlert("Could not load route detail");
                        console.error(exception);
                    });
            };


            self.getMeanRating = function(poiId){
                return $http.get("/pois/" + poiId + "/ratings/mean")
                    .then(function(result){

                        return result.data.message.pointsAvg;
                    })
                    .catch(function(exception){
                        broadcastAlert("Could not get mean rating of POI");
                        console.error(exception);
                    });
            };


            self.getGuestRating = function(poiId,guestMail){
                return  $http.get("/pois/" + poiId + "/ratings/" + guestMail)
                    .then(function(result){

                        return result.data.message.points;
                    })
                    .catch(function(exception){
                        if(exception.status == 404){
                            return 0;
                        }
                        else{
                            broadcastAlert("Could not get rating of POI from Guest");
                            console.error(exception);
                        }

                    });

            };


            self.changeGuestRating = function(poiId,guestMail,currentRating,newRating){
                if(currentRating==0){ //Post
                    return $http.post("/pois/" + poiId + "/ratings", {rating: newRating})
                        .then(function(result){
                            return result.data.message.points;
                        })
                        .catch(function(exception){
                            broadcastAlert("Could not add rating");
                            console.error(exception);
                        });
                }
                else{
                    return $http.put("/pois/" + poiId + "/ratings/" + guestMail, {rating: newRating})
                        .then(function(result){
                            return result.data.message.points;
                        })
                        .catch(function(exception){
                            broadcastAlert("Could not modify rating");
                            console.error(exception);
                        });
                }
            }




        }]);
