/**
 * Fichero que provee de funcionalidad útil a los tests, como generar JSON-WEB-TOCKENS válidos.
 * @author Ismael Rodríguez, Sergio Soro, David Vergara. 2016.
 */
var config = require("../config");
var jwt = require('jsonwebtoken');

/*
 * Genera un JWT de usuario.
 */
function generateUserToken(username){
    var userObject = {
        "username": username,
        "mail": username + "@mail.com",
        "name": "Mister " + username,
        "surname": "Mc" + username,
        "type": "user"
    };


    return jwt.sign(userObject, config.jwtsecret, {
            expiresIn: "1h"
        } // expires in 1 hour
    );
}

/**
 * Genera un JWT de invitado.
 */
function generateGuestToken(mail){

    var guestObject = {
        "mail": mail,
        "type": "guest"
    };


    return jwt.sign(guestObject, config.jwtsecret, {
            expiresIn: "1h"
        } // expires in 1 hour
    );
}


/**
 * Devuelve true si el token "token" corresponde a un usuario
 * con username "username".
 */
function checkUserToken(token,username){

    var decoded = jwt.verify(token, config.jwtsecret);
    return decoded.type == "user" && decoded.username == username;

}

/**
 * Devuelve true si el token "token" corresponde a un invitado
 * con mail "mail".
 */
function checkGuestToken(token,mail){
    var decoded = jwt.verify(token, config.jwtsecret);
    return decoded.type == "guest" && decoded.mail == mail;
}


exports.generateUserToken = generateUserToken;
exports.generateGuestToken = generateGuestToken;
exports.checkGuestToken = checkGuestToken;