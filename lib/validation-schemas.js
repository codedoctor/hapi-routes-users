(function() {
  var Joi, maxLoginLength, maxPasswordLength, me, minLoginLength, minPasswordLength, objectId, username;

  Joi = require("joi");

  minLoginLength = 2;

  maxLoginLength = 100;

  minPasswordLength = 8;

  maxPasswordLength = 40;

  objectId = Joi.string().length(24);

  me = Joi.string().valid(['me']).example('me');

  username = Joi.string().min(2).max(100).example('johnsmith');

  module.exports = {
    objectId: objectId,
    me: me,
    username: username,
    password: Joi.string().min(minPasswordLength).max(maxPasswordLength).example('some password'),
    usernameOrIdOrMe: Joi.alternatives([objectId, me, username]),
    token: Joi.string().min(20).max(100).example('2JkfnuslAY53dd011b5ff6cb3970260b42pYhkPGfPHy'),
    login: Joi.string().min(minLoginLength).max(maxLoginLength).example('johnsmith'),
    name: Joi.string().min(2).max(40).example('John Smith'),
    email: Joi.string().email().example('john@smith.com')
  };

}).call(this);

//# sourceMappingURL=validation-schemas.js.map
