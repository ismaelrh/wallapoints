'use strict';

angular.module('frontend')

.controller('MapCtrl', ['$http','UserService','uiGmapGoogleMapApi','$scope',function($http,UserService,uiGmapGoogleMapApi,$scope) {


    var self = this; //Para no perder la variable this, la guardamos en self (de lo contrario se sobreescribe)

    self.myOptions =  {
        disableDefaultUI: true
    };

    self.mapControl = {};
    self.showLeftPanel = true;
    self.showLeftPanel2 = true;
    self.showRightPanel = true;
    self.map = { center: { latitude: 42.1365707, longitude: -0.4143509 }, zoom: 3 ,control: {}};
    self.detailedPoi = undefined;
    self.detailedRoute = undefined;
    self.pois = [];

    self.searchByDate = "";
    self.searchByCreator = "";



    //Eventos al hacer click en un marker
    self.markersEvents = {
        click: function(marker, eventName, model) {


            self.loadDetails(model.control._id);


        },
        mouseover: function(marker, eventName, model){



            model.show = true;

        },
        mouseout: function(marker, eventName, model){
            model.show = false;

        }
    };





    self.followingListEnabled = false;
    self.poiListEnabled = true;
    self.loginData = {};


    self.colapse = false;

    self.guest = UserService.user;
    self.favs = [];
    self.following = [];
    self.pois = [];




    self.loadDetails = function(_id){
        $http.get("/pois/" + _id)
            .then(function(response){

                self.detailedPoi = response.data.message;

                //Miramos si es favorito del invitado
                var isFav = false;
                for (var i = 0; !isFav && i < self.favs.length; i++){
                    if(self.favs[i]._id == self.detailedPoi._id){
                        isFav = true;
                    }
                }

                self.detailedPoi.isFav = isFav;

                //Miramos si está siguiendo del usuario
                var isFollowing = false;
                for (var i = 0; !isFollowing && i < self.following.length; i++){
                    if(self.following[i].username == self.detailedPoi.creator){
                        isFollowing = true;
                    }
                }

                self.detailedPoi.isFollowing = isFollowing;
                console.log("Checking following " + self.detailedPoi._id + ":" + isFollowing );

            })
            .catch(function(exception){


                console.log(exception);
            });

    };



    self.loadDetailsAndCenter = function(poi){

        self.loadDetails(poi._id)
        self.map.center  = {latitude: poi.lat,longitude:poi.long};
        self.map.zoom = 7;
    };

    self.logoutGuest = function(){
        UserService.deleteCurrentToken();
        self.guest = null;

    };


    self.toggleFav = function(poiId){

        //Buscamos si ya está como favorito
        var isFav = false;
        var indexOfFav = -1;
        for (var i = 0; !isFav && i < self.favs.length; i++){
            if(self.favs[i]._id == self.detailedPoi._id){
                isFav = true;
                indexOfFav = i;

            }
        }


        if(isFav){
            console.log("Deleting from fav");
            $http.delete("/guests/" + self.guest.mail + "/favs/" + poiId)
                .then(function(success){

                    //Borramos de favs
                    self.detailedPoi.isFav = false;
                    for (var i = 0; i < self.favs.length; i++){
                        if(self.favs[i]._id == self.detailedPoi._id){
                            self.favs.splice(i,1);
                        }
                    }
                    console.log("Deleted from fav");

                },function(error){

                    console.log(error);
                });
        }
        else{

            $http.put("/guests/" + self.guest.mail + "/favs/" + poiId)
                .then(function(success){

                    console.log("Adding to fav");
                    //Añadimos a fav
                    self.detailedPoi.isFav = true;
                    self.favs.push(self.detailedPoi);


                    console.log("Added to fav")
                },function(error){
                    console.log(error);
                });
        }

    };

    self.toggleFollowing = function(username){


        console.log("aa");
        //Buscamos si ya está como siguiendo
        var isFollowing = false;
        var indexOfFollowing = -1;
        for (var i = 0; !isFollowing && i < self.following.length; i++){
            if(self.following[i].username == self.detailedPoi.creator){
                isFollowing  = true;
                indexOfFollowing = i;

            }
        }


        if(isFollowing){
            console.log("Deleting from following");
            $http.delete("/guests/" + self.guest.mail + "/following/" + username)
                .then(function(success){

                    //Borramos de favs
                    self.detailedPoi.isFollowing = false;
                    for (var i = 0; i < self.following.length; i++){
                        if(self.following[i].username == self.detailedPoi.creator){
                            self.following.splice(i,1);
                        }
                    }
                    console.log("Deleted from following");

                },function(error){

                    console.log(error);
                });
        }
        else{


            $http.put("/guests/" + self.guest.mail + "/following/" + username)
                .then(function(success){

                    console.log("Adding to following");
                    //Añadimos a fav
                    self.detailedPoi.isFollowing = true;
                    self.following.push({username:username});


                    console.log("Added to following")
                },function(error){
                    console.log(error);
                });
        }

    };



    /**
     * Hace log-in, obtiene datos de usuario, favs y followings.
     */
    self.loginGuest = function(){

        $http.post("/guests/login",{mail: self.loginData.mail, password:self.loginData.password})
            .then(function(response) {
                var jwtToken = response.data.message;

                UserService.setNewToken(jwtToken);
                self.guest = UserService.user;
                //Todo: alertas
                console.log("Guest logged-in: " + self.guest.mail);
                return self.getGuestDetails();


            })
            .catch(function(response) {

                //Todo: alerta
                console.log("Error loggin guest");
            });


    };

    self.getGuestDetails = function(){
        return $http.get("/guests/" + self.guest.mail + "/favs")
            .then(function(response){
                self.favs = response.data.message;
                console.log("Got favs: " + self.favs.length);
                console.log(self.favs);
                return $http.get("/guests/" + self.guest.mail + "/following");
            })
            .then(function(response){
                console.log("Got following: " + self.following.length);

                self.following = response.data.message;
            })
            .catch(function(response) {

                //Todo: alerta
                console.log("Error obtaining details");
            });
    };



    self.searchPois = function(){


        var searchObject = {};

        if(self.searchByCreator && self.searchByCreator.length > 0){
            searchObject.creator = self.searchByCreator;
        }

        if(self.searchByDate && self.searchByDate.length > 0){
            searchObject.date = self.searchByDate;
        }

        $http.post("/pois/search",searchObject)
            .then(function(response){
                console.log("Pois: ");
                console.log(response.data.message);
                self.pois = response.data.message;
            })
            .catch(function(error){
                console.log("Error obtaining poiss");
            });



    };

    self.searchRoutes = function(){


        var searchObject = {};

        if(self.searchByCreator && self.searchByCreator.length > 0){
            searchObject.creator = self.searchByCreator;
        }

        if(self.searchByDate && self.searchByDate.length > 0){
            searchObject.date = self.searchByDate;
        }

        $http.post("/routes/search",searchObject)
            .then(function(response){
                console.log("Routes: ");
                console.log(response.data.message);
                self.routes = response.data.message;
            })
            .catch(function(error){
                console.log("Error obtaining routes");
            });



    };



    self.registerGuest = function(){

        $http.post("/guests",{mail: self.loginData.mail, password:self.loginData.password})
            .then(function(response){

                //Now, log-in
                console.log("Guest registered: " + self.loginData.mail);
                self.loginGuest();

                //Todo: alerta

            }, function(response){

                //Todo: alerta
                console.log("Error registerings guest");
            });
    };

    self.toggleLeftPanel = function(){
        self.showLeftPanel = !self.showLeftPanel;
    };

    self.toggleLeftPanel2 = function(){
        self.showLeftPanel2 = !self.showLeftPanel2;
    };


    self.toggleRightPanel = function(){
        self.showRightPanel = !self.showRightPanel;
    };




    // uiGmapGoogleMapApi is a promise.
    // The "then" callback function provides the google.maps object.
    uiGmapGoogleMapApi.then(function(maps) {


        self.getGuestDetails();
        self.searchPois();
        self.searchRoutes();


        var directionsDisplay = new maps.DirectionsRenderer();
        var directionsService = new maps.DirectionsService();

        self.getDirections = function (id) {

            //Cogemos del backend los pois
            $http.get("/routes/" + id)
                .then(function(response){

                    self.detailedRoute = response.data.message;

                    var poiList = response.data.message.pois;
                    if(poiList.length<2){
                        alert("Need two or more points to calculate route");
                        return;
                    }

                    //Punto inicial y final
                    var originAddress = new maps.LatLng(poiList[0].lat, poiList[0].long);
                    var destinationAddress = new maps.LatLng(poiList[poiList.length-1].lat, poiList[poiList.length-1].long);

                    //Se agnaden los puntos intermedios
                    var puntosIntermedios = [];
                    for (var i = 1; i < poiList.length -1; i++) {

                        puntosIntermedios.push({
                            location: new maps.LatLng(poiList[i].lat,poiList[i].long),
                            stopover: true
                        });

                    }

                    var request = {
                        origin: originAddress,
                        destination: destinationAddress,
                        waypoints: puntosIntermedios,
                        optimizeWaypoints: false,
                        travelMode: maps.DirectionsTravelMode.DRIVING
                    };

                    directionsService.route(request, function (response, status) {
                        if (status === maps.DirectionsStatus.OK) {
                            directionsDisplay.setDirections(response);
                            directionsDisplay.setMap(self.mapControl.getGMap());
                            directionsDisplay.setPanel(document.getElementById('directionsList'));
                        } else {
                            alert('Google route unsuccesfull!');
                        }
                    });
                })
                .catch(function(error){
                    alert('Error retrieving route!');
                });


        };




    });






}]);