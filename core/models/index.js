/*
* Módulo principal de models.
* Este fichero se usa para centralizar todos los modelos de datos de mongoose,
* de forma que desde el exterior sólo se hará require de este, no de los
* modelos propiamente dichos.
*/


module.exports = {
  Post: require('./post.js'),
  User: require('./user.js'),
  DeletedUser: require('./deletedUser.js'),
  Guest: require('./guest.js'),
  Rating: require('./rating.js')
};
