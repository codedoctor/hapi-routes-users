(function() {
  var Hoek, _;

  _ = require('underscore');

  Hoek = require('hoek');


  /*
  Returns the user id from a request
   */

  module.exports = function(request) {
    var ref, ref1, ref2;
    Hoek.assert(_.isObject(request), "The required parameter request is missing or not an object.");
    return (ref = request.auth) != null ? (ref1 = ref.credentials) != null ? (ref2 = ref1.id) != null ? ref2.toString() : void 0 : void 0 : void 0;
  };

}).call(this);

//# sourceMappingURL=helper-user-id-from-request.js.map
