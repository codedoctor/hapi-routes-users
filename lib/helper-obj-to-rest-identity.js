(function() {
  var Hoek, _, i18n;

  _ = require('underscore');

  Hoek = require('hoek');

  i18n = require('./i18n');

  module.exports = function(identity, baseUrl) {
    var res;
    Hoek.assert(baseUrl, i18n.assertBaseUrlRequired);
    if (!identity) {
      return null;
    }
    res = {
      _url: baseUrl + "/" + identity._id,
      id: identity._id,
      provider: identity.provider,
      key: identity.key,
      v1: identity.v1,
      v2: identity.v2,
      providerType: identity.providerType,
      username: identity.username,
      displayName: identity.displayName,
      profileImage: identity.profileImage
    };
    return res;
  };

}).call(this);

//# sourceMappingURL=helper-obj-to-rest-identity.js.map
