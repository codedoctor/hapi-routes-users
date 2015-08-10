(function() {
  var Hoek, _, apiPagination, helperParseMyInt, i18n, mongoose, protoGetAll;

  _ = require('underscore');

  Hoek = require("hoek");

  mongoose = require("mongoose");

  apiPagination = require('api-pagination');

  i18n = require('./i18n');

  helperParseMyInt = require('./helper-parse-my-int');

  module.exports = protoGetAll = function(plugin, endpoint, dbMethods, _tenantId, baseUrl, requestHelper, routeInfo) {
    if (routeInfo == null) {
      routeInfo = {};
    }
    Hoek.assert(plugin, i18n.assertPluginRequired);
    Hoek.assert(endpoint, i18n.assertEndpointRequired);
    Hoek.assert(dbMethods, i18n.assertDbMethodsRequired);
    Hoek.assert(dbMethods.all, i18n.assertDbMethodsAllRequired);
    Hoek.assert(_tenantId, i18n.assertTenantIdRequired);
    routeInfo.path = "/" + endpoint;
    routeInfo.method = "GET";
    routeInfo.handler = function(request, reply) {
      var queryOptions;
      queryOptions = {};
      queryOptions.offset = helperParseMyInt(request.query.offset, 0);
      queryOptions.count = helperParseMyInt(request.query.count, 20);
      if (requestHelper && _.isFunction(requestHelper)) {
        requestHelper(queryOptions, request);
      }
      return dbMethods.all(_tenantId, queryOptions, function(err, resultData) {
        if (err) {
          return reply(err);
        }
        if (resultData.toObject) {
          resultData = resultData.toObject();
        }
        return reply(apiPagination.toRest(resultData, baseUrl));
      });
    };
    return plugin.route(routeInfo);
  };

}).call(this);

//# sourceMappingURL=proto-get-all.js.map
