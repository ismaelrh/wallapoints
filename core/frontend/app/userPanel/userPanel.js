'use strict';

angular.module('frontend')

    .controller('UserPanelCtrl', ['$routeParams', 'SessionService', 'UserService','$rootScope',
        function ($routeParams, SessionService, UserService,$rootScope) {

            var self = this; //Para no perder la variable this, la guardamos en self (de lo contrario se sobreescribe)

            self.user = SessionService.user;

            console.log(SessionService.user);
            self.userEdited = { //User a añadir
                email: "",
                password: "",
                name: "",
                surname: ""
            };

            self.errorEdited = "";


            self.userPanel = {}; //User mostrado en el panel

            //Para mostrar alerta cuando hay errores
            self.alert = {
                show: false,
                message: ""
            };

            $rootScope.$on("errorMessage", function (event, args) {
                console.log("what");
                showAlert("danger",args.message);
            });


            function showAlert(type,message){
                self.alert.show = true;
                self.alert.type = type;
                self.alert.message = message;
                if(self.alert.type=="danger"){
                    self.alert.title = "Error!";
                }
                if(self.alert.type=="warning"){
                    self.alert.title = "Warning!"
                }
                if(self.alert.type=="success"){
                    self.alert.title = "Success!";
                }
            }


            self.showUserDetailed = function (id) {
                UserService.getUserDetail(id).then(function (response) {
                    self.userPanel = response;
                }, function (err) {
                    self.showUserDetailPanel = false;
                });
            };


            self.editUser = function () {
                UserService.updateUser(self.user.username, self.userEdited).then(function (response) {
                    self.errorEdited = "Details edited succesfully";
                    self.userPanel = response;
                    self.userEdited = {};
                }, function (err) {
                    self.errorEdited = "Error on the database";
                    console.error(err);
                });
            };


            //Para empezar, traemos el user.
            self.showUserDetailed(self.user.username);


        }]);
