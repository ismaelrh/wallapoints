'use strict';

// Declare app level module which depends on views, and services
angular.module('frontend', [
  'ngRoute'
]).
config(['$routeProvider', function($routeProvider) {
$routeProvider

  .when('/view1', {
    templateUrl: 'views/view1.html',
    controller: 'View1Ctrl',
    controllerAs: 'ctrl'
  })
  .when('/view2', {
    templateUrl: 'views/view2.html',
    controller: 'View2Ctrl',
    controllerAs: 'ctrl'
  })

    .otherwise({redirectTo: '/view1'});
}]);
