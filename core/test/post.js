/**
 * Módulo encargado de testear la API de /post.
 * Usa Mocha y Chai.
 */
process.env.NODE_ENV = 'test';

var chai = require('chai');
var chaiHttp = require('chai-http');
var server = require('../server.js');
var should = chai.should();
chai.use(chaiHttp);

var Post = require("../models").Post;

describe('Post', function () {

    var newPostId;

    Post.collection.drop();

    //Antes de cada test de post, añadimos un post.
    beforeEach(function (done) {

        var newPost = new Post({
            title: 'Title',
            author: 'Author',
            text: 'Text'
        });

        newPost.save(function(err,savedObject){
            newPostId = savedObject._id; //Necesario obtener el ID devuelto
            done();
        });

    });

    //Tras cada test de post, los borramos
    afterEach(function (done) {
        Post.collection.drop();
        done();
    });


    it('should list ALL posts on /post GET', function (done) {
        chai.request(server)
            .get('/posts')
            .end(function (err, res) {

                res.should.have.status(200);
                res.should.be.json;
                res.body.should.be.a('object');
                res.body.should.have.property('error');
                res.body.error.should.equal(false);
                res.body.should.have.property('message');
                res.body.message.should.be.a('array');
                res.body.message[0].title.should.equal('Title');
                res.body.message[0].author.should.equal('Author');
                res.body.message[0].text.should.equal('Text');
                res.body.message[0]._id.should.equal(newPostId.toString());


                done();
            });
    });


    it('should add a SINGLE post on /post POST',function(done){

        chai.request(server)
            .post('/posts')
            .send({title:'Title2',author:'Author2',text:'Text2'})
            .end(function(err,res){


                res.should.have.status(200);
                res.should.be.json;
                res.body.should.be.a('object');
                res.body.should.have.property('error');
                res.body.error.should.equal(false);
                res.body.should.have.property('message');
                res.body.message.should.be.a('object');
                res.body.message.title.should.equal('Title2');
                res.body.message.author.should.equal('Author2');
                res.body.message.text.should.equal('Text2');
                done();
            });

    });


    it('should remove a SINGLE post on /post/:id DELETE',function(done){


        chai.request(server)
            .delete('/posts/'+newPostId)
            .end(function(err,res){


                res.should.have.status(200);
                res.should.be.json;
                res.body.should.be.a('object');
                res.body.should.have.property('error');
                res.body.error.should.equal(false);
                res.body.should.have.property('message');
                res.body.message.should.be.a('object');
                res.body.message.n.should.equal(1);
                done();
            });

    });


});