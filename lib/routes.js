(function() {
  var Boom, Hoek, Joi, helperAddTokenToUser, i18n, url, validationSchemas, _;

  _ = require('underscore');

  Boom = require('boom');

  Hoek = require("hoek");

  Joi = require("joi");

  url = require('url');

  helperAddTokenToUser = require('./helper-add-token-to-user');

  validationSchemas = require('./validation-schemas');

  i18n = require('./i18n');

  module.exports = function(plugin, options) {
    var fnSendEmail, hapiIdentityStore, methodsOauthAuth, methodsUsers;
    if (options == null) {
      options = {};
    }
    Hoek.assert(options.clientId, "options parameter requires a clientId");
    Hoek.assert(options.accountId, "options parameter requires an accountId");
    Hoek.assert(options.baseUrl, "options parameter requires an baseUrl");
    Hoek.assert(options.realm, "options parameter requires a realm");
    Hoek.assert(options.sendEmail, "options parameter requires a sendEmail (kind,email,payload,cb) -> function");
    Hoek.assert(_.isFunction(options.sendEmail), "options parameter requires sendEmail to be a function");
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
    fnSendEmail = function(kind, email, payload) {
      return options.sendEmail(kind, email, payload, function(err) {
        var data;
        if (err) {
          data = {
            payload: payload,
            msg: "Failed to send email."
          };
          return plugin.log(['error', 'customer-support-likely'], data);
        }
      });
    };

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
    plugin.route({
      path: "/users/reset-password",
      method: "POST",
      config: {
        auth: false,
        validate: {
          payload: validationSchemas.payloadUsersResetPasswordPost
        }
      },
      handler: function(request, reply) {
        return methodsUsers().resetPassword(options.accountId, request.payload.login, null, function(err, user, token) {
          var payload, primaryEmail, sendAttempt;
          if (err) {
            return reply(err);
          }
          if (!(user && token)) {
            return reply(Boom.create(400, "Unable to retrieve password."));
          }
          primaryEmail = user.primaryEmail && user.primaryEmail.length > 5;
          sendAttempt = !!primaryEmail;
          if (sendAttempt) {
            payload = {
              dislayName: user.displayName || user.username,
              user: user,
              trackingId: user._id,
              trackingClass: 'User',
              token: token,
              resetUrl: "http://fanignite.com/users/reset-password/reset?token=" + token
            };
            fnSendEmail(i18n.emailKindPasswordReset, primaryEmail, payload);
          }
          return reply({
            token: token,
            emailSentAttempted: sendAttempt
          }).code(201);
        });
      }
    });

    /*
    Validates a request for a password reset. Expects a payload token
     */
    plugin.route({
      path: "/users/reset-password/tokens",
      method: "POST",
      config: {
        auth: false,
        validate: {
          payload: validationSchemas.payloadUsersResetPasswordTokensPost
        }
      },
      handler: function(request, reply) {
        var password, token;
        token = request.payload.token;
        password = request.payload.password;
        return methodsUsers().resetPasswordToken(options.accountId, token, password, function(err, user) {
          var payload, primaryEmail, sendAttempt;
          if (err) {
            return reply(err);
          }
          primaryEmail = user.primaryEmail && user.primaryEmail.length > 5;
          sendAttempt = !!primaryEmail;
          if (sendAttempt) {
            payload = {
              dislayName: user.displayName || user.username,
              user: user,
              trackingId: user._id,
              trackingClass: 'User'
            };
            fnSendEmail(i18n.emailKindPasswordResetSuccess, primaryEmail, payload);
          }
          return reply({
            emailSentAttempted: sendAttempt
          }).code(200);
        });
      }
    });
    return plugin.route({
      path: "/users/{usernameOrIdOrMe}/password",
      method: "PUT",
      config: {
        auth: false,
        validate: {
          params: validationSchemas.paramsUsersPasswordPut,
          payload: validationSchemas.payloadUsersPasswordPut
        }
      },
      handler: function(request, reply) {
        var usernameOrIdOrMe, _ref, _ref1;
        usernameOrIdOrMe = request.params.usernameOrIdOrMe;
        if (usernameOrIdOrMe.toLowerCase() === 'me') {
          if (!((_ref = request.auth) != null ? (_ref1 = _ref.credentials) != null ? _ref1.id : void 0 : void 0)) {
            return reply(Boom.unauthorized("Authentication required for this endpoint."));
          }
          usernameOrIdOrMe = request.auth.credentials.id;
        }
        return methodsUsers().patch(options.accountId, usernameOrIdOrMe, {
          password: request.payload.password
        }, null, function(err, user) {
          var payload, primaryEmail, sendAttempt;
          if (err) {
            return reply(err);
          }
          primaryEmail = user.primaryEmail && user.primaryEmail.length > 5;
          sendAttempt = !!primaryEmail;
          if (sendAttempt) {
            payload = {
              dislayName: user.displayName || user.username,
              user: user,
              trackingId: user._id,
              trackingClass: 'User'
            };
            fnSendEmail(i18n.emailKindPasswordChanged, primaryEmail, payload);
          }
          return reply().code(204);
        });
      }
    });

    /*
    
      @app.get '/users', userInScope("server-access"), paginatorMiddleware(), @all
      @app.get '/users/:id', userInScope("server-access"), @get
      @app.patch '/users/:usernameOrId', userInScope("server-access"), @patch
      @app.delete '/users/:usernameOrId', userInScope("server-access"), @delete
     */
  };

}).call(this);

//# sourceMappingURL=routes.js.map
