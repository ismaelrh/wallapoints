/**
 * Módulo encargado de testear la API de /routes
 * Usa Mocha y Chai.
 */
process.env.NODE_ENV = 'test';

var chai = require('chai');
var chaiHttp = require('chai-http');
var server = require('../server.js');
var should = chai.should();
chai.use(chaiHttp);
var generateUserToken = require('./common').generateUserToken;


var Route = require("../models").Route;
var Poi = require("../models").Poi;


describe('Route', function () {

    var poi1_id;
    var poi2_id;
    var route1_id;

    //Insertamos dos pois antes

    before(function (done) {

        Poi.collection.drop();


        //Insertamos un poi zaragoza
        var poi1 = new Poi({
            name: "Zaragoza",
            description: "test description 1",
            "lat": 41.633,
            "long": -0.8833,
            "keywords": ["one", "two"],
            "multimediaUrl": "http://www.google.es",
            "creator": "admin"

        });

        //Insertamos un poi barcelona
        var poi2 = new Poi({
            name: "Barcelona",
            description: "test description 2",
            "lat": 41.390205,
            "long": 2.1540,
            "keywords": ["one", "two"],
            "multimediaUrl": "http://www.google.es",
            "creator": "admin"

        });



        //Primero guardamos los poi
        poi1.save(function (err, savedObject) {

            poi1_id = savedObject._id;
            poi2.save(function (err, savedObject2) {
                poi2_id = savedObject2._id;

                //Ahora guardamos ruta zgz-bcn
                var route1 = new Route({
                    name: "Zgz-Bcn",
                    creator: "admin",
                    pois: [poi1,poi2]
                });

                route1.save(function(err,savedRoute1){
                    route1_id = savedRoute1._id;
                    done();
                });

            });

        });


    });

    //Al acabar este fichero de tests, limpiamos colección de pois
    after(function (done) {

        Poi.collection.drop();
        Route.collection.drop();
        done();
    });

    /**
     * Lista todas las routes de la BD
     */
    it('should list ALL routes on /routes GET', function (done) {
        chai.request(server)
            .get('/routes')
            .end(function (err, res) {

                res.should.have.status(200);
                res.should.be.json;
                res.body.should.be.a('object');
                res.body.should.have.property('error');
                res.body.error.should.equal(false);
                res.body.should.have.property('message');
                res.body.message.should.be.a('array');
                res.body.message.should.have.lengthOf(1);



                res.body.message[0]._id.should.equal(route1_id.toString());
                res.body.message[0].name.should.equal("Zgz-Bcn");
                res.body.message[0].href.should.equal("/routes/" + route1_id);



                done();
            });
    });

    /**
     * Inserta una nueva ruta
     */
    it('should insert a new route /POST', function (done) {
        chai.request(server)
            .post('/routes')
            .send({
                name: "Bcn-Zgz",
                description: "vuelta",
                pois: [{_id:poi2_id},{_id:poi1_id}]

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




                res.body.message.name.should.equal("Bcn-Zgz");
                res.body.message.creator.should.equal("admin");
                res.body.message.pois.should.have.lengthOf(2);
                res.body.message.pois[0].name.should.equal("Barcelona");
                res.body.message.pois[1].name.should.equal("Zaragoza");



                done();
            });
    });

    /**
     * Inserta una nueva ruta con un ID incorecto
     */
    it('should insert a new route /POST with an incorrect POI', function (done) {
        chai.request(server)
            .post('/routes')
            .send({
                name: "Bcn-Zgz",
                description: "vuelta",
                pois: [{_id:poi2_id + "3"},{_id:poi1_id}]

            })
            .set('Authorization','Bearer ' + generateUserToken('admin'))
            .end(function (err, res) {

                res.should.have.status(400);
                res.should.be.json;
                res.body.should.be.a('object');
                res.body.should.have.property('error');
                res.body.error.should.equal(true);
                res.body.should.have.property('message');
                res.body.message.should.equal("Bad array pois[]");


                done();
            });
    });


    /**
     * Lista todas las routes de la BD y comprueba que se ha insertado la última
     */
    it('should list ALL routes on /routes GET', function (done) {
        chai.request(server)
            .get('/routes')
            .end(function (err, res) {

                res.should.have.status(200);
                res.should.be.json;
                res.body.should.be.a('object');
                res.body.should.have.property('error');
                res.body.error.should.equal(false);
                res.body.should.have.property('message');
                res.body.message.should.be.a('array');
                res.body.message.should.have.lengthOf(2);

                res.body.message[1].name.should.equal("Bcn-Zgz");



                done();
            });
    });

    /**
     * Obtiene el route1 de la BD
     */
    it('should get route1 on /routes/:id GET', function (done) {
        chai.request(server)
            .get('/routes/'+ route1_id)
            .end(function (err, res) {

                res.should.have.status(200);
                res.should.be.json;
                res.body.should.be.a('object');
                res.body.should.have.property('error');
                res.body.error.should.equal(false);
                res.body.should.have.property('message');
                res.body.message.should.be.a('object');

                res.body.message._id.should.equal(route1_id.toString());
                res.body.message.name.should.equal("Zgz-Bcn");
                res.body.message.creator.should.equal("admin");
                res.body.message.pois.should.have.lengthOf(2);
                res.body.message.pois[0].name.should.equal("Zaragoza");
                res.body.message.pois[0].lat.should.equal(41.633);
                res.body.message.pois[0].long.should.equal(-0.8833);
                res.body.message.pois[1].name.should.equal("Barcelona");
                res.body.message.pois[1].lat.should.equal(41.390205);
                res.body.message.pois[1].long.should.equal(2.154);

                done();
            });
    });

    /**
     * Actualiza una ruta en la BD
     */
    it('should update the route with id route1_id PUT', function (done) {
        chai.request(server)
            .put('/routes/'+ route1_id)
            .send({
                name: "Zgz-Bcn reverse",
                pois: [{_id:poi2_id},{_id:poi1_id}]
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


                res.body.message.name.should.equal("Zgz-Bcn reverse");
                res.body.message.pois.should.have.lengthOf(2);
                res.body.message.pois[1].name.should.equal("Zaragoza");
                res.body.message.pois[1].lat.should.equal(41.633);
                res.body.message.pois[1].long.should.equal(-0.8833);
                res.body.message.pois[0].name.should.equal("Barcelona");
                res.body.message.pois[0].lat.should.equal(41.390205);
                res.body.message.pois[0].long.should.equal(2.154);


                done();
            });
    });

    /**
     * borra una ruta
     */
    it('should delete the route with id route1_id DELETE', function (done) {
        chai.request(server)
            .delete('/routes/'+ route1_id)
            .set('Authorization','Bearer ' + generateUserToken('admin'))
            .end(function (err, res) {


                res.should.have.status(200);
                res.should.be.json;
                res.body.should.be.a('object');
                res.body.should.have.property('error');
                res.body.error.should.equal(false);
                res.body.should.have.property('message');
                res.body.message.should.equal('The route has been deleted');

                //Comprobamos que se ha borrado de la BD
                Route.findOne({_id:route1_id},function(err,response){

                    should.not.exist(err);
                    should.not.exist(response);
                    done();
                })


            });
    });



});