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
  Hoek.assert options.routeTagsPublic && _.isArray(options.routeTagsPublic),i18n.optionsRouteTagsPublicRequiredAndArray

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
    method: "POST"
    config:
      description: "Creates a new user."
      tags: options.routeTagsPublic
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

