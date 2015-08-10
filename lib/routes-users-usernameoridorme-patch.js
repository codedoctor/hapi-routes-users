(function() {
  var Boom, Hoek, Joi, _, helperAddTokenToUser, helperObjToRestUser, helperUsernameFromRequest, i18n, url, validationSchemas;

  _ = require('underscore');

  Boom = require('boom');

  Hoek = require("hoek");

  Joi = require("joi");

  url = require('url');

  helperAddTokenToUser = require('./helper-add-token-to-user');

  helperObjToRestUser = require('./helper-obj-to-rest-user');

  i18n = require('./i18n');

  validationSchemas = require('./validation-schemas');

  helperUsernameFromRequest = require('./helper-username-from-request');

  module.exports = function(plugin, options) {
    var fnSendEmail, hapiOauthStoreMultiTenant, hapiUserStoreMultiTenant, methodsOauthAuth, methodsUsers;
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
    return plugin.route({
      path: "/users/{usernameOrIdOrMe}",
      method: "PATCH",
      config: {
        validate: {
          params: Joi.object().keys({
            usernameOrIdOrMe: validationSchemas.validateUsernameOrIdOrMe.required()
          }),
          payload: Joi.object().keys({
            username: Joi.string(),
            displayName: Joi.string(),
            roles: [Joi.string(), Joi.array().items(Joi.string())],
            password: validationSchemas.validatePassword.description('The new password for the user.')
          }).options({
            allowUnknown: true,
            stripUnknown: true
          })
        }
      },
      handler: function(request, reply) {
        var usernameOrIdOrMe;
        usernameOrIdOrMe = helperUsernameFromRequest(request);
        if (!usernameOrIdOrMe) {
          return reply(Boom.unauthorized(i18n.errorUnauthorized));
        }
        if (_.isString(request.payload.roles)) {
          request.payload.roles = (request.payload.roles || "").split(',');
          request.payload.roles = _.map(request.payload.roles, function(x) {
            return x.trim();
          });
        }
        return methodsUsers().patch(options._tenantId, usernameOrIdOrMe, request.payload, null, function(err, user) {
          var payload, primaryEmail, sendAttempt;
          if (err) {
            return reply(err);
          }
          primaryEmail = user.primaryEmail;
          sendAttempt = !!primaryEmail && request.payload.password && user.primaryEmail.length > 5;
          if (sendAttempt) {
            payload = {
              dislayName: user.displayName || user.username,
              user: user,
              trackingId: user._id,
              trackingClass: 'User'
            };
            fnSendEmail(i18n.emailKindPasswordChanged, primaryEmail, payload);
          }
          return reply(helperObjToRestUser(user, options.baseUrl + "/users")).code(204);
        });
      }
    });
  };

}).call(this);

//# sourceMappingURL=routes-users-usernameoridorme-patch.js.map
