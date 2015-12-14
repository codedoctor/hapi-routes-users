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
    email: Joi.string().email().example('john@smith.com'),

    /*
    400 Bad Request
     */
    errorBadRequest: function() {
      return Joi.object({
        statusCode: Joi.number().description("The http status code.").required()["default"](400).example(400).integer(),
        error: Joi.string().description("The short error name.").required()["default"]("Bad Request").example('Bad Request'),
        message: Joi.string().description("The detailed error message.").required()
      }).description("The passed parameters probably failed some validation.").meta({
        className: 'ErrorBadRequest'
      }).required().options({
        allowUnknown: true,
        stripUnknown: false
      });
    },

    /*
    401 Unauthorized
     */
    errorUnauthorized: function() {
      return Joi.object({
        statusCode: Joi.number().description("The http status code.").required()["default"](401).example(401).integer(),
        error: Joi.string().description("The short error name.").required()["default"]("Unauthorized").example('Unauthorized'),
        message: Joi.string().description("The detailed error message.").required()
      }).description("You are not authorized to access this resource.").meta({
        className: 'ErrorUnauthorized'
      }).required().options({
        allowUnknown: true,
        stripUnknown: false
      });
    },

    /*
    403 Forbidden
     */
    errorForbidden: function() {
      return Joi.object({
        statusCode: Joi.number().description("The http status code.").required()["default"](403).example(403).integer(),
        error: Joi.string().description("The short error name.").required()["default"]("Forbidden").example('Forbidden'),
        message: Joi.string().description("The detailed error message.").required()
      }).description("Raised in case the user lacks priviledges or the API key does not posess necessary scopes/").meta({
        className: 'ErrorForbidden'
      }).required().options({
        allowUnknown: true,
        stripUnknown: false
      });
    },

    /*
    404 Not Found
     */
    errorNotFound: function() {
      return Joi.object({
        statusCode: Joi.number().description("The http status code.").required()["default"](404).example(404).integer(),
        error: Joi.string().description("The short error name.").required()["default"]("Not Found").example('Not Found'),
        message: Joi.string().description("The detailed error message.").required()
      }).description("The requested resource could not be found.").meta({
        className: 'ErrorNotFound'
      }).required().options({
        allowUnknown: true,
        stripUnknown: false
      });
    },

    /*
    500 Internal Server Error
     */
    errorInternalServerError: function() {
      return Joi.object({
        statusCode: Joi.number().description("The http status code.").required()["default"](500).example(500).integer(),
        error: Joi.string().description("The short error name.").required()["default"]("Internal Server Error").example("Internal Server Error"),
        message: Joi.string().description("The detailed error message.").required()
      }).description("An internal server error occurred.").meta({
        className: 'ErrorInternalServerError'
      }).required().options({
        allowUnknown: true,
        stripUnknown: false
      });
    }
  };

}).call(this);

//# sourceMappingURL=validation-schemas.js.map
