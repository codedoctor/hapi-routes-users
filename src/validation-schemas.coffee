Joi = require "joi"

minLoginLength = 2
maxLoginLength = 100
minPasswordLength = 8
maxPasswordLength = 40

validatePassword = Joi.string().min(minPasswordLength).max(maxPasswordLength).example('some password')
validateId = Joi.string().length(24)

module.exports =
  validateId: validateId
  validatePassword: validatePassword

  ###
  Creating a new user.
  ###
  payloadUsersPost : Joi.object().keys(
      username: Joi.string().min(minLoginLength).max(maxLoginLength).required().example('johnsmith')
      name: Joi.string().min(2).max(40).required().example('John Smith')
      password: validatePassword.required()
      email: Joi.string().email().required().example('john@smith.com')
    ).with('username', 'password','email','name').options({ allowUnkown: true, stripUnknown: true })

