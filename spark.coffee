request = require "request"
crypto = require('crypto');
config = require "./config"
qs = require "qs"
_ = require "underscore"
api_key = config.key
secret = config.secret
auth_token = ""

setInterval () ->
  #clear out auth token
  auth_token = ""
, (30 * 60 * 1000 )
#8800000

spark_login = (cb) ->
  if auth_token
    return _.defer cb

  raw_api_sig = "#{secret}ApiKey#{api_key}"

  api_sig = crypto.createHash('md5').update(raw_api_sig).digest("hex");

  auth_url = "https://sparkapi.com/v1/session?ApiKey=#{api_key}&ApiSig=#{api_sig}"
  request_opts =
    method: "POST"
    headers:
      "X-SparkApi-User-Agent": "lre"
    url: auth_url

  request request_opts, (error, response, body) ->
    auth_token = JSON.parse(body).D.Results[0].AuthToken
    console.log body

    cb error, response

reorder = (x) ->
  
  l = _.pairs x
  l = _.sortBy l, (i) -> i[0]
  
  x = _.object l
  x
  
spark = (url, opts, cb) ->
  # do options
  spark_login ->

    raw_api_sig = "#{secret}ApiKey#{api_key}ServicePath#{url}"
    opts.AuthToken = auth_token
    opts = reorder opts
    for key, value of opts
      raw_api_sig += "#{key}#{value}"
    api_sig = crypto.createHash('md5').update(raw_api_sig).digest("hex");
    opts.ApiSig = api_sig
    #auth_url = "http://sparkapi.com#{url}?AuthToken=#{auth_token}&ApiSig=#{api_sig}"
    #auth_url = "http://sparkapi.com#{url}"
    auth_url = "http://sparkapi.com#{url}?#{qs.stringify(opts)}"
    
    
    
    request_opts =
      method: "GET"
      headers:
        "X-SparkApi-User-Agent": "lre"
      url: auth_url
      #qs: opts
  
    request request_opts, (err, response, body) ->
      console.log body
      cb err, JSON.parse body
  
module.exports = spark
