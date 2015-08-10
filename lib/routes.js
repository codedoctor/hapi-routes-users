(function() {
  var Boom, Hoek, Joi, _, apiPagination, helperAddTokenToUser, helperObjToRestUser, helperParseMyInt, i18n, url, validationSchemas;

  _ = require('underscore');

  Boom = require('boom');

  Hoek = require("hoek");

  Joi = require("joi");

  url = require('url');

  helperAddTokenToUser = require('./helper-add-token-to-user');

  helperObjToRestUser = require('./helper-obj-to-rest-user');

  i18n = require('./i18n');

  validationSchemas = require('./validation-schemas');

  helperParseMyInt = require('./helper-parse-my-int');

  apiPagination = require('api-pagination');

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
      var ref, ref1, usernameOrIdOrMe;
      usernameOrIdOrMe = request.params.usernameOrIdOrMe;
      if (usernameOrIdOrMe.toLowerCase() === 'me') {
        if (!((ref = request.auth) != null ? (ref1 = ref.credentials) != null ? ref1.id : void 0 : void 0)) {
          return null;
        }
        usernameOrIdOrMe = request.auth.credentials.id;
      }
      return usernameOrIdOrMe;
    };

    /*
    Creates a new user and returns it and the new session.
     */
    plugin.route({
      path: "/users",
      method: "GET",
      config: {},
      handler: function(request, reply) {
        var queryOptions;
        queryOptions = {};
        queryOptions.offset = helperParseMyInt(request.query.offset, 0);
        queryOptions.count = helperParseMyInt(request.query.count, 20);
        return methodsUsers().all(options._tenantId, queryOptions, function(err, resultData) {
          if (err) {
            return reply(err);
          }
          if (resultData.toObject) {
            resultData = resultData.toObject();
          }
          return reply(apiPagination.toRest(resultData, options.baseUrl));
        });
      }
    });

    /*
    Creates a new user and returns it and the new session.
     */
    plugin.route({
      path: "/users",
      method: "POST",
      config: {
        auth: false,
        validate: {
          payload: Joi.object().keys({
            username: validationSchemas.username.required().description('The username of the new user. Must be unique within the system.'),
            name: validationSchemas.name.required().description("The real name of the new user."),
            password: validationSchemas.password.required().description("The password of the new user."),
            email: validationSchemas.email.required().description('The email of the new user. Must be unique within the system.')
          })["with"]('username', 'password', 'email', 'name').options({
            allowUnknown: true,
            stripUnknown: true
          })
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
          primaryEmail = user.primaryEmail;
          sendAttempt = !!primaryEmail && user.primaryEmail.length > 5;
          if (sendAttempt) {
            payload = {
              displayName: user.displayName || user.username,
              username: user.username,
              email: user.primaryEmail,
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
          payload: Joi.object().keys({
            login: validationSchemas.login.required().description('The login field can either be an email address or a username.')
          }).options({
            allowUnknown: true,
            stripUnknown: true
          })
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
          primaryEmail = user.primaryEmail;
          sendAttempt = !!primaryEmail && user.primaryEmail.length > 5;
          if (sendAttempt) {
            payload = {
              displayName: user.displayName || user.username,
              username: user.username,
              email: user.primaryEmail,
              user: user,
              trackingId: user._id,
              trackingClass: 'User',
              token: token,
              resetUrl: options.resetPasswordClientBaseUrl + "?token=" + token
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
          payload: Joi.object().keys({
            password: validationSchemas.password.required().description('The new password for the user referenced by the token.'),
            token: validationSchemas.token.required().description('The token obtained through a POST request at /users/reset-password.')
          }).options({
            allowUnknown: true,
            stripUnknown: true
          })
        }
      },
      handler: function(request, reply) {
        var password, token;
        token = request.payload.token;
        password = request.payload.password;
        return methodsUsers().resetPasswordToken(options._tenantId, token, password, {}, function(err, user) {
          var payload, primaryEmail, sendAttempt;
          if (err) {
            return reply(err);
          }
          primaryEmail = user.primaryEmail;
          sendAttempt = !!primaryEmail && user.primaryEmail.length > 5;
          if (sendAttempt) {
            payload = {
              displayName: user.displayName || user.username,
              user: user,
              username: user.username,
              email: user.primaryEmail,
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
          params: Joi.object().keys({
            usernameOrIdOrMe: validationSchemas.usernameOrIdOrMe.required().description("The quantifier for the user to return. Can be a username, id or 'me'.")
          }),
          payload: Joi.object().keys({
            password: validationSchemas.password.required().description('The new password for the user.')
          }).options({
            allowUnknown: true,
            stripUnknown: true
          })
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
          primaryEmail = user.primaryEmail;
          sendAttempt = !!primaryEmail && user.primaryEmail.length > 5;
          if (sendAttempt) {
            payload = {
              displayName: user.displayName || user.username,
              user: user,
              username: user.username,
              email: user.primaryEmail,
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
          params: Joi.object().keys({
            usernameOrIdOrMe: validationSchemas.usernameOrIdOrMe.required().description("The quantifier for the user to return. Can be a username, id or 'me'.")
          })
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
    return plugin.route({
      path: "/users/{usernameOrIdOrMe}",
      method: "GET",
      config: {
        validate: {
          params: Joi.object().keys({
            usernameOrIdOrMe: validationSchemas.usernameOrIdOrMe.required().description("The quantifier for the user to return. Can be a username, id or 'me'.")
          })
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
          return reply(helperObjToRestUser(user, options.baseUrl + "/users"));
        });
      }
    });
  };

}).call(this);

//# sourceMappingURL=routes.js.map
