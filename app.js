(function() {
  var accounting, app, async, callbacker, enableCORS, exec, express, filter_listings, fs, get_all_photos, get_listings, req, save_screen_shot, spark, write, _,
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
    var max_price, page, zip;
    req = _req;
    zip = req.query.zip || "85207";
    page = req.query.page || 2;
    max_price = req.query.max_price || 200000;
    return save_screen_shot(zip, max_price, page, function(err, path) {
      return res.sendfile(path);
    });
  });

  save_screen_shot = function(zip, max_price, page, cb) {
    var url;
    url = "http://homeseekr.com/#" + zip + "/" + max_price + "/" + page;
    console.log(url);
    return exec("ph screenshot.coffee " + url)(function(err, ret) {
      return cb(null, "./screenshots/" + zip + "_" + max_price + "_" + page + ".jpg");
    });
  };

  fs = require("fs");

  app.get("/cached_image", function(_req, res) {
    var max_price, page, path, zip;
    req = _req;
    zip = req.query.zip || "85207";
    page = req.query.page || 2;
    max_price = req.query.max_price || 200000;
    path = "./screenshots/" + zip + "_" + max_price + "_" + page + ".jpg";
    return fs.exists(path, function(exists) {
      if (exists) {
        return res.sendfile(path);
      } else {
        console.log(path);
        return save_screen_shot(zip, max_price, page, function(err, path) {
          return res.sendfile(path);
        });
      }
    });
  });

  app.get("/", function(_req, res) {
    var max_price, page, zip;
    req = _req;
    zip = req.query.zip || "85207";
    page = req.query.page || 2;
    max_price = req.query.max_price || 200000;
    return get_listings(zip, page, max_price, function(err, listings) {
      return res.send(listings);
    });
  });

  app.get("/js", function(_req, res) {
    var jsonp, max_price, page, zip;
    req = _req;
    zip = req.query.zip || "85207";
    page = req.query.page || 2;
    max_price = req.query.max_price || 200000;
    jsonp = req.query.callback || req.query.jsonp || "alert";
    return get_listings(zip, page, max_price, function(err, listings) {
      res.set("Content-Type", "text/javascript");
      return res.send("" + jsonp + "(" + (JSON.stringify(listings)) + ")");
    });
  });

  get_listings = function(zip, page, max_price, cb) {
    return spark("/v1/listings", {
      _filter: "PostalCode Eq '" + zip + "' And StandardStatus Eq 'Active' And ListPrice Le " + max_price + ".0 And PropertyType Eq 'A'",
      _orderby: "-ListPrice",
      _limit: 10,
      _page: page
    }, function(err, data) {
      var listings;
      listings = data.D.Results;
      return get_all_photos(listings, function() {
        return cb(err, filter_listings(listings));
      });
    });
  };

  filter_listings = function(listings) {
    return _.map(listings, function(listing) {
      listing.StandardFields = _.pick(listing.StandardFields, 'BathsFull', 'BathsHalf', 'BathsTotal', 'photos', 'BuildingAreaTotal', 'UnparsedAddress', 'City', 'StateOrProvince', 'PostalCode', 'StreetNumber', 'StreetDirPrefix', 'StreetName', 'ListPrice', 'BedsTotal', 'PublicRemarks', 'OnMarketDate', 'ListOfficeName', 'CrossStreet');
      return listing;
    });
  };

  app.listen(8502);

  console.log('listening');

}).call(this);
