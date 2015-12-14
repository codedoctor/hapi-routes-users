(function() {
  var Boom, Hoek, _, helperUserIdFromRequest;

  _ = require('underscore');

  Boom = require('boom');

  Hoek = require('hoek');

  helperUserIdFromRequest = require('./helper-user-id-from-request');


  /*
  Checks if the request is authenticated and has a user. The callback returns the userId.
  You must "reply" any errors passed in the callback.
   */

  module.exports = function(request, cb) {
    var userId;
    Hoek.assert(_.isObject(request), "The required parameter 'request' is missing or not an object.");
    Hoek.assert(_.isFunction(cb), "The required parameter 'cb' is missing or not an object.");
    userId = helperUserIdFromRequest(request);
    if (!userId) {
      return cb(Boom.unauthorized("You must be authenticated to access this endpoint."));
    }
    return process.nextTick(function() {
      return cb(null, userId);
    });
  };

}).call(this);

//# sourceMappingURL=helper-check-is-any-user.js.map
