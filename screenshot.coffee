waitFor = (testFx, onReady, timeOutMillis=3000) ->
    start = new Date().getTime()
    condition = false
    f = ->
        if (new Date().getTime() - start < timeOutMillis) and not condition
            # If not time-out yet and condition not yet fulfilled
            condition = (if typeof testFx is 'string' then eval testFx else testFx()) #< defensive code
        else
            if not condition
                # If condition still not fulfilled (timeout but condition is 'false')
                console.log "'waitFor()' timeout"
                phantom.exit 1
            else
                # Condition fulfilled (timeout and/or condition is 'true')
                console.log "'waitFor()' finished in #{new Date().getTime() - start}ms."
                if typeof onReady is 'string' then eval onReady else onReady() #< Do what it's supposed to do once the condition is fulfilled
                clearInterval interval #< Stop this interval
    interval = setInterval f, 250 #< repeat check every 250ms

page = require('webpage').create();
system = require 'system'
url = system.args[1]
split_url = url.split("#")[1]
console.log split_url
split_url = split_url.split "/"
zip = split_url[0]
price = split_url[1]
page_nu = split_url[2]
console.log "phantom url is #{url}"
page.viewportSize =  width: 960, height: 1000
page.open url, (status) ->
  waitFor ->
    page.evaluate -> $('.listing').length
  , ->
    page.render "screenshots/#{zip}_#{price}_#{page_nu}.jpg"
    phantom.exit()

