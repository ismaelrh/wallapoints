'use strict';

// Declare app level module which depends on views, and services
angular.module('frontend', [
    'ngRoute',
    'angular-jwt',
    'LocalStorageModule',
    'uiGmapgoogle-maps',
    'ngAnimate',
    'ui.bootstrap'
]).config(['$routeProvider','$httpProvider', 'uiGmapGoogleMapApiProvider',function ($routeProvider,$httpProvider,uiGmapGoogleMapApiProvider) {

        uiGmapGoogleMapApiProvider.configure({
            //    key: 'your api key',
            v: '3.20', //defaults to latest 3.X anyhow
            libraries: 'weather,geometry,visualization'
        });

        $routeProvider

            .when('/view1', {
                templateUrl: 'view1/view1.html',
                controller: 'View1Ctrl',
                controllerAs: 'ctrl',
                resolve : {
                    'auth' : function(SessionService){
                        return SessionService.isAuthenticatedUser();
                    }
                }
            })
            .when('/view2', {
                templateUrl: 'view2/view2.html',
                controller: 'View2Ctrl',
                controllerAs: 'ctrl',
                resolve : {
                    'auth' : function(SessionService){
                        return SessionService.isAuthenticatedUser('admin');
                    }
                }

            })
            .when('/login', {
                templateUrl: 'login/login.html',
                controller: 'LoginCtrl',
                controllerAs: 'ctrl'
            })
            .when('/statistics', {
                templateUrl: 'guestMap/guestMap.html',
                controller: 'MapCtrl',
                controllerAs: 'ctrl'
            })


            .when('/map', {
                templateUrl: 'guestMap/guestMap.html',
                controller: 'MapCtrl',
                controllerAs: 'ctrl'
            })
            .when('/forbidden',{
                templateUrl: 'forbidden/forbidden.html',
                controller: 'ForbiddenCtrl',
                controllerAs: 'ctrl'
            })

            .otherwise({redirectTo: '/login'});

        /**
         *  HTTP Interceptor.
         *  En cada request, envía el token de autorización si presente.
         *  En cada respuesta, si código es 401 manda a login, si es 403 manda a forbidden.
         *  todo: tal vez en el ultimo caso podría sacarse una alertita de que no está permitida la acción.
         */
        $httpProvider.interceptors.push(['$q', '$location', 'SessionService', function ($q, $location, SessionService) {
            return {
                'request': function (config) {
                    config.headers = config.headers || {};
                    if (SessionService.token) {
                        config.headers.Authorization = 'Bearer ' + SessionService.token;
                    }
                    return config;
                },
                'responseError': function (response) {

                    //Cuando en una respuesta nos llega 401 -> Es que necesitamos login
                    if (response.status === 401) {
                        console.log("Requires authentication! Redirecting to login...");
                        $location.path('/login');
                    }

                    //Cuando en una respuesta nos llega 403 -> Es que NO tenemos permiso
                    else if (response.status === 403){
                        $location.path('/forbidden');
                    }
                    return $q.reject(response);
                }
            };
        }]);

    }])


    .run(function ($rootScope, $location) {

        /**
         * Se encarga de interceptar los errores de ruta, debido a que se intenta acceder a una RUTA DEL FRONTEND
         * no autorizada.
         */
        $rootScope.$on('$routeChangeError', function (event, current, previous, rejection) {
            //Error por no autenticado cuando se necesita autentificación
            if (rejection === 'Not Authenticated') {
                $location.path('/login');
            }
            //Error de forbidden cuando se intenta acceder a algo de un usuario que no se es
            else if (rejection === 'Forbidden'){
                $location.path('/forbidden');
            }
        })
    });