'use strict';

angular.module('frontend')

    .controller('UserMapCtrl', ['$http', 'SessionService', 'uiGmapGoogleMapApi', '$scope', 'PoiService',
        function ($http, SessionService, uiGmapGoogleMapApi, $scope, PoiService) {


            var self = this; //Para no perder la variable this, la guardamos en self (de lo contrario se sobreescribe)

            self.myOptions = {
                disableDefaultUI: true
            };



            self.as = 0;

            self.editingPoi = {};
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
            self.showingPoiEditing = false;
            self.routeError = false;
            self.creatorError = false;
            self.searchByDate = "";
            self.searchByCreator = "";
            self.selectPoiForRoute = false;

            self.followingListEnabled = false;
            self.poiListEnabled = true;
            self.loginData = {};
            self.user = SessionService.user;


            self.colapse = false;



            self.favs = [];
            self.following = [];
            self.pois = [];

            self.mapEvents = {
                click: function (mapModel, eventName, originalEventArgs) {
                    var e = originalEventArgs[0];

                    console.log(e.latLng.lat() + " - " + e.latLng.lng());

                    if(self.showingPoiCreating || self.showingPoiEditing){
                        self.editingPoi.lat = e.latLng.lat();
                        self.editingPoi.long = e.latLng.lng();
                    }

                    $scope.$apply();



                }
            };




            //Se empieza a hacer declaraciones una vez ha cargado el objeto de mapa -> maps es el objecto google.maps
            uiGmapGoogleMapApi.then(function (maps) {

                //Objetos para las direcciones en Google
                var directionsDisplay = new maps.DirectionsRenderer({suppressMarkers: true});
                var directionsService = new maps.DirectionsService();

                //Eventos al hacer click en un marker
                self.markersEvents = {
                    click: function (marker, eventName, model) {


                        if(!self.selectPoiForRoute){
                            self.showPoiDetail(model.control._id);
                        }
                        else{

                            //Check it is not repeated
                            /*var contains = false;
                            for(var i = 0; !contains && i < self.editingRoute.pois.length; i++){
                                if(self.editingRoute.pois[i]._id == model.control_id){
                                    contains = true;
                                }
                            }*/

                            console.log(model.control);
                            self.editingRoute.pois.push(model.control);


                        }



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

                    self.hideAllRightPanels();
                    self.showingPoiEditing = false;
                    return PoiService.loadDetailPoi(_id)
                        .then(function (detailedPoi) {

                            //Obtenemos Poi detallado
                            self.detailedPoi = detailedPoi;



                            self.detailedPoi.guestRating = 0;
                            //Ponemos que se está mostrando la info de Poi, no de ruta
                            self.showingRoute = false;
                            self.showingPoi = true;



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





                self.showRouteCreating = function(){
                    self.hideAllRightPanels();
                    self.showingRouteCreating = true;
                    self.editingRoute = {};
                    self.editingRoute.pois = [];
                    self.selectPoiForRoute = true;
                }

                self.showPoiCreating = function(){
                    self.hideAllRightPanels();

                    self.showingPoiCreating = true;
                    self.editingPoi = {};
                    self.editingPoi.keywordList = "";
                };


                self.showRouteEditing = function(){

                    self.showingRouteEditing = true;
                    self.editingRoute = {};
                    self.selectPoiForRoute = true;
                    angular.copy(self.detailedRoute,self.editingRoute);

                };

                self.showPoiEditing = function(){

                    self.showingPoiEditing = true;
                    self.editingPoi = {};
                    //Copiamos usuario a editar a 'editingPoi'
                    angular.copy(self.detailedPoi,self.editingPoi);


                    var keywordList = "";
                    for(var i = 0; i < self.editingPoi.keywords.length -1; i++){
                        keywordList += self.editingPoi.keywords[i] + ", ";
                    }

                    if(self.editingPoi.keywords.length>0){
                        keywordList += self.editingPoi.keywords[self.editingPoi.keywords.length-1];
                    }

                    self.editingPoi.keywordList = keywordList;




                };



                self.addPoiToList = function(poi){
                    self.pois.push({_id:poi._id,name:poi.name,lat:poi.lat,long:poi.long})
                };

                self.addRouteToList = function(route){
                    self.routes.push({_id:route._id,name:route.name})
                }


                self.updateDetailedPoiInList = function(){

                    var found = false;
                    for(var i = 0; !found && i < self.pois.length; i++){
                        console.log(self.pois[i]._id);
                        if(self.pois[i]._id == self.detailedPoi._id){
                            self.pois[i].name = self.detailedPoi.name;
                            self.pois[i].lat = self.detailedPoi.lat;
                            self.pois[i].long = self.detailedPoi.long;
                        }

                    }
                };


                self.updateDetailedRouteInList = function(){

                    var found = false;
                    for(var i = 0; !found && i < self.routes.length; i++){
                        console.log(self.routes[i]._id);
                        if(self.routes[i]._id == self.detailedRoute._id){
                            self.routes[i].name = self.detailedRoute.name;
                            self.routes[i].pois = self.detailedRoute.pois;
                        }

                    }
                };


                self.removePoiInList = function(poiId){

                    var found = false;
                    for(var i = 0; !found && i < self.pois.length; i++){
                        if(self.pois[i]._id == poiId){
                            self.pois.splice(i,1);
                        }

                    }

                };


                self.removeRouteInList = function(routeId){

                    var found = false;
                    for(var i = 0; !found && i < self.routes.length; i++){
                        if(self.routes[i]._id == routeId){
                            self.routes.splice(i,1);
                        }

                    }

                };


                self.removeCurrentPoi = function(){
                    var poiId = self.detailedPoi._id;
                    $http.delete("/pois/" + poiId)
                        .then(function(response){

                            //Se ha borrado el POI
                            self.removePoiInList(poiId);
                            self.showingPoiEditing = false;
                            self.showingPoi = false;

                        })
                        .catch(function(response){

                        });
                };

                self.removeCurrentRoute = function(){
                    var routeId = self.detailedRoute._id;
                    $http.delete("/routes/" + routeId)
                        .then(function(response){

                            //Se ha borrado el POI
                            self.removeRouteInList(routeId);
                            self.showingRouteEditing = false;
                            self.showingRouteCreating = false;
                            self.showingRoute = false;

                        })
                        .catch(function(response){

                        });
                };


                self.hidePoiEditing   = function(save){

                    if(!save){
                        self.showingPoiEditing = false;
                    }
                    else{ //Se guarda

                        //Formamos array de keywords
                        self.editingPoi.keywords = self.editingPoi.keywordList.split(",");
                        for(var i = 0; i < self.editingPoi.keywords.length; i++){
                            self.editingPoi.keywords[i] = self.editingPoi.keywords[i].trim();
                        }

                        $http.put("/pois/" + self.editingPoi._id,self.editingPoi)
                            .then(function(response){

                                //OK:

                                self.detailedPoi = self.editingPoi;
                                self.showingPoiEditing = false;
                                self.updateDetailedPoiInList();
                            })
                            .then(function(error){

                            });


                    }

                };

                self.hidePoiCreating   = function(save){

                    if(!save){
                        self.showingPoiCreating = false;
                    }
                    else{ //Se guarda

                        //Formamos array de keywords
                        self.editingPoi.keywords = self.editingPoi.keywordList.split(",");
                        for(var i = 0; i < self.editingPoi.keywords.length; i++){
                            self.editingPoi.keywords[i] = self.editingPoi.keywords[i].trim();
                        }

                        $http.post("/pois",self.editingPoi)
                            .then(function(response){

                                //OK:

                                self.detailedPoi = response.data.message;
                                self.showingPoiCreating = false;
                                self.addPoiToList(self.detailedPoi);
                            })
                            .then(function(error){

                            });


                    }

                };

                self.hideRouteCreating  = function(save){

                    if(!save){
                        self.showingRouteCreating = false;
                    }
                    else{ //Se guarda


                        //Formamos array de pois que se envía
                        for(var i = 0; i < self.editingRoute.pois.length; i++ ){

                            self.editingRoute.pois[i] = {_id:self.editingRoute.pois[i]._id};
                        }


                        $http.post("/routes",self.editingRoute)
                            .then(function(response){

                                console.log("ruta añadida");
                                //OK:

                                self.detailedRoute = response.data.message;
                                self.showingRouteCreating = false;
                                self.addRouteToList(self.detailedRoute);
                            })
                            .then(function(error){

                            });


                    }

                };

                self.hideRouteEditing  = function(save){

                    if(!save){
                        self.showingRouteEditing = false;
                    }
                    else{ //Se guarda

                        console.log(self.editingRoute.pois);

                        //Formamos array de pois que se envía
                        for(var i = 0; i < self.editingRoute.pois.length; i++ ){
                            self.editingRoute.pois[i] = {_id:self.editingRoute.pois[i]._id};
                        }


                        $http.put("/routes/" + self.editingRoute._id,{name:self.editingRoute.name,pois:self.editingRoute.pois})
                            .then(function(response){


                                self.detailedRoute = self.editingRoute;
                                self.showingRouteEditing = false;
                                self.updateDetailedRouteInList(self.detailedRoute);
                                self.showAndCalculateRoute(self.detailedRoute._id);
                            })
                            .then(function(error){

                            });


                    }

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

                    self.showingPoi = false;
                    self.showingRoute = false;
                    self.showingPoiCreating = false;
                    self.showingRouteCreating = false;
                    self.showingRouteEditing = false;
                    self.showingPoiEditing = false;
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


                    self.hideAllRightPanels();

                    self.showingRoute = true;
                    self.showingPoi = false;

                    self.routeError = false;
                    //Cogemos del backend los pois
                    return PoiService.loadDetailRoute(id)
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