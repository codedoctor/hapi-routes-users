_ = require 'underscore'
Boom = require 'boom'
Hoek = require "hoek"
Joi = require "joi"
url = require 'url'

helperAddTokenToUser = require './helper-add-token-to-user'
helperObjToRest = require './helper-obj-to-rest'
i18n = require './i18n'

validationSchemas = require './validation-schemas'
helperUsernameFromRequest = require './helper-username-from-request'

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




  plugin.route
    path: "/users/{usernameOrIdOrMe}"
    method: "PATCH"
    config:
      validate:
        params: Joi.object().keys(
                  usernameOrIdOrMe: validationSchemas.validateUsernameOrIdOrMe.required() 
                    )
        payload: Joi.object().keys(
                                username: Joi.string()
                                displayName: Joi.string()
                                roles : [Joi.string(),Joi.array().includes(Joi.string())]
                                password: validationSchemas.validatePassword.description('The new password for the user.')
                                #primaryEmail: Joi.string().email()
                                  ).options({ allowUnknown: true, stripUnknown: true })

    handler: (request, reply) ->
      usernameOrIdOrMe = helperUsernameFromRequest request
      return reply Boom.unauthorized(i18n.errorUnauthorized) unless usernameOrIdOrMe

      if _.isString(request.payload.roles)
        request.payload.roles = (request.payload.roles || "").split(',')
        request.payload.roles = _.map request.payload.roles, (x) -> x.trim()
        


      methodsUsers().patch options._tenantId, usernameOrIdOrMe,request.payload,null,  (err,user) ->
        return reply err if err

        primaryEmail = user.primaryEmail 
        sendAttempt = !!primaryEmail && request.payload.password && user.primaryEmail.length > 5

        if sendAttempt
          payload =
            dislayName: user.displayName || user.username
            user: user
            trackingId: user._id
            trackingClass: 'User'

          fnSendEmail i18n.emailKindPasswordChanged, primaryEmail,payload

        reply(helperObjToRest.user user, "#{options.baseUrl}/users").code(204)
