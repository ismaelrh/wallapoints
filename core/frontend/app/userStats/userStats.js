'use strict';

angular.module('frontend')

.controller('UserStatsCtrl', ['$http','SessionService','StatsService','$rootScope',function($http,SessionService,StatsService,$rootScope) {

    var self = this; //Para no perder la variable this, la guardamos en self (de lo contrario se sobreescribe)

    self.user= SessionService.user;


    self.minTimeRoute = {};
    self.maxTimeRoute = {};
    self.minDistanceRoute = {};
    self.maxDistanceRoute = {};

    self.routesByDistance = {
        labels: [0],
        data: [0]
    };
    self.routesByTime = {
        labels: [0],
        data: [0]
    };

    self.hasRouteData = true;

    $rootScope.$on("Route stats error", function (event, args) {
        self.hasRouteData = false;
    });


    /**
     * Se obtiene la cuenta de rutas válidas (con distancia y tiempo).
     * Si es 0, no se cargan las demás estadísticas.
     */
    StatsService.getRoutesValidCount(self.user.username).
        then(function(response){
        if(response==0){
            self.hasRouteData = false;
        }
        else{
            StatsService.getAvgRouteDistance(self.user.username)
                .then(function(response){

                    self.avgRouteDistance = response.avgDistance/1000.0; //A km
                    self.routeCount = response.count;
                });

            StatsService.getAvgRouteTime(self.user.username)
                .then(function(response){

                    self.avgRouteTime= response.avgTime;
                    console.log("avg: " + response.avgTime);
                    self.routeCount = response.count;
                });


            StatsService.getMaxDistanceRoute(self.user.username)
                .then(function(response){

                    self.maxDistanceRoute.distance = response.distance/1000.0; //A km
                    self.maxDistanceRoute.name = response.name;
                    self.maxDistanceRoute.start = response.pois[0].name;
                    self.maxDistanceRoute.end = response.pois[response.pois.length -1].name;
                });

            StatsService.getMinDistanceRoute(self.user.username)
                .then(function(response){


                    self.minDistanceRoute.distance = response.distance/1000.0; //A km
                    self.minDistanceRoute.name = response.name;
                    self.minDistanceRoute.start = response.pois[0].name;
                    self.minDistanceRoute.end = response.pois[response.pois.length -1].name;
                });

            StatsService.getMaxTimeRoute(self.user.username)
                .then(function(response){

                    self.maxTimeRoute.time = response.time;
                    console.log("max: " + response.time);
                    self.maxTimeRoute.name = response.name;
                    self.maxTimeRoute.start = response.pois[0].name;
                    self.maxTimeRoute.end = response.pois[response.pois.length -1].name;
                });

            StatsService.getMinTimeRoute(self.user.username)
                .then(function(response){


                    self.minTimeRoute.time = response.time;
                    console.log("min: " + response.time);
                    self.minTimeRoute.name = response.name;
                    self.minTimeRoute.start = response.pois[0].name;
                    self.minTimeRoute.end = response.pois[response.pois.length -1].name;
                });

            StatsService.getRoutesGroupedByDistance(self.user.username)
                .then(function(response){

                    self.routesByDistance = response;
                });

            StatsService.getRoutesGroupedByTime(self.user.username)
                .then(function(response){

                    self.routesByTime = response;
                });
        }

    });





    self.logOut = function(){
        SessionService.logOut();
    };






}]);