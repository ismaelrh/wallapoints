'use strict';

angular.module('frontend')

.controller('StatisticCtrl', ['$http',function($http) {

    var self = this; //Para no perder la variable this, la guardamos en self (de lo contrario se sobreescribe)

    self.errorYaExiste ="";

    self.newUser = { //User a añadir
        username: "",
        email: "",
        name: "",
        surname:""
    };

    self.users = []; //Lista de users
    self.dates = ['2006', '2007', '2008', '2009', '2010', '2011', '2012']; //Lista de fechas de dias de registro y baja
    self.usersSeries = ['Alta', 'Baja'];
    self.userData = [
        [65, 59, 80, 81, 56, 55, 40],
        [28, 48, 40, 19, 86, 27, 90]
    ];

    self.userDetailed ={
        username: "",
        email: "",
        name: "",
        surname: "",
        registerDate: "",
        lastAccessDate: "",
        href: ""
    };

    self.UsersRegister = function(){
        $http.get('/stats/users/date').then(function(response){
            self.dates=response.data.message;
            $http.get('/stats/users/data').then(function(response){
                self.userData=response.data.message;
                console.log(response.data.message);
            },  function(err){
                console.error(err);
            });
            console.log(response.data.message);
        },  function(err){
            console.error(err);
        });
    };

    self.showUsers = function(){
        $http.get('/users').then(function(response){
            self.users=response.data.message;
            console.log(response.data.message);
        },  function(err){
            console.error(err);
        });
    };

    self.showUserDetailed = function(id){
        $http.get('/users/'+id).then(function(response){
            self.userDelaited=response.data.message;
            console.log(data.message);
        },  function(err){
            console.error(err);
        });
    };

    self.addUser = function(){
        $http.post('/users', self.newUser).then(function(response){
            self.errorYaExiste="";
            self.userAdded ={
                username: response.data.message.username,
                email: response.data.message.email,
                href: response.data.message.href
            };

            self.users.push(self.userAdded);
            self.newPost = {};
            console.log(data.message);
        },  function(err){
            self.errorYaExiste="Insert another unsername, already exists int the system";
            console.error(err);
        });
    };


    self.deleteUser = function(id){
        $http.delete('/users/' + id).then(function(response){

            //Search on local array
            var index = -1;
            for(var i = 0; i < self.users.length; i++){
                if(self.users[i].username == id){
                    index = i;
                    break;
                }
            }

            //Remove from local array
            if(index>-1){
                self.users.splice(index,1);
                console.error("User deleted");
            }


        }, function(err){
            console.error(err);
        });
    };

    self.submitForm=function(content){

    };


    //Para empezar, traemos los users.
    self.showUsers();
    self.UsersRegister();


}]);