/**
 * Módulo encargado de testear la API de /pois
 * Usa Mocha y Chai.
 */
process.env.NODE_ENV = 'test';

var chai = require('chai');
var chaiHttp = require('chai-http');
var server = require('../server.js');
var should = chai.should();
chai.use(chaiHttp);
var generateUserToken = require('./common').generateUserToken;


var Poi = require("../models").Poi;


describe('Favourite', function () {

    before(function (done) {

        Poi.collection.drop();

        //Insertamos un poi
        var poi1 = new Poi({
            name: "test poi 1",
            description: "test description 1",
            "lat": 1.23,
            "long": 3.21,
            "keywords": ["one", "two"],
            "multimediaUrl": "http://www.google.es",
            "creator": "admin"

        });

        var poi2 = new Poi({
            name: "test poi 2",
            description: "test description 2",
            "lat": 1.23,
            "long": 3.21,
            "keywords": ["one", "two"],
            "multimediaUrl": "http://www.google.es",
            "creator": "admin"

        });

        //Primero guardamos los poi
        poi1.save(function (err, savedObject) {

            poi1_id = savedObject._id;
            poi2.save(function (err, savedObject2) {
                poi2_id = savedObject2._id;

            });

        });

        done();
    });

    //Al acabar este fichero de tests, limpiamos colección de invitados
    after(function (done) {

        Poi.collection.drop();
        done();
    });

    /**
     * Lista todos los pois de la bd
     */
    it('should list ALL pois on /pois GET', function (done) {
        chai.request(server)
            .get('/pois')
            .end(function (err, res) {

                res.should.have.status(200);
                res.should.be.json;
                res.body.should.be.a('object');
                res.body.should.have.property('error');
                res.body.error.should.equal(false);
                res.body.should.have.property('message');
                res.body.message.should.be.a('array');
                res.body.message.should.have.lengthOf(2);

                res.body.message[0]._id.should.equal(poi1_id.toString());
                res.body.message[0].name.should.equal("test poi 1");
                res.body.message[0].lat.should.equal(1.23);
                res.body.message[0].long.should.equal(3.21);
                res.body.message[0].href.should.equal("/pois/" + poi1_id);

                res.body.message[1]._id.should.equal(poi2_id.toString());
                res.body.message[1].name.should.equal("test poi 2");
                res.body.message[1].lat.should.equal(1.23);
                res.body.message[1].long.should.equal(3.21);
                res.body.message[1].href.should.equal("/pois/" + poi2_id);


                done();
            });
    });

    /**
     * Inserta un nuevo poi en la bd
     */
    it('should insert a new poi /POST', function (done) {
        chai.request(server)
            .post('/pois')
            .send({
                name: "test poi 3",
                description: "test description 3",
                "lat": 1.23,
                "long": 3.21,
                "keywords": ["one", "two"],
                "multimediaUrl": "http://www.google.es",
                "creator": "admin"

            })
            .set('Authorization','Bearer ' + generateUserToken('admin'))
            .end(function (err, res) {

                res.should.have.status(200);
                res.should.be.json;
                res.body.should.be.a('object');
                res.body.should.have.property('error');
                res.body.error.should.equal(false);
                res.body.should.have.property('message');
                res.body.message.should.be.a('object');

                res.body.message.name.should.equal("test poi 3");
                res.body.message.lat.should.equal(1.23);
                res.body.message.long.should.equal(3.21);
                res.body.should.have.property('links');
                res.body.links[0].poiList.should.equal("/pois");

                done();
            });
    });

    /**
     * Lista todos los pois de la bd y compruba que se inserto el ultimo
     */
    it('should list ALL pois on /pois GET', function (done) {
        chai.request(server)
            .get('/pois')
            .end(function (err, res) {

                res.should.have.status(200);
                res.should.be.json;
                res.body.should.be.a('object');
                res.body.should.have.property('error');
                res.body.error.should.equal(false);
                res.body.should.have.property('message');
                res.body.message.should.be.a('array');
                res.body.message.should.have.lengthOf(3);

                res.body.message[2].name.should.equal("test poi 3");
                res.body.message[2].lat.should.equal(1.23);
                res.body.message[2].long.should.equal(3.21);


                done();
            });
    });

    /**
     * Obtiene el poi1 de la bd
     */
    it('should get poi1 on /pois/:id GET', function (done) {
        chai.request(server)
            .get('/pois/'+ poi1_id)
            .end(function (err, res) {

                res.should.have.status(200);
                res.should.be.json;
                res.body.should.be.a('object');
                res.body.should.have.property('error');
                res.body.error.should.equal(false);
                res.body.should.have.property('message');
                res.body.message.should.be.a('object');

                res.body.message._id.should.equal(poi1_id.toString());
                res.body.message.name.should.equal("test poi 1");
                res.body.message.lat.should.equal(1.23);
                res.body.message.long.should.equal(3.21);
                res.body.message.href.should.equal("/pois/" + poi1_id);

                done();
            });
    });

    /**
     * actualiza un poi en la bd
     */
    it('should update the poi with id poi1_id PUT', function (done) {
        chai.request(server)
            .put('/pois/'+ poi1_id)
            .send({
                name: "test poi 1 modified",
                "lat": 4.33,
                "long": 3.21
            })
            .set('Authorization','Bearer ' + generateUserToken('admin'))
            .end(function (err, res) {

                res.should.have.status(200);
                res.should.be.json;
                res.body.should.be.a('object');
                res.body.should.have.property('error');
                res.body.error.should.equal(false);
                res.body.should.have.property('message');
                res.body.message.should.be.a('object');

                res.body.message.name.should.equal("test poi 1 modified");
                res.body.message.lat.should.equal(4.33);
                res.body.message.long.should.equal(3.21);
                res.body.should.have.property('links');
                res.body.links[0].poiList.should.equal("/pois");

                done();
            });
    });

    /**
     * actualiza un poi en la bd
     */
    it('should delete the poi with id poi1_id DELETE', function (done) {
        chai.request(server)
            .delete('/pois/'+ poi1_id)
            .set('Authorization','Bearer ' + generateUserToken('admin'))
            .end(function (err, res) {

                res.should.have.status(200);
                res.should.be.json;
                res.body.should.be.a('object');
                res.body.should.have.property('error');
                res.body.error.should.equal(false);
                res.body.should.have.property('message');
                res.body.message.should.equal('Poi deleted successfully');

                done();
            });
    });


    /**
     * Borra todos los poi de admin
     */
    it('should delete ALL admin pois /pois DELETE', function (done) {
        chai.request(server)
            .delete('/pois')
            .send({
                creator:'admin'
            })
            .set('Authorization','Bearer ' + generateUserToken('admin'))
            .end(function (err, res) {

                res.should.have.status(200);
                res.should.be.json;
                res.body.should.be.a('object');
                res.body.should.have.property('error');
                res.body.error.should.equal(false);
                res.body.should.have.property('message');
                res.body.message.should.equal('Pois deleted successfully');

                done();
            });
    });


});