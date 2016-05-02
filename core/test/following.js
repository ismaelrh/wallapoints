/**
 * Módulo encargado de testear la API de /guest/:guestMail/following
 * Usa Mocha y Chai.
 */
process.env.NODE_ENV = 'test';

var chai = require('chai');
var chaiHttp = require('chai-http');
var server = require('../server.js');
var should = chai.should();
chai.use(chaiHttp);
var generateGuestToken = require('./common').generateGuestToken;


var Guest = require("../models").Guest;
var User = require("../models").User;


describe('Following', function () {


    var user1_id;
    var user2_id;

    //Antes de todos los tests de este fichero, borramos la colección de invitados,
    //añadiendo uno con dos usuarios siguiendo.
    before(function (done) {

        Guest.collection.drop();
        User.collection.drop();

        //Insertamos un usuario
        var user1 = new User(
            {
                username: "user1",
                name: "name1",
                surname: "surname1",
                email: "user1@mail.com",
                password: "password",
                registerDate:  new Date()
            }

        );

        var user2 = new User(
            {
                username: "user2",
                name: "name2",
                surname: "surname2",
                email: "user2@mail.com",
                password: "password",
                registerDate:  new Date()
            }

        );




        //Primero guardamos los usuarios
        user1.save(function(err,savedObject){


            user1_id = savedObject._id;
            user2.save(function(err,savedObject2){
                user2_id = savedObject2._id;


                //Añadimos un invitado con dos usuarios siguiendo
                var guest1 = new Guest({
                    "mail": "guest1@mail.com",
                    "password": "5f4dcc3b5aa765d61d8327deb882cf99", //md5 for "password"
                    "following": [user1._id,user2._id] //Se empieza siguiendo dos usuarios
                });

                guest1.save(function(err,savedObject){


                   done();

                });


            });

        });



    });


    //Al acabar este fichero de tests, limpiamos colección de invitados
    after(function(done){

        Guest.collection.drop();
        User.collection.drop();
        done();
    });


    /**
     * Lista todos los usuarios que sigue el invitado guest1@mail.com creado, que serán el user1 y user2 creados.
     */
    it('should list ALL followings on /guests/:id/following GET', function (done) {
        chai.request(server)
            .get('/guests/guest1@mail.com/following')
            .set('Authorization','Bearer ' + generateGuestToken('guest1@mail.com'))
            .end(function (err, res) {


                res.should.have.status(200);
                res.should.be.json;
                res.body.should.be.a('object');
                res.body.should.have.property('error');
                res.body.error.should.equal(false);
                res.body.should.have.property('message');
                res.body.message.should.be.a('array');

                res.body.message.should.have.lengthOf(2);

                res.body.message[0].username.should.equal("user1");
                res.body.message[0].email.should.equal("user1@mail.com");
                res.body.message[0].href.should.equal("/users/user1");


                res.body.message[1].username.should.equal("user2");
                res.body.message[1].email.should.equal("user2@mail.com");
                res.body.message[1].href.should.equal("/users/user2");


                done();
            });
    });


    /**
     * Quita de siguiendo el user2 creado, y posteriormente comprobar en BD que se ha dejado de seguir.
     */
    it('should unset a following on /guests/:id/following DELETE', function (done) {
        chai.request(server)
            .delete('/guests/guest1@mail.com/following/user2')
            .set('Authorization','Bearer ' + generateGuestToken('guest1@mail.com'))
            .end(function (err, res) {

                res.should.have.status(200);
                res.should.be.json;
                res.body.should.be.a('object');
                res.body.should.have.property('error');
                res.body.error.should.equal(false);
                res.body.should.have.property('message');
                res.body.message.should.be.a('string');
                res.body.message.should.equal("The user has been unfollowed");

                //Verificamos en la BD que se ha quitado de siguiendo
                Guest.findOne({mail: "guest1@mail.com"},function(err,result){
                    var indexOfUser2 = result.following.indexOf("user2");
                    indexOfUser2.should.equal(-1);
                });


                done();
            });
    });

    /**
     * Pone como siguienod el user2 creado, y comprobar en BD que se ha puesto.
     */
    it('should set a following on /guests/:id/following PUT', function (done) {
        chai.request(server)
            .put('/guests/guest1@mail.com/following/user2')
            .set('Authorization','Bearer ' + generateGuestToken('guest1@mail.com'))
            .end(function (err, res) {

                ;
                res.should.have.status(200);
                res.should.be.json;
                res.body.should.be.a('object');
                res.body.should.have.property('error');
                res.body.error.should.equal(false);
                res.body.should.have.property('message');
                res.body.message.should.be.a('object');

                res.body.message.username.should.equal("user2");
                res.body.message.email.should.equal("user2@mail.com");
                res.body.message.href.should.equal("/users/user2");


                //Verificamos en la BD que se ha puesto como siguiendo
                Guest.findOne({mail: "guest1@mail.com"},function(err,result){
                    var indexOfUser2 = result.following.indexOf(user2_id);
                    indexOfUser2.should.not.equal(-1);
                });

                done();
            });
    });


    /**
     * Prueba que deniega el uso de una operación de un guest si el que está
     * logueado es otro guest.
     */
    it('should denegate operate with GUEST favs with another guest login', function (done) {
        chai.request(server)
            .get('/guests/guest1@mail.com/following')
            .set('Authorization','Bearer ' + generateGuestToken('anotherguest@mail.com'))
            .end(function (err, res) {


                res.should.have.status(403);
                res.should.be.json;
                res.body.should.be.a('object');
                res.body.should.have.property('error');
                res.body.error.should.equal(true);
                res.body.should.have.property('message');
                res.body.message.should.equal("Forbidden. You are not authorized.");


                done();
            });
    });







});