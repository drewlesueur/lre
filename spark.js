(function() {
  var api_key, auth_token, config, crypto, qs, reorder, request, secret, spark, spark_login, _;

  request = require("request");

  crypto = require('crypto');

  config = require("./config");

  qs = require("qs");

  _ = require("underscore");

  api_key = config.key;

  secret = config.secret;

  auth_token = "";

  setInterval(function() {
    return auth_token = "";
  }, 30 * 60 * 1000);

  spark_login = function(cb) {
    var api_sig, auth_url, raw_api_sig, request_opts;
    if (auth_token) return _.defer(cb);
    raw_api_sig = "" + secret + "ApiKey" + api_key;
    api_sig = crypto.createHash('md5').update(raw_api_sig).digest("hex");
    auth_url = "https://sparkapi.com/v1/session?ApiKey=" + api_key + "&ApiSig=" + api_sig;
    request_opts = {
      method: "POST",
      headers: {
        "X-SparkApi-User-Agent": "lre"
      },
      url: auth_url
    };
    return request(request_opts, function(error, response, body) {
      auth_token = JSON.parse(body).D.Results[0].AuthToken;
      console.log(body);
      return cb(error, response);
    });
  };

  reorder = function(x) {
    var l;
    l = _.pairs(x);
    l = _.sortBy(l, function(i) {
      return i[0];
    });
    x = _.object(l);
    return x;
  };

  spark = function(url, opts, cb) {
    return spark_login(function() {
      var api_sig, auth_url, key, raw_api_sig, request_opts, value;
      raw_api_sig = "" + secret + "ApiKey" + api_key + "ServicePath" + url;
      opts.AuthToken = auth_token;
      opts = reorder(opts);
      for (key in opts) {
        value = opts[key];
        raw_api_sig += "" + key + value;
      }
      api_sig = crypto.createHash('md5').update(raw_api_sig).digest("hex");
      opts.ApiSig = api_sig;
      auth_url = "http://sparkapi.com" + url + "?" + (qs.stringify(opts));
      request_opts = {
        method: "GET",
        headers: {
          "X-SparkApi-User-Agent": "lre"
        },
        url: auth_url
      };
      return request(request_opts, function(err, response, body) {
        console.log(body);
        return cb(err, JSON.parse(body));
      });
    });
  };

  module.exports = spark;

}).call(this);
