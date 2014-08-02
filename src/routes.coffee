_ = require 'underscore'
Boom = require 'boom'
Hoek = require "hoek"
Joi = require "joi"
url = require 'url'

helperAddTokenToUser = require './helper-add-token-to-user'
validationSchemas = require './validation-schemas'
i18n = require './i18n'

module.exports = (plugin,options = {}) ->
  Hoek.assert options.clientId,"options parameter requires a clientId"
  Hoek.assert options.accountId,"options parameter requires an accountId"
  Hoek.assert options.baseUrl,"options parameter requires an baseUrl"
  Hoek.assert options.realm,"options parameter requires a realm"

  Hoek.assert options.sendEmail,"options parameter requires a sendEmail (kind,email,payload,cb) -> function"
  Hoek.assert _.isFunction(options.sendEmail),"options parameter requires sendEmail to be a function"

  options.scope ||= null


  hapiIdentityStore = -> plugin.plugins['hapi-identity-store']
  Hoek.assert hapiIdentityStore(),"Could not find 'hapi-identity-store' plugin."

  methodsUsers = -> hapiIdentityStore().methods.users
  methodsOauthAuth = -> hapiIdentityStore().methods.oauthAuth

  Hoek.assert methodsUsers(),"Could not find 'methods.users' in 'hapi-identity-store' plugin."
  Hoek.assert methodsOauthAuth(),"Could not find  'methods.oauthAuth' in 'hapi-identity-store' plugin."

  fnSendEmail = (kind,email,payload) ->
    # Send email is run outside this tick, and we only care about the result for loggin purposes.
    options.sendEmail kind, email, payload, (err) ->
      if err
        data = 
          payload: payload
          msg: "Failed to send email."
        plugin.log ['error','customer-support-likely'], data 


  ###
  Creates a new user and returns it and the new session.
  ###
  plugin.route
    path: "/users"
    method: "POST"
    config:
      auth: false
      validate:
        payload: validationSchemas.payloadUsersPost
    handler: (request, reply) ->
      methodsUsers().create options.accountId,request.payload, {}, (err,user) ->
        return reply err if err

        helperAddTokenToUser methodsOauthAuth(), options.baseUrl,options.accountId,user._id,options.clientId,options.realm,options.scope,user, (err, userWithToken) ->
          return reply err if err
          reply(userWithToken).code(201)

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
        payload: validationSchemas.payloadUsersResetPasswordPost
    handler: (request, reply) ->

      methodsUsers().resetPassword options.accountId,request.payload.login,null, (err,user,token) ->
        return reply err if err
        return reply Boom.create(400,"Unable to retrieve password.") unless user and token

        primaryEmail = user.primaryEmail && user.primaryEmail.length > 5
        sendAttempt = !!primaryEmail


        if sendAttempt
          payload =
            dislayName: user.displayName || user.username
            user: user
            trackingId: user._id
            trackingClass: 'User'
            token: token
            resetUrl : "http://fanignite.com/users/reset-password/reset?token=#{token}"

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
        payload: validationSchemas.payloadUsersResetPasswordTokensPost
    handler: (request, reply) ->
      token = request.payload.token
      password = request.payload.password

      methodsUsers().resetPasswordToken options.accountId,token,password, (err,user) ->
        return reply err if err


        primaryEmail = user.primaryEmail && user.primaryEmail.length > 5
        sendAttempt = !!primaryEmail

        if sendAttempt
          payload =
            dislayName: user.displayName || user.username
            user: user
            trackingId: user._id
            trackingClass: 'User'

          fnSendEmail i18n.emailKindPasswordResetSuccess, primaryEmail,payload

        reply( {emailSentAttempted: sendAttempt}).code(200)
        
  plugin.route
    path: "/users/{usernameOrIdOrMe}/password"
    method: "PUT"
    config:
      auth: false
      validate:
        params: validationSchemas.paramsUsersPasswordPut
        payload: validationSchemas.payloadUsersPasswordPut
    handler: (request, reply) ->
      usernameOrIdOrMe = request.params.usernameOrIdOrMe


      if usernameOrIdOrMe.toLowerCase() is 'me'
        return reply Boom.unauthorized("Authentication required for this endpoint.") unless request.auth?.credentials?.id
        usernameOrIdOrMe = request.auth.credentials.id

      methodsUsers().patch options.accountId, usernameOrIdOrMe,password : request.payload.password,null,  (err,user) ->
        return reply err if err

        primaryEmail = user.primaryEmail && user.primaryEmail.length > 5
        sendAttempt = !!primaryEmail

        if sendAttempt
          payload =
            dislayName: user.displayName || user.username
            user: user
            trackingId: user._id
            trackingClass: 'User'

          fnSendEmail i18n.emailKindPasswordChanged, primaryEmail,payload

        reply().code(204)

  ###

    @app.get '/users', userInScope("server-access"), paginatorMiddleware(), @all
    @app.get '/users/:id', userInScope("server-access"), @get
    @app.patch '/users/:usernameOrId', userInScope("server-access"), @patch
    @app.delete '/users/:usernameOrId', userInScope("server-access"), @delete

  ####

