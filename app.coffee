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

  

get_all_photos = (listings, cb) ->
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

# post to craigslist
app.get "/cl", (_req, res) ->
  req = _req
  zip = req.query.zip || "85207"
  page = req.query.page || 2
  max_price = req.query.max_price || 200000

app.get "/image", (_req, res) ->
  req = _req
  zip = req.query.zip || "85207"
  page = req.query.page || 2
  max_price = req.query.max_price || 200000
  url = "http://homeseekr.com/##{zip}/#{max_price}/#{page}"
  console.log url
  exec("ph screenshot.coffee #{url}") (err, ret) ->
    res.sendfile './screenshot.jpg'

app.get "/", (_req, res) ->
  req = _req
  zip = req.query.zip || "85207"
  page = req.query.page || 2
  max_price = req.query.max_price || 200000
  spark "/v1/listings", {
    _filter: "PostalCode Eq '#{zip}' And StandardStatus Eq 'Active' And ListPrice Le #{max_price}.0 And PropertyType Eq 'A'"
    _orderby:"-ListPrice"
    _limit: 10
    _page: page
  }, (err, data) ->
    listings = data.D.Results

    get_all_photos listings, ->
      res.send _.map listings, (listing) ->
        listing.StandardFields = _.pick listing.StandardFields,
          'BathsFull', 'BathsHalf', 'BathsTotal'
          'photos', 'BuildingAreaTotal'
          'UnparsedAddress', 
          'City', 'StateOrProvince', 'PostalCode'
          'StreetNumber','StreetDirPrefix', 'StreetName'
          'ListPrice', 'BedsTotal', 'PublicRemarks'
          'OnMarketDate', 'ListOfficeName'
          'CrossStreet'
        listing

    #res.send data.D.Results[0]




# spark "/v1/listings/20121025052627434500000000/photos", {}, (e, c) ->
# spark "/v1/listings/20120926181133810776000000/photos", {}, (e, c) ->
#   console.log c

app.listen 8502 
console.log 'listening'
