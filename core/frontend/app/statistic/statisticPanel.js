'use strict';

angular.module('frontend')

.controller('StatisticCtrl', ['$http',function($http) {

    var self = this; //Para no perder la variable this, la guardamos en self (de lo contrario se sobreescribe)


    self.UsersRegister = function(){
        $http.get('/stats/users/date').then(function(response){
            self.dates=response.data.message.dates;
            self.userData=response.data.message.userData;
            self.usersSeries = ['Alta', 'Baja'];

        },  function(err){
            console.error(err);
        });
    };




    //Para empezar, traemos los datos.
    self.UsersRegister();


}]);