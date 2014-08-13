_ = require 'underscore'
Hoek = require "hoek"
mongoose = require "mongoose"
apiPagination = require 'api-pagination'
i18n = require './i18n'

parseMyInt = (someValue, def = 0) ->
  try
    x = parseInt((someValue || def).toString(), 10)
    x = 0 if x < 0
    return x
  catch e
    return def

module.exports = protoGetAll = (plugin,endpoint,dbMethods,_tenantId,baseUrl,requestHelper,routeInfo = {}) ->
    Hoek.assert plugin,i18n.assertPluginRequired
    Hoek.assert endpoint,i18n.assertEndpointRequired
    Hoek.assert dbMethods,i18n.assertDbMethodsRequired
    Hoek.assert dbMethods.all,i18n.assertDbMethodsAllRequired
    Hoek.assert _tenantId,i18n.assertTenantIdRequired

    routeInfo.path = "/#{endpoint}"
    routeInfo.method = "GET"
    routeInfo.handler = (request, reply) ->

      queryOptions = {}
      queryOptions.offset = parseMyInt(request.query.offset,0)
      queryOptions.count = parseMyInt(request.query.count,20)

      requestHelper(queryOptions,request) if requestHelper and _.isFunction(requestHelper)


      dbMethods.all _tenantId,queryOptions, (err,resultData) ->
        return reply err if err

        resultData = resultData.toObject() if resultData.toObject

        reply apiPagination.toRest(resultData,baseUrl)

    plugin.route routeInfo
