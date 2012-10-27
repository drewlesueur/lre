express = require "express"
app = express()
async = require("async")
spark = require "./spark.coffee"
_ = require "underscore"
accounting = require "./accounting.min.js"

app.use(express.static(__dirname + "./public"))

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

  

get_all_photos = (raw, cb) ->
  listings = raw.D.Results
  async.map listings, (listing, cb) ->
    url = "/v1/listings/#{listing.Id}/photos"
    console.log url
    spark url, {}, cb
  , (err, results) ->
    console.log "results!!!!!!!!!!!!!hhhhhhhhhhh"
    console.log results
    console.log err
    _.each results, (result, index) ->
      console.log index
      listings[index].StandardFields.photos = result.D.Results
    
    cb()
    
  
req = null

app.get "/", (_req, res) ->
  req = _req
  zip = req.query.zip || "85207"
  max_price = req.query.max_price || 200000
  spark "/v1/listings", {
    _filter: "PostalCode Eq '#{zip}' And StandardStatus Eq 'Active' And ListPrice Le #{max_price}.0 And PropertyType Eq 'A'"
  }, (err, data) ->
    
    get_all_photos data, ->
      res.send listings_to_html(data,zip, max_price)

    #res.send data.D.Results[0]

get_bath_str = (l) ->
  if l.BathsFull
    if l.BathsHalf == 1
      "#{l.BathsFull}.5 bath"
    else
      "#{l.BathsFull} full bath, #{l.Bathshalf} bath"
  else
    "#{l.BathsTotal} bath"

get_photo_html = (photos) ->
  return """
    <img src="#{photos[0].Uri300}" />
  """ if photos[0]
  return """
    <img src="http://placekitten.com/300/225" />
  """


  x = _.map photos, (photo) ->
    """
      <img src="#{photo.Uri300}" />
    """
  x.join ""

get_compliance = () ->
  """
    <img src="http://cdn.photos.sparkplatform.com/az/20110509192006820059000000.jpg" />
  """

get_sq_ft = (l) ->
  if l.BuildingAreaTotal 
    """
      <div class="square-feet"> #{l.BuildingAreaTotal} square feet</div>
    """
  else
    ""
get_maps_link = (l) ->
  if req.headers["user-agent"].match /iPhone|iPad|iPod/i 
    "http://maps.apple.com?q=#{l.UnparsedAddress}"
  else
    "https://maps.google.com?q=#{l.UnparsedAddress}"

listings_to_html = (listings,zip, max_price) ->
  listings = listings.D.Results
  html = _.map listings, (listing) ->
    l = listing.StandardFields
    # #{l.City} #{l.StateOrProvince} #{l.PostalCode}
    """
      <div class="listing">
        <div class="address"> 
          <a href="#{get_maps_link(l)}">
             #{l.StreetNumber} #{l.StreetDirPrefix or ""} #{l.StreetName} </div>
          </a>
        <div class="price"> #{accounting.formatMoney(l.ListPrice, "$", 0)} </div>
        <div class="photos">#{get_photo_html(l.photos)}</div>
        #{get_sq_ft(l)}
        <div class="baths"> #{get_bath_str(l)} </div>
        <div class="beds"> #{l.BedsTotal} bed - </div>
        <div class="description"> #{l.PublicRemarks} </div>
        <div class="on-market-date">On Market Date: #{l.OnMarketDate}</div>
        <div>Listing courtesy #{l.ListOfficeName}</div>
      </div>
    """
  header(zip, max_price) + zip_form(zip, max_price) + html.join("") +  JSON.stringify(listings[0])

header = (zip, max_price) ->
  """
    <!doctype html>
    <html>
    <head>
    <meta name="viewport" content="initial-scale=1">
    <link href='http://fonts.googleapis.com/css?family=Montserrat+Alternates:400,700' rel='stylesheet' type='text/css'>
    <link href='http://mobilemin.com/homeseekr/hs.css' rel='stylesheet' type='text/css'>
    </head>
    <body>
    <div class="search">
      <form method="GET" action="/">
        <input placeholder="Zip Code" type="text" name="zip" value="#{zip or ''}">
        <input placeholder="Max Price" type="text" name="max_price" value="#{max_price or ''}">
        <input type="submit" value="search">
      </form>
    </div>
    <h1><span style="color: #ff9900;">home</span><span style="color: #0d58a6">seekr</span></h1>
    <h2>Homes for sale in #{zip}</h2>
  """ + get_compliance()
  
zip_form = (zip, max_price) ->
  """
  """
app.engine('jade', require('jade').__express);

# spark "/v1/listings/20121025052627434500000000/photos", {}, (e, c) ->
# spark "/v1/listings/20120926181133810776000000/photos", {}, (e, c) ->
#   console.log c

app.listen 8502 
console.log 'listening'
