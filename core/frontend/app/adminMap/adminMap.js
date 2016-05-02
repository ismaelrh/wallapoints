'use strict';

angular.module('frontend')

    .controller('AdminMapCtrl', ['SessionService', 'uiGmapGoogleMapApi', '$scope', 'PoiService', '$rootScope','GuestService','UserService',
        function (SessionService, uiGmapGoogleMapApi, $scope, PoiService,$rootScope,GuestService,UserService) {


            var self = this; //Para no perder la variable this, la guardamos en self (de lo contrario se sobreescribe)

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
                date: "",
                keywords: ""
            };


            //Controlan si el usuario ha desactivado manualmente cada uno de los tres paneles
            self.resultsPanelActivated = true;
            self.infoPanelActivated = true;

            //Controlan si estamos mostrando poi o ruta
            self.showingPoi = false;
            self.showingRoute = false;

            //Controlan algunos errores
            self.routeError = false;
            self.creatorError = false;


            //Controlan qúe pestaña se muestra
            self.followingListEnabled = false;
            self.poiListEnabled = true;



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

                self.logOut = function(){
                    SessionService.logOut();
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


                            //Ponemos que se está mostrando la info de Poi, no de ruta
                            self.showingRoute = false;
                            self.showingPoi = true;
                            self.showingCreator = true;


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


                            //Buscamos rutas de los pois mostrados
                            self.searchRoutes(self.pois);

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
                 * Obtiene la puntuación media de un POI.
                 */
                self.getMeanRating = function (poiId) {
                    PoiService.getMeanRating(poiId)
                        .then(function (avgRating) {

                            self.detailedPoi.avgRating = avgRating;
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






                self.toggleLeftPanel = function () {
                    self.resultsPanelActivated = !self.resultsPanelActivated;
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

                            //Cargamos detalles
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
                self.searchPois();



            });


        }]);