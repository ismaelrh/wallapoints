/*
* Módulo principal de routes.
* Este módulo se encarga de definir las rutas y los routers que manejan
* cada una de ellas.
* @author Ismael Rodríguez, Sergio Soro, David Vergara. 2016.
*/
module.exports = function(app) {


  app.use("/users",require('./user/user')(app));
  app.use("/pois",require('./poi/poi')(app));
  app.use("/pois/:id/ratings",require('./poi/rating')(app));
  app.use("/guests",require('./guest/guest')(app));
  app.use("/guests/:guestMail/favs",require('./guest/favourite')(app));
  app.use("/guests/:guestMail/following",require('./guest/following')(app));
  app.use("/routes",require('./route/route')(app));
  app.use("/stats/admin",require('./stats/admin/adminStats')(app));
  app.use("/stats/users/:username/routes",require('./stats/user/routeStats')(app));
  app.use("/stats/users/:username/pois",require('./stats/user/poiStats')(app));


};
