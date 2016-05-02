'use strict';

angular.module('frontend')

    .controller('AdminMapCtrl', ['$http', 'SessionService', 'uiGmapGoogleMapApi', '$scope', 'PoiService',
        function ($http, SessionService, uiGmapGoogleMapApi, $scope, PoiService) {


            var self = this; //Para no perder la variable this, la guardamos en self (de lo contrario se sobreescribe)


            //Invitado logueado actualmente
            self.guest = SessionService.user;

            //Datos de formulario de login/registro de invitado
            self.loginData = {};


            //Objeto de mapa
            self.map =
            {
                center:{latitude: 42.1365707, longitude: -0.4143509},
                zoom: 3,
                control: {},
                options: {
                    disableDefaultUI: true
                }
            };

            //Estado de POIs y rutas
            self.pois = [];                 //Lista de pois obtenidos de búsqueda
            self.routes = [];               //Lista de rutas obtenidas de búsqueda
            self.favs = [];                 //Lista de POIs favoritos del usuario
            self.following = [];            //Lista de usuarios siguiendo

            self.detailedPoi = undefined;   //Poi actualmente viendo en detalle
            self.detailedRoute = undefined; //Ruta actualmente viendo en detalle

            //Variables de búsqueda
            self.search = {
                creator: "",
                date: ""
            };


            //Controlan si el usuario ha desactivado manualmente cada uno de los tres paneles
            self.resultsPanelActivated = true;
            self.mePanelActivated = true;
            self.infoPanelActivated = true;

            //Controlan si estamos mostrando poi o ruta
            self.showingPoi = false;
            self.showingRoute = false;

            //Controlan qué pestaña está activada (ruta o poi), (favs o following)
            self.followingListEnabled = false;
            self.poiListEnabled = true;

            //Controlan algunos errores
            self.routeError = false;
            self.creatorError = false;




            //Se empieza a hacer declaraciones una vez ha cargado el objeto de mapa -> maps es el objecto google.maps
            uiGmapGoogleMapApi.then(function (maps) {

                //Objetos para las direcciones en Google
                var directionsDisplay = new maps.DirectionsRenderer({suppressMarkers: true});
                var directionsService = new maps.DirectionsService();

                //Eventos al hacer click en un marker
                self.markersEvents = {
                    click: function (marker, eventName, model) {

                        self.showPoiDetail(model.control._id);

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
                 * Comparte el POI actual.
                 */
                self.shareCurrentPoi = function () {

                    alert("Sharing poi");
                };

                /**
                 * Comparte la ruta actual.
                 */
                self.shareCurrentRoute = function () {

                    alert("Sharing route");
                };


                /**
                 * Dado el id de un poi, carga su detalle del backend
                 * y lo muestra en el cuadro de información.
                 * Rellena el objeto también con atributo isFav e isFollowing.
                 * Obtiene también datos del usuario creador
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

                            self.detailedPoi.guestRating = 0;
                            //Ponemos que se está mostrando la info de Poi, no de ruta
                            self.showingRoute = false;
                            self.showingPoi = true;
                            self.showingCreator = true;


                            if (self.guest) { //Puntuación si  es invitado
                                self.getGuestRating(self.detailedPoi._id);
                            }

                            //Puntuación media
                            self.getMeanRating(self.detailedPoi._id);


                            //Procesamos keywordList
                            self.detailedPoi.keywordsList = "None";
                            if (self.detailedPoi.keywords.length > 0) {


                                self.detailedPoi.keywordsList = "";

                                for (var i = 0; i < self.detailedPoi.keywords.length - 1; i++) {
                                    self.detailedPoi.keywordsList += self.detailedPoi.keywords[i] + ", ";
                                }


                                self.detailedPoi.keywordsList += self.detailedPoi.keywords[self.detailedPoi.keywords.length - 1];
                            }

                            //Borramos cualquier posible direction
                            self.clearDirections();
                            return self.showUserDetail(self.detailedPoi.creator);


                        });

                };


                /**
                 * Limpia la búsqueda de POIs
                 */
                self.clearSearch = function () {
                    self.search.creator = "";
                    self.search.date = "";

                };

                /**
                 * Busca pois según search.creator y search.date
                 */
                self.searchPois = function () {



                    var searchObject = {};

                    if (self.search.creator && self.search.creator.length > 0) {
                        searchObject.creator = self.search.creator;
                    }

                    if (self.search.date) {
                        searchObject.date = self.search.date;
                    }

                    PoiService.searchPois(searchObject)
                        .then(function (resultPois) {
                            self.pois = resultPois;
                        });

                };

                /**
                 * Busca routes según search.creator y search.date.
                 */
                self.searchRoutes = function () {


                    var searchObject = {};

                    if (self.search.creator && self.search.creator.length > 0) {
                        searchObject.creator = self.search.creator;
                    }

                    if (self.search.date && self.search.date.length > 0) {
                        searchObject.date = self.search.date;
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


                /**
                 * Devuelve array con pois de self.pois y self.favs, pero sin repetir.
                 */
                self.getShownPois = function () {

                    var shownArray = [];
                    for (var i = 0; i < self.pois.length; i++) {

                        shownArray.push(self.pois[i]);
                    }

                    for (var j = 0; j < self.favs.length; j++) {
                        var isRepeated = false;
                        for (var k = 0; !isRepeated && k < shownArray.length; k++) {

                            if (shownArray[k]._id == self.favs[j]._id) {
                                isRepeated = true;
                            }
                        }
                        if (!isRepeated) {
                            shownArray.push(self.favs[j]);
                        }
                    }
                    console.log(shownArray);
                    return shownArray;

                };


                /**
                 * Obtiene la puntuación media de un POI.
                 */
                self.getMeanRating = function (poiId) {
                    $http.get("/pois/" + poiId + "/ratings/mean")
                        .then(function (response) {

                            self.detailedPoi.avgRating = response.data.message.pointsAvg;
                        })
                        .catch(function (response) {

                            console.log("Error with average");
                            self.detailedPoi.avgRating = "Error";

                            console.log(response);
                        });
                };

                /**
                 * Obtiene la puntuación dada por el invitado a un poi.
                 */
                self.getGuestRating = function (poiId) {
                    $http.get("/pois/" + poiId + "/ratings/" + self.guest.mail)
                        .then(function (response) {

                            self.detailedPoi.guestRating = response.data.message.points;
                            console.log(response);
                        })
                        .catch(function (error) {

                            if (error.status == 404) {
                                //No existe rating por parte de ese invitado -> se pone a 0
                                self.detailedPoi.guestRating = 0;
                            }
                            //console.log(error);
                        });
                };


                /**
                 *
                 * Cambia o añade la puntuación por parte del invitado actual al poi actual
                 */
                self.changeGuestRating = function (newRating) {

                    console.log("new rating");
                    console.log(newRating);
                    //Si no hay rating -> POST
                    if (self.detailedPoi.guestRating == 0) {
                        $http.post("/pois/" + self.detailedPoi._id + "/ratings", {rating: newRating})
                            .then(function (response) {
                                self.detailedPoi.guestRating = response.data.message.points;
                                self.getMeanRating(self.detailedPoi._id);
                                console.log(response);
                            })
                            .catch(function (error) {
                                console.log(error);
                            });
                    }
                    else {
                        $http.put("/pois/" + self.detailedPoi._id + "/ratings/" + self.guest.mail, {rating: newRating})
                            .then(function (response) {
                                self.detailedPoi.guestRating = response.data.message.points;
                                self.getMeanRating(self.detailedPoi._id);
                                console.log(response);
                            })
                            .catch(function (error) {
                                console.log(error);
                            });
                    }




                };


                /**
                 * Esconde todos los paneles derechos.
                 */
                self.hideAllRightPanels = function () {
                    self.showingCreator = false;
                    self.showingPoi = false;
                    self.showingRoute = false;
                };

                /**
                 * Carga los detalles de un usuario y los muestra
                 * en el cuadro de información.
                 */
                self.showUserDetail = function (creatorUsername) {

                    return $http.get("/users/" + creatorUsername)
                        .then(function (response) {
                            self.detailedUser = response.data.message;
                            self.creatorError = false;
                            self.showingCreator = true;

                        })
                        .catch(function (response) {

                            self.showingCreator = true;
                            self.creatorError = "Error showing creator data";
                            console.log(response);
                        });
                };


                //todo: pasar a upn servicio
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
                    self.resultsPanelActivated = !self.resultsPanelActivated;
                };

                self.toggleLeftPanel2 = function () {
                    self.mePanelActivated = !self.mePanelActivated;
                };


                self.toggleRightPanel = function () {
                    self.infoPanelActivated = !self.infoPanelActivated;
                };


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
                                    directionsDisplay.setMap(self.map.control.getGMap());
                                    directionsDisplay.setPanel(document.getElementById('directionsList'));
                                } else {

                                    self.routeError = "Can not calculate route!";
                                    self.clearDirections();
                                    $scope.$apply(); //Hay que aplicar el scope pues esto se ejecuta fuera del control de Angular.
                                }
                            });
                        });


                };


                //Iniciar
                if (self.guest) {
                    self.getGuestDetails();
                }

                self.searchPois();
                self.searchRoutes();



            });


        }]);