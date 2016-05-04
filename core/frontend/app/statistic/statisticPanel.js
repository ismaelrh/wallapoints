'use strict';

angular.module('frontend')

.controller('StatisticCtrl', ['$http','SessionService',function($http,SessionService) {

    var self = this; //Para no perder la variable this, la guardamos en self (de lo contrario se sobreescribe)


    self.UsersRegister = function(){
        $http.get('/stats/admin/usersInOut').then(function(response){
            self.dates=response.data.message.dates;
            self.userData=response.data.message.userData;
            self.usersSeries = ['Alta', 'Baja'];

        },  function(err){
            console.error(err);
        });
    };



    self.dates2 = ['today'];
    self.poiData= [[0]];
    self.poiSeries = ['Creados'];

    self.PoisRegister = function(){
        $http.get('/stats/admin/poisIn').then(function(response){
            self.dates2 = response.data.message.dates;
            self.poiData = response.data.message.userData;
            self.poiSeries = ['Creados'];


        },  function(err){
            console.error(err);
        });
    };

    self.dates3 = ['today'];
    self.routeData= [[0]];
    self.routeSeries = ['Creados'];

    self.routeRegister = function(){
        $http.get('/stats/admin/routesIn').then(function(response){
            self.dates3 = response.data.message.dates;
            self.routeData = response.data.message.userData;
            self.routeSeries = ['Creados'];


        },  function(err){
            console.error(err);
        });
    };


    self.logOut = function(){
        SessionService.logOut();
    };


    //Para empezar, traemos los datos.
    self.UsersRegister();
    self.PoisRegister();
    self.routeRegister();


}]);