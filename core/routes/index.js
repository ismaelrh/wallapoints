/*
* Módulo principal de routes.
* Este módulo se encarga de definir las rutas y los routers que manejan
* cada una de ellas.
*/
module.exports = function(app) {


  app.use("/users",require('./user')(app));
  app.use("/stats/admin",require('./stats/adminStats')(app));
  app.use("/stats/users",require('./stats/userStats')(app));
  app.use("/pois",require('./poi/poi')(app));
  app.use("/pois/:id/ratings",require('./poi/rating')(app));
  app.use("/guests",require('./guest/guest')(app));
  app.use("/guests/:guestMail/favs",require('./guest/favourite')(app));
  app.use("/guests/:guestMail/following",require('./guest/following')(app));
  app.use("/routes",require('./route')(app));



};
