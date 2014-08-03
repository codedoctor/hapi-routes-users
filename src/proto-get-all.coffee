_ = require 'underscore'
Hoek = require "hoek"
mongoose = require "mongoose"
PagingUrlHelper = require './paging-url-helper'

parseMyInt = (someValue, def = 0) ->
  try
    x = parseInt((someValue || def).toString(), 10)
    x = 0 if x < 0
    return x
  catch e
    return def

module.exports = protoGetAll = (plugin,endpoint,dbMethods,accountId,requestHelper,routeInfo = {}) ->
    Hoek.assert plugin,"Plugin required"

    Hoek.assert dbMethods.all, "all method required in dbStore methods"
    
    routeInfo.path = "/#{endpoint}"
    routeInfo.method = "GET"
    routeInfo.handler = (request, reply) ->

      queryOptions = {}
      queryOptions.offset = parseMyInt(request.query.offset,0)
      queryOptions.count = parseMyInt(request.query.count,20)

      requestHelper(queryOptions,request) if requestHelper and _.isFunction(requestHelper)


      dbMethods.all accountId,queryOptions, (err,resultData) ->
        return reply err if err

        resultData = resultData.toObject() if resultData.toObject

        ###
        @TODO Clean up this hack
        ###
        url = request.url
        if process.env.NODE_ENV is 'production'
          url.protocol = "https:"
          url.host = "api.fanignite.com"
        else
          url.protocol = "http:"
          url.host = "localhost:7011"

        pp = new PagingUrlHelper queryOptions.offset,queryOptions.count,resultData.totalCount,request.url

        resultData._pagination =
          totalCount : resultData.totalCount
          requestCount : resultData.requestCount
          requestOffset: resultData.requestOffset
          requestPageNumber: pp._currentPage()
          requestPageNumberDisplay: (pp._currentPage() + 1).toString()
          totalPageCount: pp._numberOfPages()
          pagingKind: "paged"
          previousUrl: pp.previous()
          nextUrl: pp.next()
          firstUrl: pp.first()
          lastUrl: pp.last()
          pages: pp.pages() 
        delete resultData.base

        reply resultData

    plugin.route routeInfo
