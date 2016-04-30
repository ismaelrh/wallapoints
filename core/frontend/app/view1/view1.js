'use strict';

angular.module('frontend')

.controller('View1Ctrl', ['$http',function($http) {


    var self = this; //Para no perder la variable this, la guardamos en self (de lo contrario se sobreescribe)

    self.newPost = { //Post a añadir
        title: "",
        author: "",
        text: ""
    };

    self.posts = []; //Lista de posts

    /**
     * Obtiene los posts del endpoint /post y os muestra
     */
    self.retrievePosts = function(){

       /* $http.get('/posts').then(function(response){
            self.posts = response.data.message;
        }, function(err){
            console.log(err);
        });*/

    };


    /**
     * Añade el post "newPost" al servidor.
     * Además, si se añadió correctamente, lo añade a la lista.
     */
    self.addPost = function(){

        /*$http.post('/posts', self.newPost).then(function(response){

            self.posts.push(response.data.message);
            self.newPost = {};

        }, function(err){
            console.error(err);
        });*/
    };


    self.deletePost = function(id){
        $http.delete('/posts/' + id).then(function(response){

            //Search on local array
            var index = -1;
            for(var i = 0; i < self.posts.length; i++){
                if(self.posts[i]._id == id){
                    index = i;
                    break;
                }
            }

            //Remove from local array
            if(index>-1){
                self.posts.splice(index,1);
            }

        }, function(err){
            console.error(err);
        });
    };

    //Para empezar, traemos los posts.
    self.retrievePosts();


}]);