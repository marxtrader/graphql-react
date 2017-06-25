'use strict';

const apiSvc = require('./apiSvc.js');

apiSvc.login('test','testx')
  .then( cookie => console.log(cookie) )
  .catch( err => console.log(err) );
  