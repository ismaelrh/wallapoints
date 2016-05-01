'use strict';

angular.module('frontend')

    .controller('MapCtrl', ['$http', 'SessionService', 'uiGmapGoogleMapApi', '$scope', 'PoiService', function ($http, SessionService, uiGmapGoogleMapApi, $scope, PoiService) {


        var self = this; //Para no perder la variable this, la guardamos en self (de lo contrario se sobreescribe)

        self.myOptions = {
            disableDefaultUI: true
        };


        self.guest = SessionService.user;

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
             * Privada: devuelve true si el guest actual tiene en su lista de favoritos el poi con poiId.
             */
            function poiIsInFavList(poiId) {
                var isFav = false;
                for (var i = 0; !isFav && i < self.favs.length; i++) {
                    if (self.favs[i]._id == poiId) {
                        isFav = true;
                    }
                }
                return isFav;

            }

            /**
             * Privada: devuelve true si el guest actual tiene en su lista de siguiendo el usuario con username.
             */
            function userIsInFollowingList(username) {
                var isFollowing = false;
                for (var i = 0; !isFollowing && i < self.following.length; i++) {
                    if (self.following[i].username == username) {
                        isFollowing = true;
                    }
                }
                return isFollowing;
            }


            function deleteFromLocalFavList(poiId) {

                for (var i = 0; i < self.favs.length; i++) {
                    if (self.favs[i]._id == poiId) {
                        self.favs.splice(i, 1);
                    }
                }

            }

            function deleteFromLocalFollowingList(username) {
                for (var i = 0; i < self.following.length; i++) {
                    if (self.following[i].username == username) {
                        self.following.splice(i, 1);
                    }
                }
            }


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

                        //Miramos si es favorito del invitado
                        self.detailedPoi.isFav = poiIsInFavList(self.detailedPoi._id);

                        //Miramos si está siguiendo del usuario
                        self.detailedPoi.isFollowing = userIsInFollowingList(self.detailedPoi.creator);

                        //Ponemos que se está mostrando la info de Poi, no de ruta
                        self.showingRoute = false;
                        self.showingPoi = true;

                        //Borramos cualquier posible direction
                        self.clearDirections();

                    });

            };

            /**
             * Busca pois según searchByCreator y searchByDate.
             */
            self.searchPois = function () {

                var searchObject = {};

                if (self.searchByCreator && self.searchByCreator.length > 0) {
                    searchObject.creator = self.searchByCreator;
                }

                if (self.searchByDate && self.searchByDate.length > 0) {
                    searchObject.date = self.searchByDate;
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
             * Cambia el estado de favorito de un poi, para el invitado actual.
             */
            self.toggleFav = function (poiId) {

                //Buscamos si ya está como favorito

                var isFav = poiIsInFavList(self.detailedPoi._id);

                if (isFav) { //Está en favoritos -> Se borra

                    PoiService.unsetFav(self.guest.mail, self.detailedPoi._id)
                        .then(function (success) {

                            //Borramos de favoritos localmente
                            self.detailedPoi.isFav = false;
                            deleteFromLocalFavList(self.detailedPoi._id);

                        });
                }
                else { //No está en favoritos -> se añade

                    PoiService.setFav(self.guest.mail, self.detailedPoi._id)
                        .then(function (success) {

                            //Añadimos a fav localmente
                            self.detailedPoi.isFav = true;
                            self.favs.push(self.detailedPoi);

                        });
                }

            };

            /**
             * Cambia el estado de 'siguiendo' de un usuario, para el invitado actual.
             */
            self.toggleFollowing = function (username) {


                //Buscamos si ya está como 'siguiendo'
                var isFollowing = userIsInFollowingList(self.detailedPoi.creator);

                if (isFollowing) { //Está siguiendo, por lo que quita de siguienod
                    PoiService.unfollowUser(self.guest.mail, self.detailedPoi.creator)
                        .then(function (success) {

                            //Borramos de lista local de siguiendo
                            self.detailedPoi.isFollowing = false;
                            deleteFromLocalFollowingList(self.detailedPoi.creator);

                        });
                }
                else { //No siguiendo, lo añade a siguienod

                    PoiService.followUser(self.guest.mail, self.detailedPoi.creator)
                        .then(function (success) {

                            //Añadimos a lista local de siguiendo
                            self.detailedPoi.isFollowing = true;
                            self.following.push({username: username});

                        });
                }

            };


            //todo: pasar a un servicio
            self.logoutGuest = function () {
                SessionService.deleteCurrentToken();
                self.guest = null;

            };

            /**
             * Hace log-in, obtiene datos de usuario, favs y followings.
             */
            //todo: pasar a un servicio
            self.loginGuest = function () {

                $http.post("/guests/login", {mail: self.loginData.mail, password: self.loginData.password})
                    .then(function (response) {
                        var jwtToken = response.data.message;

                        SessionService.setNewToken(jwtToken);
                        self.guest = SessionService.user;
                        //Todo: alertas
                        console.log("Guest logged-in: " + self.guest.mail);
                        return self.getGuestDetails();


                    })
                    .catch(function (response) {

                        //Todo: alerta
                        console.log("Error loggin guest");
                    });


            };

            //todo: pasar a servicio
            self.getGuestDetails = function () {
                return $http.get("/guests/" + self.guest.mail + "/favs")
                    .then(function (response) {
                        self.favs = response.data.message;
                        console.log("Got favs: " + self.favs.length);
                        console.log(self.favs);
                        return $http.get("/guests/" + self.guest.mail + "/following");
                    })
                    .then(function (response) {
                        console.log("Got following: " + self.following.length);

                        self.following = response.data.message;
                    })
                    .catch(function (response) {

                        //Todo: alerta
                        console.log("Error obtaining details");
                    });
            };


            //todo: pasar a servicio
            self.registerGuest = function () {

                $http.post("/guests", {mail: self.loginData.mail, password: self.loginData.password})
                    .then(function (response) {

                        //Now, log-in
                        console.log("Guest registered: " + self.loginData.mail);
                        self.loginGuest();

                        //Todo: alerta

                    }, function (response) {

                        //Todo: alerta
                        console.log("Error registerings guest");
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


            //Iniciar
            self.getGuestDetails();
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
                PoiService.loadDetailRoute(id)
                    .then(function (detailedRoute) {

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