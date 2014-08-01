_ = require 'underscore'
Boom = require 'boom'
Hoek = require "hoek"
Joi = require "joi"
url = require 'url'

helperAddTokenToUser = require './helper-add-token-to-user'
validationSchemas = require './validation-schemas'


module.exports = (plugin,options = {}) ->
  Hoek.assert options.clientId,"options parameter requires a clientId"
  Hoek.assert options.accountId,"options parameter requires an accountId"
  Hoek.assert options.baseUrl,"options parameter requires an baseUrl"
  Hoek.assert options.realm,"options parameter requires a realm"
  options.scope ||= null


  hapiIdentityStore = -> plugin.plugins['hapi-identity-store']
  Hoek.assert hapiIdentityStore(),"Could not find 'hapi-identity-store' plugin."

  methodsUsers = -> hapiIdentityStore().methods.users
  methodsOauthAuth = -> hapiIdentityStore().methods.oauthAuth

  Hoek.assert methodsUsers(),"Could not find 'methods.users' in 'hapi-identity-store' plugin."
  Hoek.assert methodsOauthAuth(),"Could not find  'methods.oauthAuth' in 'hapi-identity-store' plugin."

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
    @app.post '/users', userInScope("server-access"), routeValidator(schemaCreateUser), @post
    @app.get '/users', userInScope("server-access"), paginatorMiddleware(), @all
    @app.get '/users/:id', userInScope("server-access"), @get

    @app.patch '/users/:usernameOrId', userInScope("server-access"), @patch
    @app.delete '/users/:usernameOrId', userInScope("server-access"), @delete

    @app.put '/users/:usernameOrId/password', userInScope("server-access"), routeValidator(schemaPutPassword), @putPassword
    @app.post '/users/:usernameOrId/password-reset-tokens', userInScope("server-access"), @postPasswordResetTokens
    @app.put '/users/:usernameOrId/password-reset-tokens/:token', userInScope("server-access"), @putPasswordResetTokens
  ####

