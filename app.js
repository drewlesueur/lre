(function() {
  var accounting, app, async, callbacker, enableCORS, exec, express, get_all_photos, req, spark, write, _,
    __slice = Array.prototype.slice;

  express = require("express");

  app = express();

  async = require("async");

  spark = require("./spark.coffee");

  _ = require("underscore");

  accounting = require("./accounting.min.js");

  app.use(express.static(__dirname + "./public"));

  callbacker = function(func) {
    return function() {
      var args;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      return function(callback) {
        return func.apply(null, __slice.call(args).concat([function() {
          var args;
          args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
          return callback.apply(null, args);
        }]));
      };
    };
  };

  exec = callbacker(require('child_process').exec);

  write = callbacker(require("fs").writeFile);

  enableCORS = function(req, res, next) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-Requested-With");
    return next();
  };

  app.configure(function() {
    app.use(enableCORS);
    return app.use(express.bodyParser());
  });

  get_all_photos = function(listings, cb) {
    return async.map(listings, function(listing, cb) {
      var url;
      url = "/v1/listings/" + listing.Id + "/photos";
      console.log(url);
      return spark(url, {}, cb);
    }, function(err, results) {
      console.log("results!!!!!!!!!!!!!hhhhhhhhhhh");
      console.log(results);
      console.log(err);
      _.each(results, function(result, index) {
        console.log(index);
        return listings[index].StandardFields.photos = result.D.Results;
      });
      return cb();
    });
  };

  req = null;

  app.get("/cl", function(_req, res) {
    var max_price, page, zip;
    req = _req;
    zip = req.query.zip || "85207";
    page = req.query.page || 2;
    return max_price = req.query.max_price || 200000;
  });

  app.get("/image", function(_req, res) {
    var max_price, page, url, zip;
    req = _req;
    zip = req.query.zip || "85207";
    page = req.query.page || 2;
    max_price = req.query.max_price || 200000;
    url = "http://homeseekr.com/#" + zip + "/" + max_price + "/" + page;
    console.log(url);
    return exec("ph screenshot.coffee " + url)(function(err, ret) {
      return res.sendfile('./screenshot.jpg');
    });
  });

  app.get("/", function(_req, res) {
    var max_price, page, zip;
    req = _req;
    zip = req.query.zip || "85207";
    page = req.query.page || 2;
    max_price = req.query.max_price || 200000;
    return spark("/v1/listings", {
      _filter: "PostalCode Eq '" + zip + "' And StandardStatus Eq 'Active' And ListPrice Le " + max_price + ".0 And PropertyType Eq 'A'",
      _orderby: "-ListPrice",
      _limit: 10,
      _page: page
    }, function(err, data) {
      var listings;
      listings = data.D.Results;
      return get_all_photos(listings, function() {
        return res.send(_.map(listings, function(listing) {
          listing.StandardFields = _.pick(listing.StandardFields, 'BathsFull', 'BathsHalf', 'BathsTotal', 'photos', 'BuildingAreaTotal', 'UnparsedAddress', 'City', 'StateOrProvince', 'PostalCode', 'StreetNumber', 'StreetDirPrefix', 'StreetName', 'ListPrice', 'BedsTotal', 'PublicRemarks', 'OnMarketDate', 'ListOfficeName', 'CrossStreet');
          return listing;
        }));
      });
    });
  });

  app.listen(8502);

  console.log('listening');

}).call(this);
