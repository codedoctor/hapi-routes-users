(function() {
  var Boom, Hoek, helperObjToRest, i18n, _;

  _ = require('underscore');

  Boom = require('boom');

  Hoek = require('hoek');

  i18n = require('./i18n');

  helperObjToRest = require('./helper-obj-to-rest');

  module.exports = function(oauthAuthMethods, baseUrl, _tenantId, userId, clientId, realm, scope, user, cb) {
    if (clientId) {

      /*
      @TODO: Check input values here
       */
      return oauthAuthMethods.createOrReuseTokenForUserId(_tenantId, userId, clientId, realm, scope, null, (function(_this) {
        return function(err, token) {
          if (err) {
            return cb(err);
          }
          if (!token) {
            return cb(new Boom.badRequest(i18n.errorTokenRequired));
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
