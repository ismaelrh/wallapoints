# WallaPoints Core

[![Build Status](https://travis-ci.org/ismaro3/wallapoints.svg?branch=master)](https://travis-ci.org/ismaro3/wallapoints)

##How to run the project
1. Clone the project.
2. Run `npm install` inside the 'core' directory.
3. Edit the 'config.js' file to suit your needs (change the secrets and the Google Maps API Key)
4. Make sure that a MongoDB instance is running.
5. To create the admin user (that can create new users) and initialize the database data, please run the 'deploy.js' file.
6. From now on, run node server.js` inside the 'core' folder every time you want to run the project.

##How to test
1. Run `mocha`inside the 'core' directory.

##Directories:
* **frontend** -> Contains the AngularJS frontend.
* **models** -> Contains the Mongoose models.
* **routes** -> Contains the enrouting modules, every one responsible for one of the REST resources.
* **test** -> Contains API test, written with _Mocha_ and _Chai_.

##Files:
* **server.js** -> Main module, launchs the server.
* **config.js** -> Configuration file: DB connection, server ports, admin user, JWT secret and Google Maps API Key.
* **deploy.js** -> Script that initializes the server data. Must be run before launching the server for the first time.
* **package.json** -> Dependencies


