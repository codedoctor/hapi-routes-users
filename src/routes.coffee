_ = require 'underscore'
Boom = require 'boom'
Hoek = require "hoek"
Joi = require "joi"
url = require 'url'

helperAddTokenToUser = require './helper-add-token-to-user'
helperObjToRestUser = require './helper-obj-to-rest-user'
i18n = require './i18n'
validationSchemas = require './validation-schemas'
helperParseMyInt = require './helper-parse-my-int'
apiPagination = require 'api-pagination'

module.exports = (plugin,options = {}) ->
  Hoek.assert options.clientId,i18n.assertClientIdInOptionsRequired
  Hoek.assert options._tenantId,i18n.assertTenantIdInOptionsRequired
  Hoek.assert options.baseUrl,i18n.assertBaseUrlInOptionsRequired
  Hoek.assert options.realm,i18n.assertRealmInOptionsRequired

  Hoek.assert options.sendEmail,i18n.assertSendEmailInOptionsRequired
  Hoek.assert _.isFunction(options.sendEmail),i18n.assertSendEmailInOptionsIsFunction

  options.scope ||= null

  hapiOauthStoreMultiTenant = -> plugin.plugins['hapi-oauth-store-multi-tenant']
  hapiUserStoreMultiTenant = -> plugin.plugins['hapi-user-store-multi-tenant']
  Hoek.assert hapiOauthStoreMultiTenant(),"Could not find 'hapi-oauth-store-multi-tenant' plugin."
  Hoek.assert hapiUserStoreMultiTenant(),"Could not find 'hapi-user-store-multi-tenant' plugin."

  methodsUsers = -> hapiUserStoreMultiTenant().methods.users
  methodsOauthAuth = -> hapiOauthStoreMultiTenant().methods.oauthAuth

  Hoek.assert methodsUsers(),i18n.assertMethodsUsersNotFound
  Hoek.assert methodsOauthAuth(),i18n.assertMethodsOauthAuthNotFound

  fnSendEmail = (kind,email,payload) ->
    # Send email is run outside this tick, and we only care about the result for loggin purposes.
    options.sendEmail kind, email, payload, (err) ->
      if err
        data = 
          payload: payload
          msg: i18n.errorFailedToSendEmail
        plugin.log ['error','customer-support-likely'], data 

  fbUsernameFromRequest = (request) ->
    usernameOrIdOrMe = request.params.usernameOrIdOrMe

    if usernameOrIdOrMe.toLowerCase() is 'me'
      return null unless request.auth?.credentials?.id
      usernameOrIdOrMe = request.auth.credentials.id
    return usernameOrIdOrMe


  ###
  Creates a new user and returns it and the new session.
  ###
  plugin.route
    path: "/users"
    method: "GET"
    config: {}
    handler: (request, reply) ->
      queryOptions = {}
      queryOptions.offset = helperParseMyInt(request.query.offset,0)
      queryOptions.count = helperParseMyInt(request.query.count,20)

      methodsUsers().all options._tenantId,queryOptions, (err,resultData) ->
        return reply err if err

        resultData = resultData.toObject() if resultData.toObject

        reply apiPagination.toRest(resultData,options.baseUrl)


  ###
  Creates a new user and returns it and the new session.
  ###
  plugin.route
    path: "/users"
    method: "POST"
    config:
      auth: false
      validate:
        payload: Joi.object().keys(
                    username: validationSchemas.username.required().description('The username of the new user. Must be unique within the system.')
                    name: validationSchemas.name.required().description("The real name of the new user.")
                    password: validationSchemas.password.required().description("The password of the new user.")
                    email: validationSchemas.email.required().description('The email of the new user. Must be unique within the system.')
                  ).with('username', 'password','email','name').options({ allowUnknown: true, stripUnknown: true })

    handler: (request, reply) ->
      methodsUsers().create options._tenantId,request.payload, {}, (err,user) ->
        return reply err if err

        helperAddTokenToUser methodsOauthAuth(), options.baseUrl,options._tenantId,user._id,options.clientId,options.realm,options.scope,user, (err, userWithToken) ->
          return reply err if err
          reply(userWithToken).code(201)

        ###
        Secondary Flow
        ###
        primaryEmail = user.primaryEmail 
        sendAttempt = !!primaryEmail && user.primaryEmail.length > 5

        if sendAttempt
          payload =
            displayName: user.displayName || user.username
            username: user.username
            email: user.primaryEmail
            user: user
            trackingId: user._id
            trackingClass: 'User'

          fnSendEmail i18n.emailKindNewUser, primaryEmail,payload


  ###
  Posts a request for a password reset token.
  requires a login as input parameter, which can be username or password
  ###
  plugin.route
    path: "/users/reset-password"
    method: "POST"
    config:
      auth: false
      validate:
        payload: Joi.object().keys(
                    login: validationSchemas.login.required().description('The login field can either be an email address or a username.')
                    ).options({ allowUnknown: true, stripUnknown: true })

    handler: (request, reply) ->

      methodsUsers().resetPassword options._tenantId,request.payload.login,null, (err,user,token) ->
        return reply err if err
        return reply Boom.badRequest(errorUnableToRetrievePassword) unless user and token

        primaryEmail = user.primaryEmail 
        sendAttempt = !!primaryEmail && user.primaryEmail.length > 5


        if sendAttempt
          payload =
            displayName: user.displayName || user.username
            username: user.username
            email: user.primaryEmail
            user: user
            trackingId: user._id
            trackingClass: 'User'
            token: token
            resetUrl : "#{options.resetPasswordClientBaseUrl}?token=#{token}"

          fnSendEmail i18n.emailKindPasswordReset, primaryEmail,payload

        reply( {token: token, emailSentAttempted: sendAttempt}).code(201)


  ###
  Validates a request for a password reset. Expects a payload token 
  ###
  plugin.route
    path: "/users/reset-password/tokens"
    method: "POST"
    config:
      auth: false
      validate:
        payload: Joi.object().keys(
                      password: validationSchemas.password.required().description('The new password for the user referenced by the token.')
                      token: validationSchemas.token.required().description('The token obtained through a POST request at /users/reset-password.')
                      ).options({ allowUnknown: true, stripUnknown: true })
    handler: (request, reply) ->
      token = request.payload.token
      password = request.payload.password

      methodsUsers().resetPasswordToken options._tenantId,token,password,{}, (err,user) ->
        return reply err if err


        primaryEmail = user.primaryEmail 
        sendAttempt = !!primaryEmail && user.primaryEmail.length > 5

        if sendAttempt
          payload =
            displayName: user.displayName || user.username
            user: user
            username: user.username
            email: user.primaryEmail
            trackingId: user._id
            trackingClass: 'User'

          fnSendEmail i18n.emailKindPasswordResetSuccess, primaryEmail,payload

        reply( {emailSentAttempted: sendAttempt}).code(200)
        
  plugin.route
    path: "/users/{usernameOrIdOrMe}/password"
    method: "PUT"
    config:
      validate:
        params: Joi.object().keys(
                    usernameOrIdOrMe: validationSchemas.usernameOrIdOrMe.required().description("The quantifier for the user to return. Can be a username, id or 'me'.")
                  )
        payload: Joi.object().keys(
                    password: validationSchemas.password.required().description('The new password for the user.')
                    ).options({ allowUnknown: true, stripUnknown: true })
    handler: (request, reply) ->
      usernameOrIdOrMe = fbUsernameFromRequest request
      return reply Boom.unauthorized(i18n.errorUnauthorized) unless usernameOrIdOrMe

      methodsUsers().patch options._tenantId, usernameOrIdOrMe,password : request.payload.password,null,  (err,user) ->
        return reply err if err

        primaryEmail = user.primaryEmail 
        sendAttempt = !!primaryEmail && user.primaryEmail.length > 5

        if sendAttempt
          payload =
            displayName: user.displayName || user.username
            user: user
            username: user.username
            email: user.primaryEmail
            trackingId: user._id
            trackingClass: 'User'

          fnSendEmail i18n.emailKindPasswordChanged, primaryEmail,payload

        reply().code(204)

  plugin.route
    path: "/users/{usernameOrIdOrMe}"
    method: "DELETE"
    config:
      validate:
        params: Joi.object().keys(
                  usernameOrIdOrMe: validationSchemas.usernameOrIdOrMe.required().description("The quantifier for the user to return. Can be a username, id or 'me'.")
                )
    handler: (request, reply) ->
      usernameOrIdOrMe = fbUsernameFromRequest request
      return reply Boom.unauthorized(i18n.errorUnauthorized) unless usernameOrIdOrMe

      methodsUsers().delete options._tenantId,usernameOrIdOrMe,null, (err,user) ->
        ###
        @TODO Warning: we should eat not found error here.
        ###
        return reply err if err

        reply().code(204)



  plugin.route
    path: "/users/{usernameOrIdOrMe}"
    method: "GET"
    config:
      validate:
        params: Joi.object().keys(
                    usernameOrIdOrMe: validationSchemas.usernameOrIdOrMe.required().description("The quantifier for the user to return. Can be a username, id or 'me'.")
                   )
    handler: (request, reply) ->
      usernameOrIdOrMe = fbUsernameFromRequest request
      return reply Boom.unauthorized(i18n.errorUnauthorized) unless usernameOrIdOrMe

      methodsUsers().getByNameOrId options._tenantId, usernameOrIdOrMe,null,  (err,user) ->
        return reply err if err

        reply(helperObjToRestUser user, "#{options.baseUrl}/users")


