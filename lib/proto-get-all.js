(function() {
  var Hoek, PagingUrlHelper, mongoose, parseMyInt, protoGetAll, _;

  _ = require('underscore');

  Hoek = require("hoek");

  mongoose = require("mongoose");

  PagingUrlHelper = require('./paging-url-helper');

  parseMyInt = function(someValue, def) {
    var e, x;
    if (def == null) {
      def = 0;
    }
    try {
      x = parseInt((someValue || def).toString(), 10);
      if (x < 0) {
        x = 0;
      }
      return x;
    } catch (_error) {
      e = _error;
      return def;
    }
  };

  module.exports = protoGetAll = function(plugin, endpoint, dbMethods, accountId, requestHelper, routeInfo) {
    if (routeInfo == null) {
      routeInfo = {};
    }
    Hoek.assert(plugin, "Plugin required");
    Hoek.assert(dbMethods.all, "all method required in dbStore methods");
    routeInfo.path = "/" + endpoint;
    routeInfo.method = "GET";
    routeInfo.handler = function(request, reply) {
      var queryOptions;
      queryOptions = {};
      queryOptions.offset = parseMyInt(request.query.offset, 0);
      queryOptions.count = parseMyInt(request.query.count, 20);
      if (requestHelper && _.isFunction(requestHelper)) {
        requestHelper(queryOptions, request);
      }
      return dbMethods.all(accountId, queryOptions, function(err, resultData) {
        var pp, url;
        if (err) {
          return reply(err);
        }
        if (resultData.toObject) {
          resultData = resultData.toObject();
        }

        /*
        @TODO Clean up this hack
         */
        url = request.url;
        if (process.env.NODE_ENV === 'production') {
          url.protocol = "https:";
          url.host = "api.fanignite.com";
        } else {
          url.protocol = "http:";
          url.host = "localhost:7011";
        }
        pp = new PagingUrlHelper(queryOptions.offset, queryOptions.count, resultData.totalCount, request.url);
        resultData._pagination = {
          totalCount: resultData.totalCount,
          requestCount: resultData.requestCount,
          requestOffset: resultData.requestOffset,
          requestPageNumber: pp._currentPage(),
          requestPageNumberDisplay: (pp._currentPage() + 1).toString(),
          totalPageCount: pp._numberOfPages(),
          pagingKind: "paged",
          previousUrl: pp.previous(),
          nextUrl: pp.next(),
          firstUrl: pp.first(),
          lastUrl: pp.last(),
          pages: pp.pages()
        };
        delete resultData.base;
        return reply(resultData);
      });
    };
    return plugin.route(routeInfo);
  };

}).call(this);

//# sourceMappingURL=proto-get-all.js.map
