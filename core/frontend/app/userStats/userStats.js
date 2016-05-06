'use strict';
/**
 * Controlador de pantalla de estadísticas del propio usuario.
 * @author Ismael Rodríguez, Sergio Soro, David Vergara. 2016.
 */
angular.module('frontend')

    .controller('UserStatsCtrl', ['SessionService', 'StatsService', '$rootScope', function (SessionService, StatsService, $rootScope) {

        var self = this; //Para no perder la variable this, la guardamos en self (de lo contrario se sobreescribe)

        self.user = SessionService.user;


        self.minTimeRoute = {};
        self.maxTimeRoute = {};
        self.minDistanceRoute = {};
        self.maxDistanceRoute = {};
        self.maxPoiElevation = {};
        self.minPoiElevation = {};

        self.routesByDistance = {
            labels: [0],
            data: [0]
        };
        self.routesByTime = {
            labels: [0],
            data: [0]
        };
        self.routesByCountry = {
            labels: [0],
            data: [0]
        };
        self.routesByCity = {
            labels: [0],
            data: [0]
        };

        //Para mostrar alerta cuando hay errores
        self.alert = {
            show: false,
            message: ""
        };


        self.hasRouteData = true;
        self.hasPoiData = true;

        //Para mostrar alerta
        $rootScope.$on("errorMessage", function (event, args) {
            showAlert("danger", args.message);
        });


        function showAlert(type, message) {
            self.alert.show = true;
            self.alert.type = type;
            self.alert.message = message;
            if (self.alert.type == "danger") {
                self.alert.title = "Error!";
            }
            if (self.alert.type == "warning") {
                self.alert.title = "Warning!"
            }
            if (self.alert.type == "success") {
                self.alert.title = "Success!";
            }
        }


        /**
         * Se obtiene la cuenta de rutas válidas (con distancia y tiempo).
         * Si es 0, no se cargan las demás estadísticas.
         */
        StatsService.getRoutesValidCount(self.user.username).then(function (response) {
            if (response == 0) {
                self.hasRouteData = false;
            }
            else {
                StatsService.getAvgRouteDistance(self.user.username)
                    .then(function (response) {

                        self.avgRouteDistance = response.avgDistance / 1000.0; //A km
                        self.routeCount = response.count;
                    });

                StatsService.getAvgRouteTime(self.user.username)
                    .then(function (response) {

                        self.avgRouteTime = response.avgTime;

                        self.routeCount = response.count;
                    });


                StatsService.getMaxDistanceRoute(self.user.username)
                    .then(function (response) {

                        self.maxDistanceRoute.distance = response.distance / 1000.0; //A km
                        self.maxDistanceRoute.name = response.name;
                        self.maxDistanceRoute.start = response.pois[0].name;
                        self.maxDistanceRoute.end = response.pois[response.pois.length - 1].name;
                    });

                StatsService.getMinDistanceRoute(self.user.username)
                    .then(function (response) {


                        self.minDistanceRoute.distance = response.distance / 1000.0; //A km
                        self.minDistanceRoute.name = response.name;
                        self.minDistanceRoute.start = response.pois[0].name;
                        self.minDistanceRoute.end = response.pois[response.pois.length - 1].name;
                    });

                StatsService.getMaxTimeRoute(self.user.username)
                    .then(function (response) {

                        self.maxTimeRoute.time = response.time;

                        self.maxTimeRoute.name = response.name;
                        self.maxTimeRoute.start = response.pois[0].name;
                        self.maxTimeRoute.end = response.pois[response.pois.length - 1].name;
                    });

                StatsService.getMinTimeRoute(self.user.username)
                    .then(function (response) {


                        self.minTimeRoute.time = response.time;

                        self.minTimeRoute.name = response.name;
                        self.minTimeRoute.start = response.pois[0].name;
                        self.minTimeRoute.end = response.pois[response.pois.length - 1].name;
                    });

                StatsService.getRoutesGroupedByDistance(self.user.username)
                    .then(function (response) {

                        self.routesByDistance = response;
                    });

                StatsService.getRoutesGroupedByTime(self.user.username)
                    .then(function (response) {

                        self.routesByTime = response;
                    });
            }

        });


        /**
         * Se obtiene la cuenta de pois válidos (con altitud).
         * Si es 0, no se cargan las demás estadísticas.
         */
        StatsService.getPoisValidCount(self.user.username).then(function (response) {
            if (response == 0) {
                self.hasPoiData = false;
                console.log("Failed getPoisValidCount");
            }
            else {
                StatsService.getAvgPoiElevation(self.user.username)
                    .then(function (response) {

                        self.avgPoiElevation = response.avgPoiElevation;
                        console.log("avg elevtion: " + response.avgPoiElevation);
                        self.poiCount = response.count;
                    });


                StatsService.getMaxPoiElevation(self.user.username)
                    .then(function (response) {

                        self.maxPoiElevation.elevation = response.elevation;
                        self.poiMaxName = response.name;
                        console.log("max poi elevation: " + response.elevation);
                    });

                StatsService.getMinPoiElevation(self.user.username)
                    .then(function (response) {

                        self.poiMinName = response.name;
                        self.minPoiElevation.elevation = response.elevation;
                        console.log("min poi elevation: " + response.elevation);
                    });

                StatsService.getPoisGroupedByCity(self.user.username)
                    .then(function (response) {

                        self.routesByCity = response;
                    });

                StatsService.getPoisGroupedByCountry(self.user.username)
                    .then(function (response) {

                        self.routesByCountry = response;
                    });

            }

        });


        self.logOut = function () {
            SessionService.logOut();
        };

    }]);


