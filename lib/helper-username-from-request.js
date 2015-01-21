(function() {
  module.exports = function(request) {
    var usernameOrIdOrMe, _ref, _ref1;
    usernameOrIdOrMe = request.params.usernameOrIdOrMe;
    if (usernameOrIdOrMe.toLowerCase() === 'me') {
      if (!((_ref = request.auth) != null ? (_ref1 = _ref.credentials) != null ? _ref1.id : void 0 : void 0)) {
        return null;
      }
      usernameOrIdOrMe = request.auth.credentials.id;
    }
    return usernameOrIdOrMe;
  };

}).call(this);

//# sourceMappingURL=helper-username-from-request.js.map
