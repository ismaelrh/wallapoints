'use strict';

angular.module('frontend')

    .controller('UserMapCtrl', ['SessionService', 'uiGmapGoogleMapApi', '$scope', 'PoiService', '$rootScope',
        function (SessionService, uiGmapGoogleMapApi, $scope, PoiService,$rootScope) {


            var self = this; //Para no perder la variable this, la guardamos en self (de lo contrario se sobreescribe)


            //Usuario logueado actualmente
            self.user = SessionService.user;

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
                hoverPoiList: [], //Lista de IDs de  markers con el ratón encima
                events: {
                    click: function (mapModel, eventName, originalEventArgs) {
                        var e = originalEventArgs[0];

                        console.log(e.latLng.lat() + " - " + e.latLng.lng());

                        if(self.showingPoiEdition || self.showingPoiCreation){
                            self.editingPoi.lat = e.latLng.lat();
                            self.editingPoi.long = e.latLng.lng();
                        }

                        $scope.$apply();



                    }
                }
            };


            //Estado de POIs y rutas
            self.pois = [];                 //Lista de pois obtenidos de búsqueda
            self.routes = [];               //Lista de rutas obtenidas de búsqueda
            self.favs = [];                 //Lista de POIs favoritos del usuario
            self.following = [];            //Lista de usuarios siguiendo

            self.detailedPoi = undefined;   //Poi actualmente viendo en detalle
            self.detailedRoute = undefined; //Ruta actualmente viendo en detalle
            self.editingPoi = {};            //Poi actualmente siendo editado/creado
            self.editingRoute = {};          //Ruta actualemente siendo editada/creada

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
            self.showingPoiEditing = false;
            self.showingRouteEditing = false;
            self.showingRouteCreation = false;

            //Controla si se está en modo selección de POIs para crear/editar ruta
            self.selectPoiForRoute = false;


            //Controlan qué pestaña está activada (ruta o poi), (favs o following)
            self.followingListEnabled = false;
            self.poiListEnabled = true;

            //Controlan algunos errores
            self.routeError = false;
            self.creatorError = false;
            self.routeCreationError = false;





            //Se empieza a hacer declaraciones una vez ha cargado el objeto de mapa -> maps es el objecto google.maps
            uiGmapGoogleMapApi.then(function (maps) {

                //Objetos para las direcciones en Google
                var directionsDisplay = new maps.DirectionsRenderer({suppressMarkers: true});
                var directionsService = new maps.DirectionsService();

                //Eventos al hacer click en un marker
                self.markersEvents = {
                    click: function (marker, eventName, model) {

                        if(!self.selectPoiForRoute){ //Modo normal -> Se muestran detalles
                            self.showPoiDetail(model.control);
                        }
                        else{ //Modo selección de POIs para editar/crear ruta -> Se añade POI a lista

                            var poiToInsert = {};
                            angular.copy(model.control,poiToInsert);
                            self.editingRoute.pois.push(poiToInsert);
                        }


                    },
                    mouseover: function (marker, eventName, model) {

                        self.map.hoverPoiList.push(model.control._id);

                    },
                    mouseout: function (marker, eventName, model) {
                        var index = self.map.hoverPoiList.indexOf(model.control._id);
                        if(index>-1){
                            self.map.hoverPoiList.splice(index,1);
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
                 * Dado un poi, carga su detalle del backend
                 * y lo muestra en el cuadro de información.
                 * Si esta en modo edicion o creacion de ruta, lo añade a la lista (sin centrar el mapa)
                 */
                self.showPoiDetail = function (poi) {

                    var _id = poi._id;
                    if(self.showingRouteEdition || self.showingRouteCreation){
                        //Antes de insertar, copiamos para permitir puntos repetidos
                        var poiToInsert = {};
                        angular.copy(poi,poiToInsert);
                        self.editingRoute.pois.push(poiToInsert);
                        return false;
                    }

                    self.hideAllRightPanels();

                    return PoiService.loadDetailPoi(_id)
                        .then(function (detailedPoi) {

                            //Obtenemos Poi detallado
                            self.detailedPoi = detailedPoi;


                            //Ponemos que se está mostrando la info de Poi, no de ruta
                            self.showingRoute = false;
                            self.showingPoi = true;


                            //Puntuación media
                            self.getMeanRating(self.detailedPoi._id);


                            //Borramos cualquier posible direction
                            self.clearDirections();


                        });
                };


                /**
                 * A partir de un array de keywords, devuelve cadena que las muestra separadas por comas.
                 */
                self.getKeywordCommasFromList = function(list){
                   var result = "None";
                    if (list.length > 0) {


                        result = "";

                        for (var i = 0; i < list.length - 1; i++) {
                            result += list[i] + ", ";
                        }


                        result += list[list.length - 1];
                    }
                    return result;
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
                 * Obtiene la puntuación media de un POI.
                 */
                self.getMeanRating = function (poiId) {
                    PoiService.getMeanRating(poiId)
                        .then(function (avgRating) {

                            self.detailedPoi.avgRating = avgRating;
                        });
                };


                /**
                 * Activa modo creación de ruta.
                 */
                self.showRouteCreation = function(){
                    self.clearDirections();
                    self.hideAllRightPanels();
                    self.showingRouteCreation = true;
                    self.editingRoute = {};
                    self.editingRoute.pois = [];
                    self.selectPoiForRoute = true;
                };

                /**
                 * Activa modo edición de ruta.
                 */
                self.showRouteEdition = function(){

                    self.hideAllRightPanels();
                    self.showingRoute = true;
                    self.showingRouteEdition = true;
                    self.editingRoute = {};
                    self.selectPoiForRoute = true;
                    //Copiamos la ruta actual para no modificarla hasta el final.
                    angular.copy(self.detailedRoute,self.editingRoute);

                };


                /**
                 * Activa el modo creación de POI
                 */
                self.showPoiCreation = function(){
                    self.clearDirections();
                    self.hideAllRightPanels();

                    self.showingPoiCreation = true;
                    self.editingPoi = {};
                    self.editingPoi.keywordList = "";
                };

                /**
                 * Activa el modo de edición de POI
                 */
                self.showPoiEdition = function(){

                    self.showingPoiEdition = true;
                    self.editingPoi = {};

                    //Copiamos usuario a editar a 'editingPoi'
                    angular.copy(self.detailedPoi,self.editingPoi);

                    //Transformamos la lista de keywords de un array a lista separada por comas
                    var keywordList = "";
                    for(var i = 0; i < self.editingPoi.keywords.length -1; i++){
                        keywordList += self.editingPoi.keywords[i] + ", ";
                    }

                    if(self.editingPoi.keywords.length>0){
                        keywordList += self.editingPoi.keywords[self.editingPoi.keywords.length-1];
                    }

                    self.editingPoi.keywordList = keywordList;

                };


                //Añade un poi a la lista de pois (sólo detalles esenciales, como id, name, lat y long)
                self.addPoiToList = function(poi){
                    self.pois.push({_id:poi._id,name:poi.name,lat:poi.lat,long:poi.long})
                };

                //Añade una ruta a la lista de pois (sólo detalles esenciales, como id y name)
                self.addRouteToList = function(route){
                    self.routes.push({_id:route._id,name:route.name})
                };


                //Actualiza en lista de POIs el poi actual
                self.updatePoiInList = function(poi){

                    var found = false;
                    for(var i = 0; !found && i < self.pois.length; i++){
                        console.log(self.pois[i]._id);
                        if(self.pois[i]._id == poi._id){
                            self.pois[i].name = poi.name;
                            self.pois[i].lat = poi.lat;
                            self.pois[i].long = poi.long;
                        }

                    }
                };

                //Actualiza en la lista de rutas la ruta actual
                self.updateRouteInList = function(route){

                    var found = false;
                    for(var i = 0; !found && i < self.routes.length; i++){
                        console.log(self.routes[i]._id);
                        if(self.routes[i]._id == route._id){
                            self.routes[i].name = route.name;
                            self.routes[i].pois = route.pois;
                        }

                    }
                };

                //Borra un POI, según su poiId, de la lista de pois
                self.removePoiInList = function(poiId){

                    var found = false;
                    for(var i = 0; !found && i < self.pois.length; i++){
                        if(self.pois[i]._id == poiId){
                            self.pois.splice(i,1);
                        }

                    }

                };


                //Borra una RUTA, según su poiId, de la lista de rutas
                self.removeRouteInList = function(routeId){

                    var found = false;
                    for(var i = 0; !found && i < self.routes.length; i++){
                        if(self.routes[i]._id == routeId){
                            self.routes.splice(i,1);
                        }

                    }

                };


                /**
                 * Borra el poi actual, tanto del backend como del sistema.
                 */
                self.removePoi = function(poiId){
                    PoiService.deletePoi(poiId)
                        .then(function(response){

                            //Se ha borrado el POI
                            self.removePoiInList(poiId);
                            self.hideAllRightPanels();

                        })
                        .catch(function(response){

                        });
                };

                /**
                 * Borra la ruta actual, tanto del backend como del sistema.
                 */
                self.removeRoute = function(routeId){
                    PoiService.deleteRoute(routeId)
                        .then(function(response){

                            //Se ha borrado el POI
                            self.removeRouteInList(routeId);
                            self.hideAllRightPanels();
                            self.clearDirections();

                        })
                        .catch(function(response){

                        });
                };




                /**
                 *  Cierra la creación o edición de POI. Si save = true, guarda el POI en backend.
                 */
                self.hidePoiEdition   = function(save){

                    if(!save){

                        if(self.showingPoiEdition){ //Si se estaba editando, se deja la ventana de info
                            self.hideAllRightPanels();
                            self.showingPoi = true;
                        }
                        else{ //Si se estaba creando, se cierra todo
                            self.hideAllRightPanels();
                        }


                    }
                    else{

                        //Formamos array de keywords a partir de lista separada por comas
                        self.editingPoi.keywords = self.editingPoi.keywordList.split(",");
                        for(var i = 0; i < self.editingPoi.keywords.length; i++){
                            self.editingPoi.keywords[i] = self.editingPoi.keywords[i].trim();
                        }

                        //Cuando no se pone ninguna keyword, que quede vacío el array
                        if(self.editingPoi.keywords.length == 1 && self.editingPoi.keywords[0].length==0){
                            self.editingPoi.keywords = [];
                        }

                        if(self.editingPoi.multimediaUrl && self.editingPoi.multimediaUrl.length>0 &&
                            self.editingPoi.multimediaUrl.indexOf("http")==-1){
                            self.editingPoi.multimediaUrl = "http://" + self.editingPoi.multimediaUrl;
                        }


                        var poiPromise;
                        if(self.showingPoiEdition){
                            poiPromise = PoiService.updatePoi(self.editingPoi);
                        }
                        else{
                            poiPromise = PoiService.createPoi(self.editingPoi);
                        }

                            poiPromise.then(function(createdPoi){

                                self.detailedPoi = createdPoi;
                                if(self.showingPoiEdition){

                                    self.updatePoiInList(self.detailedPoi);
                                }
                                else{
                                    self.addPoiToList(self.detailedPoi);
                                }


                                self.hideAllRightPanels();
                                self.showingPoi = true;

                            });


                    }

                };




                /**
                 * Cierra la edición o creación de ruta.  Si save = true, guarda la ruta en backend.
                 */
                self.hideRouteEdition  = function(save){

                    self.routeCreationError = false;
                    if(!save){

                        if(self.showingRouteEdition){
                            self.hideAllRightPanels();
                            self.showingRoute = true;
                            self.showingRouteSteps = true;
                            self.showAndCalculateRoute(self.detailedRoute._id);
                        }
                        else{
                            self.hideAllRightPanels();
                        }

                    }
                    else{ //Se guarda

                        if(self.editingRoute.pois.length < 2){
                            self.routeCreationError = "Please, select 2 or more points";
                            return;
                        }

                        //Formamos array de objetos con atributo  _id que se envía
                        for(var i = 0; i < self.editingRoute.pois.length; i++ ){
                            self.editingRoute.pois[i] = {_id:self.editingRoute.pois[i]._id};
                        }


                        var routePromise;
                        if(self.showingRouteEdition){
                            routePromise = PoiService.updateRoute(self.editingRoute);
                        }
                        else{
                            routePromise = PoiService.createRoute(self.editingRoute);
                        }

                        routePromise
                            .then(function(savedRoute){


                                self.detailedRoute = savedRoute;
                                if(self.showingRouteEdition){
                                    self.updateRouteInList(self.detailedRoute);
                                }
                                else{
                                    self.addRouteToList(self.detailedRoute);
                                }

                                self.showAndCalculateRoute(self.detailedRoute._id);

                                self.hideAllRightPanels();
                                self.showAndCalculateRoute(self.detailedRoute._id);

                            });


                    }

                };


                self.hideAllRightPanels = function(){

                    self.showingPoi = false;
                    self.showingRoute = false;
                    self.showingRouteCreation = false;
                    self.showingRouteEdition = false;
                    self.showingPoiEdition = false;
                    self.showingPoiCreation = false;
                    self.showingRouteSteps = false;

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


                    self.hideAllRightPanels();
                    self.showingRoute = true;
                    self.showingRouteSteps = true;

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



                self.searchPois();
                self.searchRoutes();



            });


        }]);