'use strict';

// Declare app level module which depends on views, and services
angular.module('frontend', [
    'ngRoute',
    'angular-jwt',
    'LocalStorageModule',
    'uiGmapgoogle-maps',
    'ngAnimate',
    'ui.bootstrap',
    'angularUtils.directives.dirPagination',
    'chart.js',
    'dndLists'

]).config(['$routeProvider','$httpProvider', 'uiGmapGoogleMapApiProvider',function ($routeProvider,$httpProvider,uiGmapGoogleMapApiProvider) {

        uiGmapGoogleMapApiProvider.configure({
            //    key: 'your api key',
            v: '3.20', //defaults to latest 3.X anyhow
            libraries: 'weather,geometry,visualization'
        });

        $routeProvider


            .when('/login', {
                templateUrl: 'login/login.html',
                controller: 'LoginCtrl',
                controllerAs: 'ctrl'
            })
            .when('/statistics', {
                templateUrl: 'statistic/statisticPanel.html',
                controller: 'StatisticCtrl',
                controllerAs: 'ctrl'
            })

            .when('/admin', {
                templateUrl: 'adminPanel/adminPanel.html',
                controller: 'AdminPanelCtrl',
                controllerAs: 'ctrl',
                resolve : {
                    'auth' : function(SessionService){
                        return SessionService.isAuthenticatedUser('admin');
                    }
                }
            })

            .when('/editUser/:idUser', {
                templateUrl: 'editUser/editUser.html',
                controller: 'EditUserCtrl',
                controllerAs: 'ctrl',
                resolve : {
                    'auth' : function(SessionService){
                        return SessionService.isAuthenticatedUser('admin');
                    }
                }
            })

            .when('/adminMap', {
                templateUrl: 'adminMap/adminMap.html',
                controller: 'AdminMapCtrl',
                controllerAs: 'ctrl',
                resolve : {
                    'auth' : function(SessionService){
                        return SessionService.isAuthenticatedUser('admin');
                    }
                }

            })

            .when('/userMap', {
                templateUrl: 'userMap/userMap.html',
                controller: 'UserMapCtrl',
                controllerAs: 'ctrl',
                resolve : {
                    'auth' : function(SessionService){
                        return SessionService.isAuthenticatedUser();
                    }
                }

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

                    //Cuando en una respuesta nos llega 401 -> O datos incorrectos o necesitamos autenticarnos
                    if (response.status === 401) {

                        //Si el token está caducado -> Vamos a login

                        if(SessionService.token && SessionService.isTokenExpired()){
                            console.log("Expired token! Redirecting to login...");
                            $location.path('/login');
                        }

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