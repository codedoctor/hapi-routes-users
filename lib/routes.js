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
    Hoek.assert(options.sendEmailPasswordReset, "options parameter requires a sendEmailPasswordReset function");
    Hoek.assert(_.isFunction(options.sendEmailPasswordReset), "options parameter requires sendEmailPasswordReset to be a function");
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
    plugin.route({
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
    Posts a request for a password reset token.
    requires a login as input parameter, which can be username or password
     */
    return plugin.route({
      path: "/users/reset-password",
      method: "POST",
      config: {
        auth: false,
        validate: {
          payload: validationSchemas.payloadUsersPasswordResetTokensPost
        }
      },
      handler: function(request, reply) {
        return methodsUsers().resetPassword(options.accountId, request.payload.login, null, (function(_this) {
          return function(err, user, token) {
            var payload, primaryEmail;
            if (err) {
              return reply(err);
            }
            if (!(user && token)) {
              return reply(Boom.create(400, "Unable to retrieve password."));
            }
            primaryEmail = user.primaryEmail && user.primaryEmail.length > 5;
            if (primaryEmail) {
              payload = {
                dislayName: user.displayName || user.username,
                user: user,
                trackingId: user._id,
                trackingClass: 'User',
                token: token,
                resetUrl: "http://fanignite.com/users/reset-password/reset?token=" + token
              };
              options.sendEmailPasswordReset(primaryEmail, payload, function(err) {
                var data;
                if (err) {
                  data = {
                    login: login,
                    msg: "Failed to send email."
                  };
                  return plugin.log(['error', 'customer-support-likely', data]);
                }
              });
              return reply({
                token: token,
                emailSentAttempted: true
              }).code(201);
            } else {
              return reply({
                token: token,
                emailSentAttempted: false
              }).code(201);
            }
          };
        })(this));

        /*
        
         *methodsUsers().create options.accountId,request.payload, {}, (err,user) ->
         *  return reply err if err
        
         *    helperAddTokenToUser methodsOauthAuth(), options.baseUrl,options.accountId,user._id,options.clientId,options.realm,options.scope,user, (err, userWithToken) ->
         *    return reply err if err
         *    reply(userWithToken).code(201)
        
        email = req.body.email
        @identityStore.users.resetPassword req.accountId, email, {},(err,user,token) =>
          return cb err if err
          res.json 200, {}
        
          url = "http://localhost:5500/users/me/reset-password/#{token}"
        
           * Note: Someone must take this from the queue and send the code to the user.
          if user.primaryEmail && user.primaryEmail.length > 5
            payload =
              user: user
              token : token
              trackingId: user._id
              url : url
              trackingClass: 'User'
        
            @emailEngine.sendOne user.displayName || user.username,user.primaryEmail,payload,2556, null
         */
      }
    });

    /*
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
