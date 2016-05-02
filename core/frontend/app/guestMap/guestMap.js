'use strict';

angular.module('frontend')

    .controller('MapCtrl', ['SessionService', 'uiGmapGoogleMapApi', '$scope', 'PoiService', '$rootScope','GuestService','UserService',
        function (SessionService, uiGmapGoogleMapApi, $scope, PoiService,$rootScope,GuestService,UserService) {


            var self = this; //Para no perder la variable this, la guardamos en self (de lo contrario se sobreescribe)


            //Invitado logueado actualmente
            self.guest = SessionService.user;
            //Si no es guest, tratamos como no autentificado
            if(self.guest && self.guest.type!="guest"){
                self.guest = undefined;
            }

            //Datos de formulario de login/registro de invitado
            self.loginData = {};


            //Para mostrar alerta cuando hay errores
            self.alert = {
                show: false,
                message: ""
            };

            //Objeto de mapa
            self.map =
            {
                center:{latitude: 42.1365707, longitude: -0.4143509},
                zoom: 3,
                control: {},
                options: {
                    disableDefaultUI: true
                },
                hoverPoiList: [] //Lista de IDs de  markers con el ratón encima
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

                    },
                    mouseover: function (marker, eventName, model) {

                        if(model.control){
                            self.map.hoverPoiList.push(model.control._id);
                        }


                    },
                    mouseout: function (marker, eventName, model) {
                        if(model.control){
                            var index = self.map.hoverPoiList.indexOf(model.control._id);
                            if(index>-1){
                                self.map.hoverPoiList.splice(index,1);
                            }
                        }


                    }
                };



                function showAlert(type,message){
                    self.alert.show = true;
                    self.alert.type = type;
                    self.alert.message = message;
                    if(self.alert.type=="danger"){
                        self.alert.title = "Error!";
                    }
                    if(self.alert.type=="warning"){
                        self.alert.title = "Warning!"
                    }
                    if(self.alert.type=="success"){
                        self.alert.title = "Success!";
                    }
                }

                function clearAlert(){
                    self.alert.show = false;
                    self.alert.type = "default";
                    self.alert.message = "";
                }


                $rootScope.$on("errorMessage", function (event, args) {
                    showAlert("danger",args.message);
                });

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
                 *  Devuelve true si el guest actual tiene en su lista de siguiendo el usuario con username.
                 */
                self.userIsInFollowingList = function(username) {
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
                 * Devuelve cierto si el poi está en la ruta seleccionada actual.
                 * False en caso contrario.
                 */
                self.isPoiOnDetailedRoute = function(poi){
                    if(!self.detailedRoute){
                        return false;
                    }
                    var is = false;
                    for(var i = 0; !is && i < self.detailedRoute.pois.length; i++){
                        if(self.detailedRoute.pois[i]._id == poi._id){
                            is = true;
                        }
                    }
                    return is;
                };
                /**
                 * Devuelve el label del marker para el poi indicado.
                 * Será estrella si es favorito, nada si no lo es.
                 */
                self.getMarkerLabel = function(poi){


                    if(poi.isFav){
                        return "★";
                    }
                    else{
                        return undefined;
                    }

                };
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
                            self.detailedPoi.isFollowing = self.userIsInFollowingList(self.detailedPoi.creator);

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
                    self.search.keywords = "";

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

                    if(self.search.keywords && self.search.keywords.length > 0){
                        //Formamos array de keywords a partir de lista separada por comas
                        searchObject.keywords = self.search.keywords.split(",");
                        for(var i = 0; i < searchObject.keywords.length; i++){
                            searchObject.keywords[i] = searchObject.keywords[i].trim();
                        }

                        //Cuando no se pone ninguna keyword, que quede vacío el array
                        if(searchObject.keywords.length == 1 && searchObject.keywords[0].length==0){
                            searchObject.keywords = [];
                        }
                    }

                    PoiService.searchPois(searchObject)
                        .then(function (resultPois) {
                            self.pois = resultPois;

                            //Mezclamos con fav y buscamos aquellas rutas que contenga, o el resultado, o los favs
                            var todosPoi = self.getShownPois();
                            self.searchRoutes(todosPoi);

                        });




                };

                /**
                 * Busca routes que contengan al menos uno de los pois pasados.
                 */
                self.searchRoutes = function (listaPois) {

                    var arrayToSend = [];
                    for(var i = 0; i < listaPois.length;i++){
                        arrayToSend.push(listaPois[i]._id);
                    }

                    PoiService.searchRoutes({pois:arrayToSend})
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

                        GuestService.unsetFav(self.guest.mail, self.detailedPoi._id)
                            .then(function (success) {

                                //Borramos de favoritos localmente
                                self.detailedPoi.isFav = false;
                                deleteFromLocalFavList(self.detailedPoi._id);

                            });
                    }
                    else { //No está en favoritos -> se añade

                        GuestService.setFav(self.guest.mail, self.detailedPoi._id)
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


                    var isFollowing = self.userIsInFollowingList(username);



                    if (isFollowing) { //Está siguiendo, por lo que quita de siguienod
                        GuestService.unfollowUser(self.guest.mail, username)
                            .then(function (success) {

                                //Borramos de lista local de siguiendo
                                if(self.detailedPoi){
                                    self.detailedPoi.isFollowing = false;
                                }

                                deleteFromLocalFollowingList(username);

                            });
                    }
                    else { //No siguiendo, lo añade a siguienod

                        GuestService.followUser(self.guest.mail,username)
                            .then(function (success) {

                                //Añadimos a lista local de siguiendo
                                if(self.detailedPoi){
                                    self.detailedPoi.isFollowing = true;
                                }

                                self.following.push({username: username});

                            });
                    }

                };


                /**
                 * Devuelve array con pois de self.pois y self.favs, pero sin repetir.
                 * Además, pone isFav = true a los que sean favs.
                 */
                self.getShownPois = function () {

                    var shownArray = [];
                    for (var i = 0; i < self.pois.length; i++) {
                        shownArray.push(self.pois[i]);
                        self.pois[i].isFav= false;
                    }

                    for (var j = 0; j < self.favs.length; j++) {
                        var isRepeated = false;
                        var repeatedIndex = -1;
                        for (var k = 0; !isRepeated && k < shownArray.length; k++) {

                            if (shownArray[k]._id == self.favs[j]._id) {
                                isRepeated = true;
                                repeatedIndex = k;
                            }
                        }
                        if (!isRepeated) {
                            shownArray.push(self.favs[j]);
                            self.favs[j].isFav = true;
                        }
                        else{
                            shownArray[repeatedIndex].isFav = true;
                        }
                    }

                    return shownArray;

                };


                /**
                 * Obtiene la puntuación media de un POI.
                 */
                self.getMeanRating = function (poiId) {
                    PoiService.getMeanRating(poiId)
                        .then(function (avgRating) {

                            self.detailedPoi.avgRating = avgRating;
                        });
                };

                /**
                 * Obtiene la puntuación dada por el invitado a un poi.
                 */
                self.getGuestRating = function (poiId) {
                    PoiService.getGuestRating(poiId,self.guest.mail)
                        .then(function (points) {
                            self.detailedPoi.guestRating = points;
                        });
                };


                /**
                 * Cambia o añade la puntuación por parte del invitado actual al poi actual
                 */
                self.changeGuestRating = function (newRating) {

                    PoiService.changeGuestRating(self.detailedPoi._id,self.guest.mail,self.detailedPoi.guestRating,newRating)
                        .then(function (points) {
                            self.detailedPoi.guestRating = points;

                        });


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

                    return UserService.getUserDetail(creatorUsername)
                        .then(function (user) {
                            self.detailedUser = user;
                            self.creatorError = false;
                            self.showingCreator = true;

                        });
                };


                /**
                 * Cierra sesión de invitado
                 */
                self.logoutGuest = function () {
                    SessionService.logOut();

                };


                /**
                 * Hace login de invitado
                 */
                self.loginGuest = function () {

                    GuestService.login(self.loginData.mail,self.loginData.password)
                        .then(function (jwtToken) {

                            SessionService.setNewToken(jwtToken);
                            self.guest = SessionService.user;

                            showAlert("success","Welcome :)");
                            return self.getGuestDetails();

                        })
                        .catch(function(exception){
                            //Este error salta cuando nos dan 401 -> Incorrect mail or password
                        });


                };


                /**
                 * Obtiene favoritos y siguiendo de invitado
                 */
                self.getGuestDetails = function () {
                    return GuestService.getFavs(self.guest.mail)
                        .then(function (favs) {
                            self.favs = favs;
                            return GuestService.getFollowing(self.guest.mail)
                        })
                        .then(function (following) {

                            self.following = following;
                        });
                };


                /**
                 * Registra un nuevo invitado.
                 */
                self.registerGuest = function () {

                    GuestService.register(self.loginData.mail,self.loginData.password)
                        .then(function (response) {

                            self.loginGuest();

                        })
                        .catch(function(exception){

                            //Error al registrar, no hacemos log-in (El servicio ha propagado el error)
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

                            self.showUserDetail(self.detailedRoute.creator);

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


                                    //Para cada punto de la ruta, mostramos un marker
                                    self.routeMarkers = [];
                                    for(var i = 0; i < self.detailedRoute.pois.length; i++){
                                        self.detailedRoute.pois[i].order = "" + String.fromCharCode(65+i);
                                        self.routeMarkers.push(self.detailedRoute.pois[i]);
                                    }
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




            });


        }]);