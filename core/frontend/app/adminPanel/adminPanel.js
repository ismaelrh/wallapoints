'use strict';

/**
 * Controlador de panel de administrador.
 * @author Ismael Rodríguez, Sergio Soro, David Vergara. 2016.
 */
angular.module('frontend')

    .controller('AdminPanelCtrl', ['$location', 'SessionService', 'UserService', '$rootScope', function ($location, SessionService, UserService, $rootScope) {

        var self = this; //Para no perder la variable this, la guardamos en self (de lo contrario se sobreescribe)

        self.errorYaExiste = "";
        self.passwordCreated = "";


        self.newUser = { //User a añadir
            username: "",
            email: "",
            name: "",
            surname: ""
        };

        self.userPanel = { //User mostrado en el panel
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

        self.showUserDetailPanel = false;

        self.users = []; //Lista de users


        self.showUsers = function () {
            UserService.getUserList().then(function (response) {
                self.users = response;
            }, function (err) {
                console.error(err);
            });
        };

        self.showUserDetailed = function (id) {
            UserService.getUserDetail(id).then(function (response) {
                self.showUserDetailPanel = true;
                self.userPanel = response;
                
            }, function (err) {
                self.showUserDetailPanel = false;
                console.error(err);
            });
        };


        self.addUser = function () {
            UserService.addNewUser(self.newUser)
                .then(function (response) {
                    self.errorYaExiste = "User inserted succesfully";
                    self.passwordCreated = "Password: " + response.password;
                    self.userAdded = {
                        username: response.username,
                        email: response.email,
                        href: response.href
                    };

                    self.users.push(self.userAdded);
                    self.newPost = {};
                }, function (err) {
                    self.errorYaExiste = "Insert another unsername, already exists int the system";
                    self.passwordCreated = "";
                    console.error(err);
                });
        };


        self.deleteUser = function (id) {
            UserService.deleteUser(id).then(function (response) {
                self.showUserDetailPanel = false;
                //Search on local array
                var index = -1;
                for (var i = 0; i < self.users.length; i++) {
                    if (self.users[i].username == id) {
                        index = i;
                        break;
                    }
                }

                //Remove from local array
                if (index > -1) {
                    self.users.splice(index, 1);
                    
                }


            }, function (err) {
                console.error(err);
            });
        };


        self.editUser = function (id) {
            $location.path("/editUser/" + id)
        };

        self.logOut = function () {
            SessionService.logOut();
        };

        //Para empezar, traemos los users.
        self.showUsers();


    }]);