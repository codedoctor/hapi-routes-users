(function() {
  var Boom, Hoek, Joi, helperAddTokenToUser, url, validationSchemas, _;

  _ = require('underscore');

  Boom = require('boom');

  Hoek = require("hoek");

  Joi = require("joi");

  url = require('url');

  helperAddTokenToUser = require('./helper-add-token-to-user');

  validationSchemas = require('./validation-schemas');

  module.exports = function(plugin, options) {
    var hapiIdentityStore, methodsOauthAuth, methodsUsers;
    if (options == null) {
      options = {};
    }
    Hoek.assert(options.clientId, "options parameter requires a clientId");
    Hoek.assert(options.accountId, "options parameter requires an accountId");
    Hoek.assert(options.baseUrl, "options parameter requires an baseUrl");
    Hoek.assert(options.realm, "options parameter requires a realm");
    options.scope || (options.scope = null);
    hapiIdentityStore = function() {
      return plugin.plugins['hapi-identity-store'];
    };
    Hoek.assert(hapiIdentityStore(), "Could not find 'hapi-identity-store' plugin.");
    methodsUsers = function() {
      return hapiIdentityStore().methods.users;
    };
    methodsOauthAuth = function() {
      return hapiIdentityStore().methods.oauthAuth;
    };
    Hoek.assert(methodsUsers(), "Could not find 'methods.users' in 'hapi-identity-store' plugin.");
    Hoek.assert(methodsOauthAuth(), "Could not find  'methods.oauthAuth' in 'hapi-identity-store' plugin.");

    /*
    Creates a new user and returns it and the new session.
     */
    return plugin.route({
      path: "/users",
      method: "POST",
      config: {
        auth: false,
        validate: {
          payload: validationSchemas.payloadUsersPost
        }
      },
      handler: function(request, reply) {
        return methodsUsers().create(options.accountId, request.payload, {}, function(err, user) {
          if (err) {
            return reply(err);
          }
          return helperAddTokenToUser(methodsOauthAuth(), options.baseUrl, options.accountId, user._id, options.clientId, options.realm, options.scope, user, function(err, userWithToken) {
            if (err) {
              return reply(err);
            }
            return reply(userWithToken).code(201);
          });
        });
      }
    });

    /*
      @app.post '/users', userInScope("server-access"), routeValidator(schemaCreateUser), @post
      @app.get '/users', userInScope("server-access"), paginatorMiddleware(), @all
      @app.get '/users/:id', userInScope("server-access"), @get
    
      @app.patch '/users/:usernameOrId', userInScope("server-access"), @patch
      @app.delete '/users/:usernameOrId', userInScope("server-access"), @delete
    
      @app.put '/users/:usernameOrId/password', userInScope("server-access"), routeValidator(schemaPutPassword), @putPassword
      @app.post '/users/:usernameOrId/password-reset-tokens', userInScope("server-access"), @postPasswordResetTokens
      @app.put '/users/:usernameOrId/password-reset-tokens/:token', userInScope("server-access"), @putPasswordResetTokens
     */
  };

}).call(this);

//# sourceMappingURL=routes.js.map
