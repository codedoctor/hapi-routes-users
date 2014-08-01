(function() {
  var Hoek, routes;

  routes = require('./routes');

  Hoek = require('hoek');


  /*
  options:
    clientId: 'some mongodb guid'
    accountId: 'some mongodb guid'
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
    if (process.env.NODE_ENV === 'test') {
      plugin.expose('dummy', {});
    }
    return cb();
  };

  module.exports.register.attributes = {
    pkg: require('../package.json')
  };

}).call(this);

//# sourceMappingURL=index.js.map
