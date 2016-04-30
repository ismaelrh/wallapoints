/**
 * Módulo encargado de testear la API de /guest/:guestMail/favs
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
var Poi = require("../models").Poi;


describe('Favourite', function () {


    var poi1_id;
    var poi2_id;

    //Antes de todos los tests de este fichero, borramos la colección de invitados,
    //añadiendo uno con dos poi favoritos.
    before(function (done) {

        Guest.collection.drop();
        Poi.collection.drop();

        //Insertamos un poi
        var poi1 = new Poi({
            name: "test poi 1",
            description: "test description 1",
            "lat": 1.23,
            "long": 3.21,
            "keywords": ["one","two"],
            "multimediaUrl": "http://www.google.es",
            "creator": "admin"

        });

        var poi2 = new Poi({
            name: "test poi 2",
            description: "test description 2",
            "lat": 1.23,
            "long": 3.21,
            "keywords": ["one","two"],
            "multimediaUrl": "http://www.google.es",
            "creator": "admin"

        });



        //Primero guardamos los poi
        poi1.save(function(err,savedObject){

            poi1_id = savedObject._id;
            poi2.save(function(err,savedObject2){
                poi2_id = savedObject2._id;

                //Añadimos un invitado con dos pois favoritos
                var guest1 = new Guest({
                    "mail": "guest1@mail.com",
                    "password": "5f4dcc3b5aa765d61d8327deb882cf99", //md5 for "password"
                    "favourite": [poi1_id,poi2_id]
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
        Poi.collection.drop();
        done();
    });


    /**
     * Lista todos los favoritos del invitado guest1@mail.com creado, que serán el poi1 y poi2 creados.
     */
    it('should list ALL favourites on /guests/:id/favs GET', function (done) {
        chai.request(server)
            .get('/guests/guest1@mail.com/favs')
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

                res.body.message[0].id.should.equal(poi1_id.toString());
                res.body.message[0].name.should.equal("test poi 1");
                res.body.message[0].lat.should.equal(1.23);
                res.body.message[0].long.should.equal(3.21);
                res.body.message[0].href.should.equal("/pois/" + poi1_id);

                res.body.message[1].id.should.equal(poi2_id.toString());
                res.body.message[1].name.should.equal("test poi 2");
                res.body.message[1].lat.should.equal(1.23);
                res.body.message[1].long.should.equal(3.21);
                res.body.message[1].href.should.equal("/pois/" + poi2_id);


                done();
            });
    });


    /**
     * Quita de favoritos el poi2 creado, y en BD comprobar que se ha quitado.
     */
    it('should unset a favourite on /guests/:id/favs DELETE', function (done) {
        chai.request(server)
            .delete('/guests/guest1@mail.com/favs/' + poi2_id.toString())
            .set('Authorization','Bearer ' + generateGuestToken('guest1@mail.com'))
            .end(function (err, res) {

                res.should.have.status(200);
                res.should.be.json;
                res.body.should.be.a('object');
                res.body.should.have.property('error');
                res.body.error.should.equal(false);
                res.body.should.have.property('message');
                res.body.message.should.be.a('string');
                res.body.message.should.equal("Poi deleted from fav list");

                //Verificamos en la BD que se ha quitado de favorito
                Guest.findOne({mail: "guest1@mail.com"},function(err,result){
                    var indexOfPoi2 = result.favourite.indexOf(poi2_id);
                    indexOfPoi2.should.equal(-1);
                });


                done();
            });
    });

    /**
     * Pone como favorito el poi2 creado, y comprobar en BD que se ha puesto.
     */
    it('should set a favourite on /guests/:id/favs PUT', function (done) {
        chai.request(server)
            .put('/guests/guest1@mail.com/favs/' + poi2_id.toString())
            .set('Authorization','Bearer ' + generateGuestToken('guest1@mail.com'))
            .end(function (err, res) {

                res.should.have.status(200);
                res.should.be.json;
                res.body.should.be.a('object');
                res.body.should.have.property('error');
                res.body.error.should.equal(false);
                res.body.should.have.property('message');
                res.body.message.should.be.a('object');

                res.body.message._id.should.equal(poi2_id.toString());
                res.body.message.name.should.equal("test poi 2");
                res.body.message.lat.should.equal(1.23);
                res.body.message.long.should.equal(3.21);
                res.body.message.href.should.equal("/pois/" + poi2_id);


                //Verificamos en la BD que se ha puesto como favorito
                Guest.findOne({mail: "guest1@mail.com"},function(err,result){
                    var indexOfPoi2 = result.favourite.indexOf(poi2_id);
                    indexOfPoi2.should.not.equal(-1);
                });

                done();
            });
    });


    /**
     * Prueba que deniega el uso de una operación de un guest si el que está
     * logueado es otro guest.
     */
    it('should denegate operate with GUEST following with another guest login', function (done) {
        chai.request(server)
            .get('/guests/guest1@mail.com/favs')
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