'use strict';

/**
 * Servicio que se encarga de la gestión pois
 */
angular.module('frontend')

    .service('StatsService', ['$http','$rootScope',
        function ($http,$rootScope) {


            var self = this;


            var broadcastAlert = function(message){
                $rootScope.$broadcast("errorMessage",
                    { message: message });
            };

            self.getRoutesValidCount = function (username) {
                return $http.get("/stats/users/" + username + "/routes/validCount")
                    .then(function (response) {

                        return response.data.message.count;

                    })
                    .catch(function (exception) {

                        broadcastAlert("Route stats error");
                        console.error(exception);
                    });

            };


            self.getAvgRouteDistance = function(username){
                return $http.get("/stats/users/" + username + "/routes/avgDistance")
                    .then(function(response){

                        return response.data.message;;

                    })
                    .catch(function(exception){

                        broadcastAlert("Route stats error");

                        console.error(exception);
                    });

            };

            self.getMaxDistanceRoute = function(username){
                return $http.get("/stats/users/" + username + "/routes/maxDistance")
                    .then(function(response){

                        return response.data.message;

                    })
                    .catch(function(exception){

                        broadcastAlert("Route stats error");

                        console.error(exception);
                    });

            };

            self.getMinDistanceRoute = function(username){
                return $http.get("/stats/users/" + username + "/routes/minDistance")
                    .then(function(response){

                        return response.data.message;

                    })
                    .catch(function(exception){

                        broadcastAlert("Route stats error");

                        console.error(exception);
                    });

            };

            self.getAvgRouteTime = function(username){
                return $http.get("/stats/users/" + username + "/routes/avgTime")
                    .then(function(response){

                        return response.data.message;

                    })
                    .catch(function(exception){

                        broadcastAlert("Route stats error");

                        console.error(exception);
                    });

            };

            self.getMaxTimeRoute = function(username){
                return $http.get("/stats/users/" + username + "/routes/maxTime")
                    .then(function(response){

                        return response.data.message;

                    })
                    .catch(function(exception){

                        broadcastAlert("Route stats error");

                        console.error(exception);
                    });

            };

            self.getMinTimeRoute = function(username){
                return $http.get("/stats/users/" + username + "/routes/minTime")
                    .then(function(response){

                        return response.data.message;

                    })
                    .catch(function(exception){

                        broadcastAlert("Route stats error");

                        console.error(exception);
                    });

            };

            self.getRoutesGroupedByDistance = function(username){
                return $http.get("/stats/users/" + username + "/routes/groupedByDistance")
                    .then(function(response){

                        return response.data.message;

                    })
                    .catch(function(exception){

                        broadcastAlert("Route stats error");

                        console.error(exception);
                    });
            };

            self.getRoutesGroupedByTime = function(username){
                return $http.get("/stats/users/" + username + "/routes/groupedByTime")
                    .then(function(response){

                        return response.data.message;

                    })
                    .catch(function(exception){

                        broadcastAlert("Route stats error");

                        console.error(exception);
                    });
            }







        }]);
