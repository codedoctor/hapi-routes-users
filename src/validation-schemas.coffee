Joi = require "joi"

minLoginLength = 2
maxLoginLength = 100
minPasswordLength = 8
maxPasswordLength = 40

validatePassword = Joi.string().min(minPasswordLength).max(maxPasswordLength).example('some password')
validateId = Joi.string().length(24)

validateMe = Joi.string().valid(['me'])
validateUsername = Joi.string().min(2).max(100)
validateUsernameOrIdOrMe = Joi.alternatives([validateId,validateMe,validateUsername])


module.exports =
  validateId: validateId
  validatePassword: validatePassword
  validateMe: validateMe
  validateUsername: validateUsername
  validateUsernameOrIdOrMe : validateUsernameOrIdOrMe

  ###
  Creating a new user.
  ###
  payloadUsersPost : Joi.object().keys(
      username: Joi.string().min(minLoginLength).max(maxLoginLength).required().example('johnsmith')
      name: Joi.string().min(2).max(40).required().example('John Smith')
      password: validatePassword.required()
      email: Joi.string().email().required().example('john@smith.com')
    ).with('username', 'password','email','name').options({ allowUnkown: true, stripUnknown: true })

  payloadUsersResetPasswordPost : Joi.object().keys(
    login: Joi.string().min(minLoginLength).max(maxLoginLength).required().example('johnsmith').description('The login field can either be an email address or a username.')
    ).options({ allowUnkown: true, stripUnknown: true })

  payloadUsersResetPasswordTokensPost : Joi.object().keys(
    password: validatePassword.required().description('The new password for the user referenced by the token.')
    token: Joi.string().min(20).max(100).required().example('2JkfnuslAY53dd011b5ff6cb3970260b42pYhkPGfPHy').description('The token obtained through a POST request at /users/reset-password.')
    ).options({ allowUnkown: true, stripUnknown: true })

  payloadUsersPasswordPut : Joi.object().keys(
    password: validatePassword.required().description('The new password for the user.')
    ).options({ allowUnkown: true, stripUnknown: true })

  paramsUsersPasswordPut: Joi.object().keys(
      usernameOrIdOrMe: validateUsernameOrIdOrMe.required() 
    )

  paramsUsersDelete: Joi.object().keys(
      usernameOrIdOrMe: validateUsernameOrIdOrMe.required() 
    )

  payloadUsersPatch : Joi.object().keys(
    password: validatePassword.description('The new password for the user.')
    ).options({ allowUnkown: true, stripUnknown: true })

  paramsUsersPatch: Joi.object().keys(
      usernameOrIdOrMe: validateUsernameOrIdOrMe.required() 
    )
