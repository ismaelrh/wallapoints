'use strict';

angular.module('frontend')

.controller('MapCtrl', ['$http','UserService','uiGmapGoogleMapApi',function($http,UserService,uiGmapGoogleMapApi) {


    var self = this; //Para no perder la variable this, la guardamos en self (de lo contrario se sobreescribe)

    self.myOptions =  {
        disableDefaultUI: true
    };

    self.showLeftPanel = true;
    self.showLeftPanel2 = true;
    self.showRightPanel = true;
    self.map = { center: { latitude: 45, longitude: -73 }, zoom: 8 };



    self.colapse = false;

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

        console.log("mapa listo");
    });




}]);