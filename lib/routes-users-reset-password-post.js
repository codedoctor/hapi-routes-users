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
    Posts a request for a password reset token.
    requires a login as input parameter, which can be username or password
     */
    return plugin.route({
      path: "/users/reset-password",
      method: "POST",
      config: {
        description: "Initiates the password reset sequence for a user. The user must have an email on file.",
        tags: options.routeTagsPublic,
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
  };

}).call(this);

//# sourceMappingURL=routes-users-reset-password-post.js.map
