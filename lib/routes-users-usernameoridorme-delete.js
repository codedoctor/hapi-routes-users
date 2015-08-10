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
    return plugin.route({
      path: "/users/{usernameOrIdOrMe}",
      method: "DELETE",
      config: {
        description: "Deletes a user.",
        tags: options.routeTagsPublic,
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
  };

}).call(this);

//# sourceMappingURL=routes-users-usernameoridorme-delete.js.map
