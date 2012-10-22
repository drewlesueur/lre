express = require "express"
app = express()
async = require("async")
spark = require "./spark.coffee"
_ = require "underscore"

callbacker = (func) ->
  (args...) ->
    (callback) ->
      func args..., (args...) ->
        callback args...

exec = callbacker require('child_process').exec
write = callbacker require("fs").writeFile


enableCORS = (req, res, next) ->
  res.setHeader "Access-Control-Allow-Origin", "*"
  res.setHeader "Access-Control-Allow-Headers", "Content-Type, X-Requested-With"
  next()

app.configure () ->
  app.use enableCORS
  app.use express.bodyParser()

app.get "/", (req, res) ->
  zip = req.query.zip || "85207"
  spark "/v1/listings", {
    _filter: "PostalCode Eq '#{zip}'"
  }, (err, data) ->
    
    res.send listings_to_html(data,zip)
    #res.send data.D.Results[0]

listings_to_html = (listings,zip) ->
  listings = listings.D.Results
  html = _.map listings, (listing) ->
    l = listing.StandardFields
    """
      <div>
        #{l.StreetNumber} #{l.StreetName} #{l.City} #{l.StateOrProvince} #{l.PostalCode}
      </div>
    """
  header() + zip_form(zip) + html.join("") # + JSON.stringify(listings)

header = () ->
  """
    <meta name="viewport" content="initial-scale=1">
  """
  
zip_form = (zip) ->
  """
    <form method="GET" action="/">
      <input type="text" name="zip" value="#{zip or ''}">
    </form>
  """
app.engine('jade', require('jade').__express);

app.listen 8502 
console.log 'listening'
