/*
* Módulo principal de routes.
* Este módulo se encarga de definir las rutas y los routers que manejan
* cada una de ellas.
*/
module.exports = function(app) {


  app.use("/users",require('./user')(app));
  app.use("/posts",require('./post')(app));

}
