'use strict';

angular.module('frontend')

    .controller('UserPanelCtrl', ['$http','$routeParams','SessionService',function($http,$routeParams,SessionService) {

        var self = this; //Para no perder la variable this, la guardamos en self (de lo contrario se sobreescribe)

        self.user= SessionService.user;
        console.log(SessionService.user);
        self.userEdited = { //User a añadir
            email: "",
            password: "",
            name: "",
            surname:""
        };

        self.errorEdited ="";

        self.userPanel = { //User mostrado en el panel
        };


        self.showUserDetailed = function(id){
            $http.get('/users/'+id).then(function(response){
                self.userPanel=response.data.message;
                console.log(response.data.message);
            },  function(err){
                self.showUserDetailPanel = false;
                console.error(err);
            });
        };

        self.editUser = function(){
            $http.put('/users/'+self.user.username, self.userEdited).then(function(response){
                self.errorEdited="Details edited succesfully";
                self.userPanel=response.data.message;

                self.userEdited = {};
                console.log(response.data.message);
            },  function(err){
                self.errorEdited="Error on the database";
                console.error(err);
            });
        };



        //Para empezar, traemos el user.
        self.showUserDetailed(self.user.username);


    }]);
