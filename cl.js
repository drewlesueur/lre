(function() {
  var choose_phx, click_east_valley, click_housing_offered, click_post_to_classifieds, click_real_estate_by_broker, exit, fill_in_login, fill_out_listing, home_page, new_posting, next_step, old, page, post_listing, render, start, steps, waitFor, _;

  _ = require("underscore");

  page = require('webpage').create();

  page.viewportSize = {
    width: 1024,
    height: 768
  };

  start = function() {
    return page.open("https://accounts.craigslist.org");
  };

  fill_in_login = function() {
    console.log("login");
    return page.evaluate(function() {
      $('#inputEmailHandle').val("kylebill@gmail.com");
      $('#inputPassword').val("lotion");
      return $('form').submit();
    });
  };

  choose_phx = function() {
    console.log("choose phx");
    page.evaluate(function() {
      return $('[name="areaabb"]').val('phx');
    });
    return next_step();
  };

  new_posting = function() {
    console.log("new posting");
    return page.open("https://accounts.craigslist.org/login?show_tab=new_posting");
  };

  exit = function() {
    console.log('exiting');
    return phantom.exit();
  };

  render = function(file) {
    if (file == null) file = 'tmp.png';
    return function() {
      console.log("rendering " + file);
      page.render(file);
      return next_step();
    };
  };

  home_page = function() {
    console.log("home");
    return page.open("http://phoenix.craigslist.org/");
  };

  click_post_to_classifieds = function() {
    var post_link;
    console.log("clicking the post link");
    post_link = page.evaluate(function() {
      return $("#post").attr('href');
    });
    console.log("post link is " + post_link);
    return page.open(post_link);
  };

  click_housing_offered = function() {
    console.log("clicking housing offered");
    return page.evaluate(function() {
      $('input[name="id"][value="ho"]').prop('checked', true);
      return $('form').submit();
    });
  };

  click_real_estate_by_broker = function() {
    console.log("click real estate by broker");
    return page.evaluate(function() {
      $('input[name="id"][value="144"]').prop('checked', true);
      return $('form').submit();
    });
  };

  click_east_valley = function() {
    console.log("east valley");
    return page.evaluate(function() {
      $('label:contains("east valley")').find("input").prop('checked', true);
      return $('form').submit();
    });
  };

  post_listing = function() {
    return page.evaluate;
  };

  fill_out_listing = function() {
    page.evaluate(function() {
      return $("span:contains(\"Price:\").next(\"input\")").val("200000");
    });
    return next_step();
  };

  steps = [home_page, render("tmp_home.jpg"), click_post_to_classifieds, render("tmp_post.jpg"), click_housing_offered, render("tmp_housing.jpg"), click_real_estate_by_broker, render("tmp_rebb.jpg"), click_east_valley, render("tmp_ev.jpg"), fill_out_listing, render("tmp_listing.jpg"), exit];

  next_step = function() {
    var step;
    step = steps.shift();
    return setTimeout(step, _.random(3167, 5125));
  };

  page.onLoadFinished = function() {
    return next_step();
  };

  next_step();

  waitFor = function(testFx, onReady, timeOutMillis) {
    var condition, f, interval;
    if (timeOutMillis == null) timeOutMillis = 3000;
    start = new Date().getTime();
    condition = false;
    f = function() {
      if ((new Date().getTime() - start < timeOutMillis) && !condition) {
        return condition = (typeof testFx === 'string' ? eval(testFx) : testFx());
      } else {
        if (!condition) {
          console.log("'waitFor()' timeout");
          return phantom.exit(1);
        } else {
          console.log("'waitFor()' finished in " + (new Date().getTime() - start) + "ms.");
          if (typeof onReady === 'string') {
            eval(onReady);
          } else {
            onReady();
          }
          return clearInterval(interval);
        }
      }
    };
    return interval = setInterval(f, 250);
  };

  old = function() {
    var system, url;
    page = require('webpage').create();
    system = require('system');
    url = system.args[1];
    console.log("phantom url is " + url);
    page.viewportSize = {
      width: 960,
      height: 1000
    };
    return page.open(url, function(status) {
      return waitFor(function() {
        return page.evaluate(function() {
          return $('.listing').length;
        });
      }, function() {
        page.render('screenshot.jpg');
        return phantom.exit();
      });
    });
  };

}).call(this);
