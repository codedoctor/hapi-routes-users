(function() {
  var Hoek, i18n, routesToExport;

  Hoek = require('hoek');

  i18n = require('./i18n');

  routesToExport = [require('./routes'), require('./routes-users-usernameoridorme-patch')];


  /*
  options:
    clientId: 'some mongodb guid'
    _tenantId: 'some mongodb guid'
    baseUrl: This is the url to your api. For example https://api.mystuff.com
  ``realm: ignore for now
    scope: leave to null
    resetPasswordClientBaseUrl: MUST BE SET, something like http://fanignite.com/users/reset-password/reset
   */

  module.exports.register = function(server, options, cb) {
    var defaults, i, len, r;
    if (options == null) {
      options = {};
    }
    defaults = {
      realm: "default",
      routeTagsPublic: ['api', 'api-public', 'users'],
      routeTagsAdmin: ['api', 'api-admin', 'users']
    };
    options = Hoek.applyToDefaults(defaults, options);
    for (i = 0, len = routesToExport.length; i < len; i++) {
      r = routesToExport[i];
      r(server, options);
    }
    server.expose('i18n', i18n);
    return cb();
  };

  module.exports.register.attributes = {
    pkg: require('../package.json')
  };

}).call(this);

//# sourceMappingURL=index.js.map
