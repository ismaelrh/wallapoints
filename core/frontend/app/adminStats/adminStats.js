'use strict';

/**
 * Controlador de pantalla de panel de estadísticas de admin
 * @author Ismael Rodríguez, Sergio Soro, David Vergara. 2016.
 */
angular.module('frontend')

    .controller('AdminStatsCtrl', ['SessionService', '$rootScope', 'StatsService', function (SessionService, $rootScope, StatsService) {

        var self = this; //Para no perder la variable this, la guardamos en self (de lo contrario se sobreescribe)

        self.user = SessionService.user;


        self.accessDay = 0;
        self.totalPois = 0;
        self.totalRoutes = 0;

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


        self.tPois = function () {
            StatsService.getTotalPois().then(function (response) {
                self.totalPois = response;

            });
        };

        self.tRoutes = function () {
            StatsService.getTotalRoutes().then(function (response) {
                self.totalRoutes = response;

            });
        };

        self.lAccess = function () {
            StatsService.getAccessesToday().then(function (response) {
                self.accessDay = response;

            });
        };


        self.UsersRegister = function () {
            StatsService.getUsersInOut().then(function (response) {
                self.dates = response.dates;
                self.userData = response.userData;
                self.usersSeries = ['Sign up', 'Delete'];

            });
        };


        self.dates2 = ['today'];
        self.poiData = [[0]];
        self.poiSeries = ['Created'];

        self.PoisRegister = function () {
            StatsService.getPoisInSystem().then(function (response) {
                self.dates2 = response.dates;
                self.poiData = response.poisData;
                self.poiSeries = ['Created'];


            });
        };

        self.dates3 = ['today'];
        self.routeData = [[0]];
        self.routeSeries = ['Created'];

        self.routeRegister = function () {
            StatsService.getRoutesInSystem().then(function (response) {
                self.dates3 = response.dates;
                self.routeData = response.routesData;
                self.routeSeries = ['Created'];


            });
        };

        self.Accesshours = ['today'];
        self.AccessData = [[0]];
        self.AccessSeries = ['Access'];

        self.AccessRegister = function () {
            StatsService.getAccessesByHour().then(function (response) {
                self.Accesshours = response.dates;
                self.AccessData = response.userData;
                self.AccessSeries = ['Access'];


            });
        };


        self.logOut = function () {
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