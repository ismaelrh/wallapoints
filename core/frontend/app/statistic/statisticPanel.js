'use strict';

/**
 * Controlador de pantalla de panel de estadísticas de admin
 * @author Ismael Rodríguez, Sergio Soro, David Vergara. 2016.
 */
angular.module('frontend')

    .controller('StatisticCtrl', ['$http', 'SessionService', '$rootScope', function ($http, SessionService, $rootScope) {

    var self = this; //Para no perder la variable this, la guardamos en self (de lo contrario se sobreescribe)

    self.user = SessionService.user;


    self.accessDay = 0;
    self.totalPois = 0;
    self.totalRoutes = 0;

    self.tPois = function(){
        $http.get('/stats/admin/totalPois').then(function(response){
            self.totalPois = response.data.message;

        },  function(err){
            console.error(err);
        });
    };

    self.tRoutes = function(){
        $http.get('/stats/admin/totalRoutes').then(function(response){
            self.totalRoutes = response.data.message;

        },  function(err){
            console.error(err);
        });
    };

    self.lAccess = function(){
        $http.get('/stats/admin/accessDay').then(function(response){
            self.accessDay = response.data.message;

        },  function(err){
            console.error(err);
        });
    };


        //Para mostrar alerta cuando hay errores
        self.alert = {
            show: false,
            message: ""
        };

        //Para mostrar alerta
        $rootScope.$on("errorMessage", function (event, args) {
            showAlert("danger", args.message);
        });


        function showAlert(type, message) {
            self.alert.show = true;
            self.alert.type = type;
            self.alert.message = message;
            if (self.alert.type == "danger") {
                self.alert.title = "Error!";
            }
            if (self.alert.type == "warning") {
                self.alert.title = "Warning!"
            }
            if (self.alert.type == "success") {
                self.alert.title = "Success!";
            }
        }

    self.UsersRegister = function(){
        $http.get('/stats/admin/usersInOut').then(function(response){
            self.dates=response.data.message.dates;
            self.userData=response.data.message.userData;
            self.usersSeries = ['Sign up', 'Delete'];

        },  function(err){
            console.error(err);
        });
    };



    self.dates2 = ['today'];
    self.poiData= [[0]];
    self.poiSeries = ['Created'];

    self.PoisRegister = function(){
        $http.get('/stats/admin/poisIn').then(function(response){
            self.dates2 = response.data.message.dates;
            self.poiData = response.data.message.userData;
            self.poiSeries = ['Created'];


        },  function(err){
            console.error(err);
        });
    };

    self.dates3 = ['today'];
    self.routeData= [[0]];
    self.routeSeries = ['Created'];

    self.routeRegister = function(){
        $http.get('/stats/admin/routesIn').then(function(response){
            self.dates3 = response.data.message.dates;
            self.routeData = response.data.message.userData;
            self.routeSeries = ['Created'];


        },  function(err){
            console.error(err);
        });
    };

    self.Accesshours = ['today'];
    self.AccessData = [[0]];
    self.AccessSeries = ['Access'];

    self.AccessRegister = function(){
        $http.get('/stats/admin/AccessHour').then(function(response){
            self.Accesshours = response.data.message.dates;
            self.AccessData = response.data.message.userData;
            self.AccessSeries = ['Access'];


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
    self.tPois();
    self.tRoutes();
    self.lAccess();
    self.AccessRegister();

}]);