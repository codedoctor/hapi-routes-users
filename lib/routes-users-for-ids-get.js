(function() {
  var Boom, Hoek, Joi, _, apiPagination, helperCheckIsAnyUser, helperObjToRestUser, i18n, validationSchemas;

  _ = require('underscore');

  apiPagination = require('api-pagination');

  Boom = require('boom');

  Hoek = require("hoek");

  Joi = require('joi');

  i18n = require('./i18n');

  validationSchemas = require('./validation-schemas');

  helperCheckIsAnyUser = require('./helper-check-is-any-user');

  helperObjToRestUser = require('./helper-obj-to-rest-user');


  /*
  Retrieves all collections in the system. This requires both admin scope and admin role
   */

  module.exports = function(plugin, options) {
    var hapiUserStoreMultiTenant, storeUsers;
    if (options == null) {
      options = {};
    }
    Hoek.assert(options.baseUrl, i18n.optionsBaseUrlRequired);
    hapiUserStoreMultiTenant = function() {
      return plugin.plugins['hapi-user-store-multi-tenant'];
    };
    Hoek.assert(hapiUserStoreMultiTenant(), "Could not find 'hapi-user-store-multi-tenant' plugin.");
    storeUsers = function() {
      return hapiUserStoreMultiTenant().methods.users;
    };
    Hoek.assert(storeUsers(), i18n.assertMethodsUsersNotFound);
    return plugin.route({
      path: "/users/for-ids",
      method: "GET",
      config: {
        tags: ['api', 'data', 'access-authenticated'],
        description: "Retrieves a set of users as specified with the ids parameter.",
        validate: {
          params: Joi.object(),
          query: Joi.object().keys({
            ids: Joi.string().allow(null).trim().empty('')
          }).options({
            allowUnknown: true,
            stripUnknown: false
          })
        },
        response: {
          status: {
            400: validationSchemas.errorBadRequest(),
            401: validationSchemas.errorUnauthorized(),
            403: validationSchemas.errorForbidden(),
            404: validationSchemas.errorNotFound(),
            500: validationSchemas.errorInternalServerError()
          }
        }
      },
      handler: function(request, reply) {
        return helperCheckIsAnyUser(request, function(err, userId) {
          var userIds;
          if (err) {
            return reply(err);
          }
          userIds = (request.query.ids || "").split(',');
          userIds = _.reject(userIds, function(x) {
            return !x || x.length !== 24;
          });
          return storeUsers().getByIds(userIds, {}, function(err, result) {
            var i, len, ref, x;
            if (err) {
              return reply(err);
            }
            result = JSON.parse(JSON.stringify(result));
            ref = result.items;
            for (i = 0, len = ref.length; i < len; i++) {
              x = ref[i];
              x.items = _.map(x.items, function(x) {
                return helperObjToRestUser(x, options.baseUrl + "/users", request);
              });
            }
            return reply(apiPagination.toRest(result, options.baseUrl + "/users/for-ids"));
          });
        });
      }
    });
  };

}).call(this);

//# sourceMappingURL=routes-users-for-ids-get.js.map
