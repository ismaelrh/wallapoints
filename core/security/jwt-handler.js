/**
 * Created by ismaro3 on 25/04/16.
 * Módulo encargado de comprobar que el JWT está disponible, excluirlo para ciertas rutas
 * y manejar los errores.
 * Si es necesario y está disponible, el objeto de user estará en req.user.
 * Módulo usado: https://github.com/auth0/express-jwt
 */

jwt = require('express-jwt');

module.exports = function jwtHandler(app){

//Middleware que añade la comprobación de JWTs
app.use(jwt({ secret: app.get('jwtsecret')})
    .unless({
        path:[ //Aqui se colocan rutas que no necesitan autenticación
            { url: "/users/login", methods: ['POST']  },  //Login
            { url: "/users", methods: ['POST']  }, //Descomentar para poder añadir usuarios, comentar en producción
            { url: /\/users\/.+/, methods: ['GET']  },    //Get a info usuario
            { url: "/pois", methods: ['GET']  },          //GET Lista de pois
            { url: "/pois/search", methods: ['POST']  }, //POST busqueda de POIs
            { url: /^\/pois\/[^\/]+$/, methods: ['GET']  }, //Acceso GET a POI individual, pero nada más (sólo /poi/ID, no /poi/id/ratings...)
            { url: /\/pois\/.*\/ratings\/mean/, methods: ['GET'] }, //Acceso GET a /poi/ID/ratings/mean
            { url: "/routes", methods: ['GET']  }, //GET Lista de routes
            { url: "/routes/search", methods: ['POST']  }, //POST busqueda de ROUTEs
            { url: /^\/routes\/[^\/]+$/, methods: ['GET']  }, //Acceso GET a ROUTE individual, pero nada más (sólo /route/ID)
            { url: "/guests", methods: ['POST']  }, //Añadir nuevo guest
            { url: "/guests/login", methods: ['POST']  } //Login de invitado
        ]}
    ));


//Middleware que gestiona errores de JWT
app.use(function (err, req, res, next) {
    if (err.name === 'UnauthorizedError') {
        res.status(401).send({"error": true,
            "message": "Invalid or non-existent token. Please provide a correct token",
            "links": [{login: "/users/login"}]});
    }
    else{
        next();
    }
});

};


