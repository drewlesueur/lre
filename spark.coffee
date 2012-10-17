request = require "request"
crypto = require('crypto');
config = require "./config"

key = config.key
secret = config.secret

raw_api_sig = "#{secret}ApiKey#{key}"

api_sig = crypto.createHash('md5').update(raw_api_sig).digest("hex");

auth_url = "https://sparkapi.com/v1/session?ApiKey=#{key}&ApiSig=#{api_sig}"
request_opts =
  method: "POST"
  headers:
    "X-SparkApi-User-Agent": "lre"
  url: auth_url

auth_token = ""
request request_opts, (error, response, body) ->
  console.log "authenticated"
  auth_token = JSON.parse(body).D.Results[0].AuthToken
  console.log auth_token
  spark "/v1/listings", (err, response, body) ->
    console.log error
    console.log response
    console.log body


spark = (url, opts, cb) ->
  # do options

  raw_api_sig = "#{secret}ApiKey#{key}ServicePath#{url}AuthToken#{auth_token}"
  api_sig = crypto.createHash('md5').update(raw_api_sig).digest("hex");
  auth_url = "http://sparkapi.com#{url}?AuthToken=#{auth_token}&ApiSig=#{api_sig}"
  console.log(auth_url)

  request_opts =
    method: "GET"
    headers:
      "X-SparkApi-User-Agent": "lre"
    url: auth_url

  console.log "makeing request"
  request request_opts, (err, response, body) ->
    console.log "request  done"
    console.log body
  

