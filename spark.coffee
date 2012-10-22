request = require "request"
crypto = require('crypto');
config = require "./config"
qs = require "qs"
_ = require "underscore"
api_key = config.key
secret = config.secret
auth_token = ""

spark_login = (cb) ->
  raw_api_sig = "#{secret}ApiKey#{api_key}"

  api_sig = crypto.createHash('md5').update(raw_api_sig).digest("hex");

  auth_url = "https://sparkapi.com/v1/session?ApiKey=#{api_key}&ApiSig=#{api_sig}"
  request_opts =
    method: "POST"
    headers:
      "X-SparkApi-User-Agent": "lre"
    url: auth_url

  request request_opts, (error, response, body) ->
    console.log "authenticated"
    auth_token = JSON.parse(body).D.Results[0].AuthToken
    console.log auth_token

    cb error, response

reorder = (x) ->
  console.log "reorder***"
  
  l = _.pairs x
  console.log JSON.stringify l
  
  l = _.sortBy l, (i) -> i[0]
  console.log JSON.stringify l
  
  x = _.object l
  console.log JSON.stringify x
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
    
    
    console.log(auth_url)
    console.log("raw......")
    console.log(raw_api_sig)
    console.log(JSON.stringify(opts))
    
    request_opts =
      method: "GET"
      headers:
        "X-SparkApi-User-Agent": "lre"
      url: auth_url
      #qs: opts
  
    console.log "makeing request"
    request request_opts, (err, response, body) ->
      console.log "request  done"
      #console.log response
      #console.log body
      cb err, JSON.parse body

  
module.exports = spark
