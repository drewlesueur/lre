(function() {
  var accounting, app, async, callbacker, enableCORS, exec, express, get_all_photos, get_bath_str, get_compliance, get_maps_link, get_photo_html, get_sq_ft, header, listings_to_html, req, spark, write, zip_form, _,
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

  get_all_photos = function(raw, cb) {
    var listings;
    listings = raw.D.Results;
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

  app.get("/", function(_req, res) {
    var max_price, zip;
    req = _req;
    zip = req.query.zip || "85207";
    max_price = req.query.max_price || 200000;
    return spark("/v1/listings", {
      _filter: "PostalCode Eq '" + zip + "' And StandardStatus Eq 'Active' And ListPrice Le " + max_price + ".0 And PropertyType Eq 'A'"
    }, function(err, data) {
      return get_all_photos(data, function() {
        return res.send(listings_to_html(data, zip, max_price));
      });
    });
  });

  get_bath_str = function(l) {
    if (l.BathsFull) {
      if (l.BathsHalf === 1) {
        return "" + l.BathsFull + ".5 bath";
      } else {
        return "" + l.BathsFull + " full bath, " + l.Bathshalf + " bath";
      }
    } else {
      return "" + l.BathsTotal + " bath";
    }
  };

  get_photo_html = function(photos) {
    var x;
    if (photos[0]) return "<img src=\"" + photos[0].Uri300 + "\" />";
    return "<img src=\"http://placekitten.com/300/225\" />";
    x = _.map(photos, function(photo) {
      return "<img src=\"" + photo.Uri300 + "\" />";
    });
    return x.join("");
  };

  get_compliance = function() {
    return "<img src=\"http://cdn.photos.sparkplatform.com/az/20110509192006820059000000.jpg\" />";
  };

  get_sq_ft = function(l) {
    if (l.BuildingAreaTotal) {
      return "<div class=\"square-feet\"> " + l.BuildingAreaTotal + " square feet</div>";
    } else {
      return "";
    }
  };

  get_maps_link = function(l) {
    if (req.headers["user-agent"].match(/iPhone|iPad|iPod/i)) {
      return "http://maps.apple.com?q=" + l.UnparsedAddress;
    } else {
      return "https://maps.google.com?q=" + l.UnparsedAddress;
    }
  };

  listings_to_html = function(listings, zip, max_price) {
    var html;
    listings = listings.D.Results;
    html = _.map(listings, function(listing) {
      var l;
      l = listing.StandardFields;
      return "<div class=\"listing\">\n  <div class=\"address\"> \n    <a href=\"" + (get_maps_link(l)) + "\">\n       " + l.StreetNumber + " " + (l.StreetDirPrefix || "") + " " + l.StreetName + " </div>\n    </a>\n  <div class=\"price\"> " + (accounting.formatMoney(l.ListPrice, "$", 0)) + " </div>\n  <div class=\"photos\">" + (get_photo_html(l.photos)) + "</div>\n  " + (get_sq_ft(l)) + "\n  <div class=\"baths\"> " + (get_bath_str(l)) + " </div>\n  <div class=\"beds\"> " + l.BedsTotal + " bed - </div>\n  <div class=\"description\"> " + l.PublicRemarks + " </div>\n  <div class=\"on-market-date\">On Market Date: " + l.OnMarketDate + "</div>\n  <div>Listing courtesy " + l.ListOfficeName + "</div>\n</div>";
    });
    return header(zip, max_price) + zip_form(zip, max_price) + html.join("") + JSON.stringify(listings[0]);
  };

  header = function(zip, max_price) {
    return ("<!doctype html>\n<html>\n<head>\n<meta name=\"viewport\" content=\"initial-scale=1\">\n<link href='http://fonts.googleapis.com/css?family=Montserrat+Alternates:400,700' rel='stylesheet' type='text/css'>\n<link href='http://mobilemin.com/homeseekr/hs.css' rel='stylesheet' type='text/css'>\n</head>\n<body>\n<div class=\"search\">\n  <form method=\"GET\" action=\"/\">\n    <input placeholder=\"Zip Code\" type=\"text\" name=\"zip\" value=\"" + (zip || '') + "\">\n    <input placeholder=\"Max Price\" type=\"text\" name=\"max_price\" value=\"" + (max_price || '') + "\">\n    <input type=\"submit\" value=\"search\">\n  </form>\n</div>\n<h1><span style=\"color: #ff9900;\">home</span><span style=\"color: #0d58a6\">seekr</span></h1>\n<h2>Homes for sale in " + zip + "</h2>") + get_compliance();
  };

  zip_form = function(zip, max_price) {
    return "";
  };

  app.engine('jade', require('jade').__express);

  app.listen(8502);

  console.log('listening');

}).call(this);
