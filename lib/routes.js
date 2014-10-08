(function() {
  var Boom, Hoek, Joi, helperAddTokenToUser, helperObjToRest, i18n, protoGetAll, url, validationSchemas, _;

  _ = require('underscore');

  Boom = require('boom');

  Hoek = require("hoek");

  Joi = require("joi");

  url = require('url');

  helperAddTokenToUser = require('./helper-add-token-to-user');

  helperObjToRest = require('./helper-obj-to-rest');

  i18n = require('./i18n');

  protoGetAll = require('./proto-get-all');

  validationSchemas = require('./validation-schemas');

  module.exports = function(plugin, options) {
    var fbUsernameFromRequest, fnSendEmail, hapiOauthStoreMultiTenant, hapiUserStoreMultiTenant, methodsOauthAuth, methodsUsers;
    if (options == null) {
      options = {};
    }
    Hoek.assert(options.clientId, i18n.assertClientIdInOptionsRequired);
    Hoek.assert(options._tenantId, i18n.assertTenantIdInOptionsRequired);
    Hoek.assert(options.baseUrl, i18n.assertBaseUrlInOptionsRequired);
    Hoek.assert(options.realm, i18n.assertRealmInOptionsRequired);
    Hoek.assert(options.sendEmail, i18n.assertSendEmailInOptionsRequired);
    Hoek.assert(_.isFunction(options.sendEmail), i18n.assertSendEmailInOptionsIsFunction);
    options.scope || (options.scope = null);
    hapiOauthStoreMultiTenant = function() {
      return plugin.plugins['hapi-oauth-store-multi-tenant'];
    };
    hapiUserStoreMultiTenant = function() {
      return plugin.plugins['hapi-user-store-multi-tenant'];
    };
    Hoek.assert(hapiOauthStoreMultiTenant(), "Could not find 'hapi-oauth-store-multi-tenant' plugin.");
    Hoek.assert(hapiUserStoreMultiTenant(), "Could not find 'hapi-user-store-multi-tenant' plugin.");
    methodsUsers = function() {
      return hapiUserStoreMultiTenant().methods.users;
    };
    methodsOauthAuth = function() {
      return hapiOauthStoreMultiTenant().methods.oauthAuth;
    };
    Hoek.assert(methodsUsers(), i18n.assertMethodsUsersNotFound);
    Hoek.assert(methodsOauthAuth(), i18n.assertMethodsOauthAuthNotFound);
    fnSendEmail = function(kind, email, payload) {
      return options.sendEmail(kind, email, payload, function(err) {
        var data;
        if (err) {
          data = {
            payload: payload,
            msg: i18n.errorFailedToSendEmail
          };
          return plugin.log(['error', 'customer-support-likely'], data);
        }
      });
    };
    fbUsernameFromRequest = function(request) {
      var usernameOrIdOrMe, _ref, _ref1;
      usernameOrIdOrMe = request.params.usernameOrIdOrMe;
      if (usernameOrIdOrMe.toLowerCase() === 'me') {
        if (!((_ref = request.auth) != null ? (_ref1 = _ref.credentials) != null ? _ref1.id : void 0 : void 0)) {
          return null;
        }
        usernameOrIdOrMe = request.auth.credentials.id;
      }
      return usernameOrIdOrMe;
    };
    protoGetAll(plugin, "users", methodsUsers(), options._tenantId, options.baseUrl, null, null);

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
        return methodsUsers().create(options._tenantId, request.payload, {}, function(err, user) {
          var payload, primaryEmail, sendAttempt;
          if (err) {
            return reply(err);
          }
          helperAddTokenToUser(methodsOauthAuth(), options.baseUrl, options._tenantId, user._id, options.clientId, options.realm, options.scope, user, function(err, userWithToken) {
            if (err) {
              return reply(err);
            }
            return reply(userWithToken).code(201);
          });

          /*
          Secondary Flow
           */
          primaryEmail = user.primaryEmail && user.primaryEmail.length > 5;
          sendAttempt = !!primaryEmail;
          if (sendAttempt) {
            payload = {
              dislayName: user.displayName || user.username,
              user: user,
              trackingId: user._id,
              trackingClass: 'User'
            };
            return fnSendEmail(i18n.emailKindNewUser, primaryEmail, payload);
          }
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
        return methodsUsers().resetPassword(options._tenantId, request.payload.login, null, function(err, user, token) {
          var payload, primaryEmail, sendAttempt;
          if (err) {
            return reply(err);
          }
          if (!(user && token)) {
            return reply(Boom.badRequest(errorUnableToRetrievePassword));
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
        return methodsUsers().resetPasswordToken(options._tenantId, token, password, function(err, user) {
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
    plugin.route({
      path: "/users/{usernameOrIdOrMe}/password",
      method: "PUT",
      config: {
        validate: {
          params: validationSchemas.paramsUsersPasswordPut,
          payload: validationSchemas.payloadUsersPasswordPut
        }
      },
      handler: function(request, reply) {
        var usernameOrIdOrMe;
        usernameOrIdOrMe = fbUsernameFromRequest(request);
        if (!usernameOrIdOrMe) {
          return reply(Boom.unauthorized(i18n.errorUnauthorized));
        }
        return methodsUsers().patch(options._tenantId, usernameOrIdOrMe, {
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
    plugin.route({
      path: "/users/{usernameOrIdOrMe}",
      method: "DELETE",
      config: {
        validate: {
          params: validationSchemas.paramsUsersDelete
        }
      },
      handler: function(request, reply) {
        var usernameOrIdOrMe;
        usernameOrIdOrMe = fbUsernameFromRequest(request);
        if (!usernameOrIdOrMe) {
          return reply(Boom.unauthorized(i18n.errorUnauthorized));
        }
        return methodsUsers()["delete"](options._tenantId, usernameOrIdOrMe, null, function(err, user) {

          /*
          @TODO Warning: we should eat not found error here.
           */
          if (err) {
            return reply(err);
          }
          return reply().code(204);
        });
      }
    });
    plugin.route({
      path: "/users/{usernameOrIdOrMe}",
      method: "PATCH",
      config: {
        validate: {
          params: validationSchemas.paramsUsersPatch,
          payload: validationSchemas.payloadUsersPatch
        }
      },
      handler: function(request, reply) {
        var usernameOrIdOrMe;
        usernameOrIdOrMe = fbUsernameFromRequest(request);
        if (!usernameOrIdOrMe) {
          return reply(Boom.unauthorized(i18n.errorUnauthorized));
        }
        return methodsUsers().patch(options._tenantId, usernameOrIdOrMe, request.payload, null, function(err, user) {
          var payload, primaryEmail, sendAttempt;
          if (err) {
            return reply(err);
          }
          primaryEmail = user.primaryEmail && user.primaryEmail.length > 5;
          sendAttempt = !!primaryEmail && request.payload.password;
          if (sendAttempt) {
            payload = {
              dislayName: user.displayName || user.username,
              user: user,
              trackingId: user._id,
              trackingClass: 'User'
            };
            fnSendEmail(i18n.emailKindPasswordChanged, primaryEmail, payload);
          }
          return reply(helperObjToRest.user(user, "" + options.baseUrl + "/users")).code(204);
        });
      }
    });
    return plugin.route({
      path: "/users/{usernameOrIdOrMe}",
      method: "GET",
      config: {
        validate: {
          params: validationSchemas.paramsUsersGet
        }
      },
      handler: function(request, reply) {
        var usernameOrIdOrMe;
        usernameOrIdOrMe = fbUsernameFromRequest(request);
        if (!usernameOrIdOrMe) {
          return reply(Boom.unauthorized(i18n.errorUnauthorized));
        }
        return methodsUsers().getByNameOrId(options._tenantId, usernameOrIdOrMe, null, function(err, user) {
          if (err) {
            return reply(err);
          }
          return reply(helperObjToRest.user(user, "" + options.baseUrl + "/users"));
        });
      }
    });
  };

}).call(this);

//# sourceMappingURL=routes.js.map
