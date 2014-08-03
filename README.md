[![Build Status](https://travis-ci.org/codedoctor/hapi-routes-users.svg?branch=master)](https://travis-ci.org/codedoctor/hapi-routes-users)
[![Coverage Status](https://img.shields.io/coveralls/codedoctor/hapi-routes-users.svg)](https://coveralls.io/r/codedoctor/hapi-routes-users)
[![NPM Version](http://img.shields.io/npm/v/hapi-routes-users.svg)](https://www.npmjs.org/package/hapi-auth-bearer-mw)
[![Dependency Status](https://gemnasium.com/codedoctor/hapi-routes-users.svg)](https://gemnasium.com/codedoctor/hapi-routes-users)
[![NPM Downloads](http://img.shields.io/npm/dm/hapi-routes-users.svg)](https://www.npmjs.org/package/hapi-auth-bearer-mw)
[![Issues](http://img.shields.io/github/issues/codedoctor/hapi-routes-users.svg)](https://github.com/codedoctor/hapi-routes-users/issues)


(C) 2014 Martin Wawrusch


DO NOT USE YET

Provides API endpoints for HAPI servers to manage users.

Dependencies:

* Requires HAPI >= 6.0.0 and hapi-identity-store


-> all -> transform user
-> extract paging and test
-> all messages into i18n
-> security
-> profile store

martin__: it's a simple plugin.ext('onPreResponse', function (request, reply) { .... });



  --- hapi-routes-users-authorizations
    @app.get '/users/:userId/authorizations',@getAuthorizations
    @app.post '/users/:userId/authorizations',@postAuthorization
    @app.delete '/users/:userId/authorizations/:authorizationId',@deleteAuthorization

  
  --- hapi-routes-oauth-management
