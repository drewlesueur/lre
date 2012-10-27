(function() {
  var get_bath_str, get_maps_link, get_photo_html, get_sq_ft, listings_to_html, render;

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

  get_sq_ft = function(l) {
    if (l.BuildingAreaTotal) {
      return "<div class=\"square-feet\"> " + l.BuildingAreaTotal + " square feet</div>";
    } else {
      return "";
    }
  };

  get_maps_link = function(l) {
    var _ref;
    if (typeof navigator !== "undefined" && navigator !== null ? (_ref = navigator.userAgent) != null ? _ref.match(/iPhone|iPad|iPod/i) : void 0 : void 0) {
      return "http://maps.apple.com?q=" + l.UnparsedAddress;
    } else {
      return "https://maps.google.com?q=" + l.UnparsedAddress;
    }
  };

  listings_to_html = function(listings, zip, max_price, page) {
    var html;
    return html = _.map(listings, function(listing) {
      var l;
      l = listing.StandardFields;
      return "<div class=\"listing\">\n  <div class=\"address\"> \n    <a href=\"" + (get_maps_link(l)) + "\">\n       " + l.StreetNumber + " " + (l.StreetDirPrefix || "") + " " + l.StreetName + "\n    </a>\n  </div>\n  <div class=\"price\"> " + (accounting.formatMoney(l.ListPrice, "$", 0)) + " </div>\n  <div class=\"cross-streets\">" + l.CrossStreet + "</div>\n  <div class=\"photos\">" + (get_photo_html(l.photos)) + "</div>\n  " + (get_sq_ft(l)) + "\n  <div class=\"baths\"> " + (get_bath_str(l)) + " </div>\n  <div class=\"beds\"> " + l.BedsTotal + " bed - </div>\n  <div class=\"description\"> " + l.PublicRemarks + " </div>\n  <div class=\"on-market-date\">On Market Date: " + l.OnMarketDate + "</div>\n  <div>Listing courtesy " + l.ListOfficeName + "</div>\n</div>";
    });
  };

  render = function(listings, zip, max_price, page) {
    var html;
    console.log(listings);
    if (listings.length === 0) {
      html = "no more listings";
      $(".next").hide();
    } else {
      html = listings_to_html(listings, zip, max_price, page);
      $(".next").show().attr("href", "#" + zip + "/" + max_price + "/" + (page - 0 + 1));
    }
    $(".listings").html(html);
    $("#under-price").text("under " + accounting.formatMoney(max_price, "$", 0));
    $('[name="max_price"]').val(accounting.formatMoney(max_price, "$", 0));
    $("#in-zip").text("in " + zip);
    return $('[name="zip"]').val(zip);
  };

  $(function() {
    var Router, page, router;
    Router = Backbone.Router.extend({
      routes: {
        ":zip/:max_price/:page": 'search',
        ":zip/": 'search',
        "": 'redirect'
      },
      search: function(zip, max_price, _page) {
        var page;
        zip || (zip = "85203");
        max_price || (max_price = "200000");
        page = _page || "1";
        console.log(zip, max_price, page);
        max_price = max_price.replace(/[^\d]/g, "");
        scrollTo(0, 0);
        $(".listings").empty().html("<img src=\"loader.gif\" />");
        return $.get("http://homeseekr.com:8502?zip=" + zip + "&max_price=" + max_price + "&page=" + page + "&_ts=" + ((new Date()).getTime()), function(listings) {
          return render(listings, zip, max_price, page);
        });
      },
      redirect: function() {
        return router.navigate('85203/200000/1', {
          trigger: true
        });
      }
    });
    page = 1;
    router = new Router;
    Backbone.history.start();
    return $("form").submit(function(e) {
      var max_price, zip;
      e.preventDefault();
      zip = $("[name=zip]").val();
      max_price = $("[name=max_price]").val().replace(/[^\d]/g, "");
      return router.navigate("" + zip + "/" + max_price + "/1", {
        trigger: true
      });
    });
  });

}).call(this);
