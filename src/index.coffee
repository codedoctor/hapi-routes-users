routes = require './routes'
Hoek = require 'hoek'

###
options:
  clientId: 'some mongodb guid'
  accountId: 'some mongodb guid'
  baseUrl: This is the url to your api. For example https://api.mystuff.com
``realm: ignore for now
  scope: leave to null
###
module.exports.register = (plugin, options = {}, cb) ->

  defaults =
    realm: "default"
  options = Hoek.applyToDefaults defaults, options

  routes plugin,options

  plugin.expose 'dummy', {} if process.env.NODE_ENV is 'test' # test for plugin loaded during test

  cb()

module.exports.register.attributes =
  pkg: require '../package.json'

