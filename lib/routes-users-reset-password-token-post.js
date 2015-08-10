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
    Hoek.assert(options.routeTagsPublic && _.isArray(options.routeTagsPublic), i18n.optionsRouteTagsPublicRequiredAndArray);
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
    Validates a request for a password reset. Expects a payload token
     */
    return plugin.route({
      path: "/users/reset-password/tokens",
      method: "POST",
      config: {
        description: "Completes the password reset sequence by providing token and password.",
        tags: options.routeTagsPublic,
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
  };

}).call(this);

//# sourceMappingURL=routes-users-reset-password-token-post.js.map
