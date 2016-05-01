'use strict';

angular.module('frontend')

    .controller('AdminMapCtrl', ['$http', 'SessionService', 'uiGmapGoogleMapApi', '$scope', 'PoiService',
        function ($http, SessionService, uiGmapGoogleMapApi, $scope, PoiService) {


        var self = this; //Para no perder la variable this, la guardamos en self (de lo contrario se sobreescribe)

        self.myOptions = {
            disableDefaultUI: true
        };


        self.as = 0;

        self.mapControl = {};
        self.showLeftPanel = true;
        self.showLeftPanel2 = true;
        self.showRightPanel = true;
        self.map = {center: {latitude: 42.1365707, longitude: -0.4143509}, zoom: 3, control: {}};
        self.detailedPoi = undefined;
        self.detailedRoute = undefined;
        self.pois = [];
        self.showingPoi = false;
        self.showingRoute = false;
        self.routeError = false;
        self.creatorError = false;
        self.searchByDate = "";
        self.searchByCreator = "";

        self.followingListEnabled = false;
        self.poiListEnabled = true;
        self.loginData = {};


        self.colapse = false;


        self.favs = [];
        self.following = [];
        self.pois = [];

        //Se empieza a hacer declaraciones una vez ha cargado el objeto de mapa -> maps es el objecto google.maps
        uiGmapGoogleMapApi.then(function (maps) {

            //Objetos para las direcciones en Google
            var directionsDisplay = new maps.DirectionsRenderer({suppressMarkers: true});
            var directionsService = new maps.DirectionsService();

            //Eventos al hacer click en un marker
            self.markersEvents = {
                click: function (marker, eventName, model) {


                    self.showPoiDetail(model.control._id);


                },
                mouseover: function (marker, eventName, model) {


                    model.show = true;

                },
                mouseout: function (marker, eventName, model) {
                    model.show = false;

                }
            };







            /**
             * Dado el id de un poi, carga su detalle del backend
             * y lo muestra en el cuadro de información.
             * Rellena el objeto también con atributo isFav e isFollowing.
             */
            self.showPoiDetail = function (_id) {

                return PoiService.loadDetailPoi(_id)
                    .then(function (detailedPoi) {

                        //Obtenemos Poi detallado
                        self.detailedPoi = detailedPoi;



                        self.detailedPoi.guestRating = 0;
                        //Ponemos que se está mostrando la info de Poi, no de ruta
                        self.showingRoute = false;
                        self.showingPoi = true;
                        self.showingCreator = true;


                        self.getMeanRating(self.detailedPoi._id);

                        //Borramos cualquier posible direction
                        self.clearDirections();



                    })
                    .then(function(){

                        return $http.get("/users/" + self.detailedPoi.creator)
                            .then(function(response){
                                self.detailedUser = response.data.message;
                                self.creatorError = false;


                            })
                            .catch(function(response){

                                self.creatorError = "Error showing creator data";
                                console.log(response);
                            });
                    });

            };



            self.clearSearch = function(){
                self.searchByCreator = null;
                self.searchByDate = null;

            };

            /**
             * Busca pois según searchByCreator y searchByDate.
             */
            self.searchPois = function () {

                var searchObject = {};

                if (self.searchByCreator && self.searchByCreator.length > 0) {
                    searchObject.creator = self.searchByCreator;
                }

                if (self.searchByDate) {
                    searchObject.date = self.searchByDate;
                    console.log("Searching by date: " + self.searchByDate);
                }

                PoiService.searchPois(searchObject)
                    .then(function (resultPois) {
                        self.pois = resultPois;
                    });

            };

            /**
             * Busca routes según searchByCreator y searchByDate.
             */
            self.searchRoutes = function () {


                var searchObject = {};

                if (self.searchByCreator && self.searchByCreator.length > 0) {
                    searchObject.creator = self.searchByCreator;
                }

                if (self.searchByDate && self.searchByDate.length > 0) {
                    searchObject.date = self.searchByDate;
                }

                PoiService.searchRoutes(searchObject)
                    .then(function (routeList) {
                        self.routes = routeList;
                    });


            };

            /**
             * Centra el mapa en un POI determinado.
             */
            self.centerMapInPoi = function (poi) {
                self.map.center = {latitude: poi.lat, longitude: poi.long};
                self.map.zoom = 7;
            };





            /**
             * Devuelve array con pois de self.pois
             */
            self.getShownPois = function(){

                var shownArray = [];
                for(var i = 0; i < self.pois.length; i++){

                    shownArray.push(self.pois[i]);
                }

                return shownArray;

            };


            self.getMeanRating = function(poiId){
                $http.get("/pois/" + poiId + "/ratings/mean")
                    .then(function(response){

                        self.detailedPoi.avgRating = response.data.message.pointsAvg;
                    })
                    .catch(function(response){

                        console.log("Error with average");
                        self.detailedPoi.avgRating = "Error";

                        console.log(response);
                    });
            };




            self.hideAllRightPanels = function(){
                self.showingCreator = false;
                self.showingPoi = false;
                self.showingRoute = false;
            };

            self.showUserDetail = function(creatorUsername){

                return $http.get("/users/" + creatorUsername)
                    .then(function(response){
                        self.detailedUser = response.data.message;
                        self.creatorError = false;
                        self.showingCreator = true;

                    })
                    .catch(function(response){

                        self.showingCreator = true;
                        self.creatorError = "Error showing creator data";
                        console.log(response);
                    });
            };





            self.toggleLeftPanel = function () {
                self.showLeftPanel = !self.showLeftPanel;
            };

            self.toggleLeftPanel2 = function () {
                self.showLeftPanel2 = !self.showLeftPanel2;
            };


            self.toggleRightPanel = function () {
                self.showRightPanel = !self.showRightPanel;
            };



            self.searchPois();
            self.searchRoutes();



            /**
             * Borra la ruta tanto del mapa como del panel.
             */
            self.clearDirections = function () {
                directionsDisplay.setMap(null);
                directionsDisplay.setPanel(null);
            };


            /**
             * Calcula la ruta óptima segun google de la route con id "id",
             * y la muestra por mapa.
             */
            self.showAndCalculateRoute = function (id) {


                self.showingRoute = true;
                self.showingPoi = false;

                self.routeError = false;
                //Cogemos del backend los pois
                return PoiService.loadDetailRoute(id)
                    .then(function (detailedRoute) {


                        self.showingCreator = true;



                        self.detailedRoute = detailedRoute;

                        var poiList = detailedRoute.pois;
                        if (poiList.length < 2) {
                            alert("Need two or more points to calculate route");
                            return;
                        }

                        //Punto inicial y final
                        var originAddress = new maps.LatLng(poiList[0].lat, poiList[0].long);
                        var destinationAddress = new maps.LatLng(poiList[poiList.length - 1].lat, poiList[poiList.length - 1].long);

                        //Se añaden los puntos intermedios como waypoints
                        var waypoints = [];
                        for (var i = 1; i < poiList.length - 1; i++) {

                            waypoints.push({
                                location: new maps.LatLng(poiList[i].lat, poiList[i].long),
                                stopover: true
                            });

                        }

                        var request = {
                            origin: originAddress,
                            destination: destinationAddress,
                            waypoints: waypoints,
                            optimizeWaypoints: false,
                            travelMode: maps.DirectionsTravelMode.DRIVING
                        };


                        //Se pide la ruta a Google MAPS
                        directionsService.route(request, function (response, status) {

                            if (status === maps.DirectionsStatus.OK) {
                                directionsDisplay.setDirections(response);
                                directionsDisplay.setMap(self.mapControl.getGMap());
                                directionsDisplay.setPanel(document.getElementById('directionsList'));
                            } else {

                                self.routeError = "Can not calculate route!";
                                self.clearDirections();
                                $scope.$apply(); //Hay que aplicar el scope pues esto se ejecuta fuera del control de Angular.
                            }
                        });
                    });


            };


        });


    }]);