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
            }





        }]);
