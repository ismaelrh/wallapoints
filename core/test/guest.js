/**
 * Módulo encargado de testear la API de /guest
 * Usa Mocha y Chai.
 */
process.env.NODE_ENV = 'test';

var chai = require('chai');
var chaiHttp = require('chai-http');
var server = require('../server.js');
var should = chai.should();
chai.use(chaiHttp);
var generateUserToken = require('./common').generateUserToken;
var generateGuestToken = require('./common').generateGuestToken;
var checkGuestToken = require('./common').checkGuestToken;


var Guest = require("../models").Guest;



describe('Guest', function () {



    //Antes de todos los tests de este fichero, borramos la colección de invitados y añadimos dos mas.
    before(function (done) {

        Guest.collection.drop();

        var guest1 = new Guest({
            "mail": "guest1@mail.com",
            "password": "5f4dcc3b5aa765d61d8327deb882cf99" //md5 for "password"
        });

        var guest2 = new Guest({
            "mail": "guest2@mail.com",
            "password": "5f4dcc3b5aa765d61d8327deb882cf99" //md5 for "password"
        });


        guest1.save(function(err,savedObject){
            guest2.save(function(err,savedObject2){
                done();
            });

        });


    });


    //Al acabar este fichero de tests, limpiamos colección de invitados
    after(function(done){

        Guest.collection.drop();
        done();
    });



    it('should list ALL guests on /guests GET', function (done) {
        chai.request(server)
            .get('/guests')
            .set('Authorization','Bearer ' + generateUserToken('admin'))
            .end(function (err, res) {

                res.should.have.status(200);
                res.should.be.json;
                res.body.should.be.a('object');
                res.body.should.have.property('error');
                res.body.error.should.equal(false);
                res.body.should.have.property('message');

                res.body.message.should.be.a('array');
                res.body.message.should.have.lengthOf(2);
                res.body.message[0].mail.should.equal("guest1@mail.com");
                res.body.message[1].mail.should.equal("guest2@mail.com");


                done();
            });
    });


    /*
     * Añade un nuevo guest y comprueba la respuesta de añadirlo.
     */
    it('should add a new guest on /guests POST', function (done) {
        chai.request(server)
            .post('/guests')
            .send({mail:'guest3@mail.com',password:'password'})
            .end(function (err, res) {

                res.should.have.status(200);
                res.should.be.json;
                res.body.should.be.a('object');
                res.body.should.have.property('error');
                res.body.error.should.equal(false);
                res.body.should.have.property('message');

                res.body.message.should.be.a('object');
                res.body.message.mail.should.equal("guest3@mail.com");
                res.body.message.following.should.equal("/guests/guest3@mail.com/following");
                res.body.message.favourite.should.equal("/guests/guest3@mail.com/favs");
                res.body.message.href.should.equal("/guests/guest3@mail.com");


                done();




            });
    });

    /**
     * Comprueba que alguien con la sesión del guest3 (añadido anteriormente)
     * puede acceder a sus detalles.
     */
    it('should get details of a guest on GET /guests/:id', function (done) {
        chai.request(server)
            .get('/guests/guest3@mail.com')
            .set('Authorization','Bearer ' + generateUserToken('admin'))
            .end(function (err, res) {



                res.should.have.status(200);
                res.should.be.json;
                res.body.should.be.a('object');
                res.body.should.have.property('error');
                res.body.error.should.equal(false);
                res.body.should.have.property('message');

                res.body.message.should.be.a('object');
                res.body.message.mail.should.equal("guest3@mail.com");
                res.body.message.following.should.equal("/guests/guest3@mail.com/following");
                res.body.message.favourite.should.equal("/guests/guest3@mail.com/favs");
                res.body.message.href.should.equal("/guests/guest3@mail.com");


                done();
            });
    });

    /**
     * Actualiza el password de un invitado y prueba a hacer login con el nuevo password
     */
    it('should update a guests password on PUT /guest/:mail', function (done) {
        chai.request(server)
            .put('/guests/guest3@mail.com')
            .send({mail:'guest3@mail.com',password:'newPassword'})
            .set('Authorization','Bearer ' + generateGuestToken('guest3@mail.com'))
            .end(function (err, res) {

                res.should.have.status(200);
                res.should.be.json;
                res.body.should.be.a('object');
                res.body.should.have.property('error');
                res.body.error.should.equal(false);

                //Ahora probamos que se puede hacer login con ese pass
                chai.request(server)
                    .post('/guests/login')
                    .send({mail:'guest3@mail.com',password:'newPassword'})
                    .end(function (err, res) {

                        res.should.have.status(200);
                        res.should.be.json;
                        res.body.should.be.a('object');
                        res.body.should.have.property('error');
                        res.body.error.should.equal(false);
                        res.body.should.have.property('message');



                        done();

                    });


            });
    });

    /**
     * Borra un invitado, comprueba la respuesta y comprueba la BD.
     */
    it('should delete a guest on DELETE /guest/:mail', function (done) {
        chai.request(server)
            .delete('/guests/guest3@mail.com')
            .set('Authorization','Bearer ' + generateGuestToken('guest3@mail.com'))
            .end(function (err, res) {


                res.should.have.status(200);
                res.should.be.json;
                res.body.should.be.a('object');
                res.body.should.have.property('error');
                res.body.error.should.equal(false);
                res.body.should.have.property('message');
                res.body.message.should.equal('The guest has been deleted');

                //Miramos en la BD si existe
                Guest.findOne({mail: "guest3@mail.com"},function(err,response){
                    should.not.exist(response);
                    done();
                });



            });
    });


    /**
     * Hace login para el invitado guest1. Comprueba que la respuesta
     * es de éxito y comprueba el contenido del token.
     */

    it('POST guest/login with correct data should give correct JWT', function (done) {
        //Ahora probamos que se puede hacer login con ese pass
        chai.request(server)
            .post('/guests/login')
            .send({mail:'guest1@mail.com',password:'password'})
            .end(function (err, res) {

                res.should.have.status(200);
                res.should.be.json;
                res.body.should.be.a('object');
                res.body.should.have.property('error');
                res.body.error.should.equal(false);
                res.body.should.have.property('message');
                var token = res.body.message;


                checkGuestToken(token,"guest1@mail.com").should.equal(true);


                done();

            });

    });


    /**
     * Hace login de un invitado con contraseña incorrecta y comprueba resultado.
     */
    it('POST guest/login with wrong password should give error', function (done) {
        //Ahora probamos que se puede hacer login con ese pass
        chai.request(server)
            .post('/guests/login')
            .send({mail:'guest1@mail.com',password:'wrongPassword'})
            .end(function (err, res) {

                res.should.have.status(401);
                res.should.be.json;
                res.body.should.be.a('object');
                res.body.should.have.property('error');
                res.body.error.should.equal(true);
                res.body.should.have.property('message');
                res.body.message.should.equal("Incorrect mail or password");


                done();

            });

    });



});