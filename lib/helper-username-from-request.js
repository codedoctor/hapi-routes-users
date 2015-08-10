(function() {
  module.exports = function(request) {
    var ref, ref1, usernameOrIdOrMe;
    usernameOrIdOrMe = request.params.usernameOrIdOrMe;
    if (usernameOrIdOrMe.toLowerCase() === 'me') {
      if (!((ref = request.auth) != null ? (ref1 = ref.credentials) != null ? ref1.id : void 0 : void 0)) {
        return null;
      }
      usernameOrIdOrMe = request.auth.credentials.id;
    }
    return usernameOrIdOrMe;
  };

}).call(this);

//# sourceMappingURL=helper-username-from-request.js.map
