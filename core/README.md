# WallaPoints Core

[![Build Status](https://travis-ci.com/ismaro3/wallapoints.svg?token=fCoJEKj2f8k1vssPR5Um&branch=master)](https://travis-ci.com/ismaro3/wallapoints)
[![Heroku](https://heroku-badge.herokuapp.com/?app=wallapoints)](http://wallapoints.herokuapp.com/)

##Cómo ejecutar
1. La primera vez que se descargue ejecutar `npm install` dentro del directorio 'core'.
3. Asegurarse de tener una instancia de MongoDB ejecutándose.
2. Para ejecutarlo cada vez, ejecutar `node server.js` en el directorio 'core'.

##Cómo testear
1. Ejecutar en una nueva terminal `mocha` dentro del directorio 'core'. Ejecutará los tests.

##Directorios:
* **frontend** -> Contiene el frontend escrito en AngularJS.
* **models** -> Contiene los modelos de Mongoose (MongoDB)
* **routes** -> Contiene los módulos de enrutamiento, encargados de cada uno de los recursos.
* **methods** -> Contiene algoritmos más complejos que deberían separarse de los routes por su complejidad (vacío de momento).
* **test** -> Contiene los tests de las distintas API, escritos con _Mocha_ y _Chai_.

##Archivos:
* **server.js** -> Módulo principal, lanza el servidor.
* **config.js** -> Configuración de DB y puertos.
* **package.json** -> Dependencias.


_Proyecto de STW de Ismael Rodríguez, Sergio Soro y David Vergara_

