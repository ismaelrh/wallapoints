module.exports = {
    db:
    {
        production: "mongodb://localhost/wallapoints-prod",
        development: "mongodb://localhost/wallapoints-dev",
        test: "mongodb://localhost/wallapoints-test",
        docker: "mongodb://mongo/wallapoints-prod"

    },
    port:{
        production: 8888,
        development: 8888,
        docker: 8888,
        test: 8889
    },
    deploy:{
        admin:{
            password: "1",
            email: "admin@mail.com",
            name: "Ismael",
            surname: "Rodríguez"
        }
    },
    jwtsecret: "firmasuperlargaeimposibledeadivinar",
    "gmaps-api-key": "AIzaSyD6pa36NtjEyNdffeAwWJFY44k_C4z2lh8"

};
