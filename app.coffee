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
    
  

app.get "/", (req, res) ->
  zip = req.query.zip || "85207"
  spark "/v1/listings", {
    _filter: "PostalCode Eq '#{zip}' And StandardStatus Eq 'Active' And ListPrice Lt 200000.0 And PropertyType Eq 'A'"
  }, (err, data) ->
    
    get_all_photos data, ->
      res.send listings_to_html(data,zip)

    #res.send data.D.Results[0]

get_bath_str = (l) ->
  if l.BathsFull
    if l.BathsHalf == 1
      "#{l.BathsFull}.5 Bathrooms"
    else
      "#{l.BathsFull} Full Bathrooms, #{l.Bathshalf} Bathrooms"
  else
    "#{l.BathsTotal} Bathrooms"

get_photo_html = (photos) ->
  if !photos
    return ""
  return """
    <img src="#{photos[0].Uri300}" />
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
listings_to_html = (listings,zip) ->
  listings = listings.D.Results
  html = _.map listings, (listing) ->
    l = listing.StandardFields
    """
      <div class="listing">
        <div class="address">
          #{l.StreetNumber} #{l.StreetName} #{l.City} #{l.StateOrProvince} #{l.PostalCode}
        </div>
        <div class="price"> #{accounting.formatMoney(l.ListPrice)} </div>
        <div class="square-feet"> #{l.BuildingAreaTotal} square feet</div>
        <div class="beds">
          #{l.BedsTotal} Bedrooms
        </div>
        <div class="baths"> #{get_bath_str(l)} </div>
        <div class="description"> #{l.PublicRemarks} </div>
        <div class="on-market-date">On Market Date: #{l.OnMarketDate}</div>
        <div class="photos">#{get_photo_html(l.photos)}</div>
        <div>Listing courtesy #{l.ListOfficeName}</div>
      </div>
    """
  header() + zip_form(zip) + html.join("") #+  JSON.stringify(listings[0])

header = () ->
  """
    <meta name="viewport" content="initial-scale=1">
    <h1><span style="color: #ff9900;">home</span><span style="color: #0d58a6">seekr</span></h1>
    <link href='http://fonts.googleapis.com/css?family=Montserrat+Alternates:400,700' rel='stylesheet' type='text/css'>
    <link href='http://mobilemin.com/homeseekr/hs.css' rel='stylesheet' type='text/css'>
  """ + get_compliance()
  
zip_form = (zip) ->
  """
    <form method="GET" action="/">
      <input type="text" name="zip" value="#{zip or ''}">
    </form>
  """
app.engine('jade', require('jade').__express);

app.listen 8502 
console.log 'listening'
