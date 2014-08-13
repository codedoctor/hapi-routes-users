(function() {
  var Boom, helperObjToRest, _;

  _ = require('underscore');

  Boom = require('boom');

  helperObjToRest = require('./helper-obj-to-rest');

  module.exports = function(oauthAuth, baseUrl, _tenantId, userId, clientId, realm, scope, user, cb) {
    if (clientId) {
      return oauthAuth.createOrReuseTokenForUserId(_tenantId, userId, clientId, realm, scope, null, (function(_this) {
        return function(err, token) {
          if (err) {
            return cb(err);
          }
          if (!token) {
            return cb(new Boom.badRequest("" + baseUrl + "/users"));
          }
          user = helperObjToRest.user(user, "" + baseUrl + "/users");
          _.extend(user, {
            token: {
              accessToken: token.accessToken,
              refreshToken: token.refreshToken
            }
          });
          return cb(null, user);
        };
      })(this));
    } else {
      return cb(null, helperObjToRest.user(user, "" + baseUrl + "/users"));
    }
  };

}).call(this);

//# sourceMappingURL=helper-add-token-to-user.js.map
