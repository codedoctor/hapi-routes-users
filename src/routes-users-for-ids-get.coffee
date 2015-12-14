_ = require 'underscore'
apiPagination = require 'api-pagination'
Boom = require 'boom'
Hoek = require "hoek"
Joi = require 'joi'

i18n = require './i18n'
validationSchemas = require './validation-schemas'

helperCheckIsAnyUser =  require './helper-check-is-any-user'
helperObjToRestUser = require './helper-obj-to-rest-user'

###
Retrieves all collections in the system. This requires both admin scope and admin role
###
module.exports = (plugin,options = {}) ->
  Hoek.assert options.baseUrl,i18n.optionsBaseUrlRequired


  hapiUserStoreMultiTenant = -> plugin.plugins['hapi-user-store-multi-tenant']
  Hoek.assert hapiUserStoreMultiTenant(),"Could not find 'hapi-user-store-multi-tenant' plugin."
  storeUsers = -> hapiUserStoreMultiTenant().methods.users
  Hoek.assert storeUsers(),i18n.assertMethodsUsersNotFound
 

  plugin.route
    path: "/users/for-ids"
    method: "GET"
    config:
      tags: ['api','data','access-authenticated']
      description: "Retrieves a set of users as specified with the ids parameter."
      validate:
        params: Joi.object()
        query: Joi.object().keys(
          ids: Joi.string().allow(null).trim().empty('') #.required().description("A comma separated list of id's containing at least one object id")
          ).options({ allowUnknown: true, stripUnknown: false })

      response:
        #schema: validationSchemas.responseSocialCollectionCollection
        status:
          400: validationSchemas.errorBadRequest()
          401: validationSchemas.errorUnauthorized()
          403: validationSchemas.errorForbidden()
          404: validationSchemas.errorNotFound()
          500: validationSchemas.errorInternalServerError()

    handler: (request, reply) ->
      helperCheckIsAnyUser request, (err,userId) ->
        return reply err if err

        userIds = (request.query.ids || "").split(',')
        userIds = _.reject userIds, (x) -> !x || x.length != 24

        storeUsers().getByIds userIds,{}, (err,result) ->
          return reply err if err

          result = JSON.parse(JSON.stringify(result))

          for x in result.items
            x.items = _.map(x.items, (x) -> helperObjToRestUser(x,"#{options.baseUrl}/users",request) )

          reply( apiPagination.toRest( result,"#{options.baseUrl}/users/for-ids"))


