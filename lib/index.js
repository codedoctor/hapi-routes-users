(function() {
  var Hoek, i18n, routes;

  Hoek = require('hoek');

  i18n = require('./i18n');

  routes = require('./routes');


  /*
  options:
    clientId: 'some mongodb guid'
    _tenantId: 'some mongodb guid'
    baseUrl: This is the url to your api. For example https://api.mystuff.com
  ``realm: ignore for now
    scope: leave to null
   */

  module.exports.register = function(plugin, options, cb) {
    var defaults;
    if (options == null) {
      options = {};
    }
    defaults = {
      realm: "default"
    };
    options = Hoek.applyToDefaults(defaults, options);
    routes(plugin, options);
    plugin.expose('i18n', i18n);
    return cb();
  };

  module.exports.register.attributes = {
    pkg: require('../package.json')
  };

}).call(this);

//# sourceMappingURL=index.js.map
