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
get_sq_ft = (l) ->
  if l.BuildingAreaTotal 
    """
      <div class="square-feet"> #{l.BuildingAreaTotal} square feet</div>
    """
  else
    ""
get_maps_link = (l) -> 
  if navigator?.userAgent?.match /iPhone|iPad|iPod/i 
    "http://maps.apple.com?q=#{l.UnparsedAddress}"
  else
    "https://maps.google.com?q=#{l.UnparsedAddress}"

listings_to_html = (listings, zip, max_price, page) ->
  html = _.map listings, (listing) ->
    l = listing.StandardFields
    # #{l.City} #{l.StateOrProvince} #{l.PostalCode}
    """
      <div class="listing">
        <div class="address"> 
          <a href="#{get_maps_link(l)}">
             #{l.StreetNumber} #{l.StreetDirPrefix or ""} #{l.StreetName}
          </a>
        </div>
        <div class="price"> #{accounting.formatMoney(l.ListPrice, "$", 0)} </div>
        <div class="cross-streets">#{l.CrossStreet}</div>
        <div class="photos">#{get_photo_html(l.photos)}</div>
        #{get_sq_ft(l)}
        <div class="baths"> #{get_bath_str(l)} </div>
        <div class="beds"> #{l.BedsTotal} bed - </div>
        <div class="description"> #{l.PublicRemarks} </div>
        <div class="on-market-date">On Market Date: #{l.OnMarketDate}</div>
        <div>Listing courtesy #{l.ListOfficeName}</div>
      </div>
    """

render = (listings, zip, max_price, page) ->
  console.log listings
  if listings.length == 0
    html = "no more listings"
    $(".next").hide()
  else
    html = listings_to_html listings, zip, max_price, page
    $(".next").show().attr "href", "##{zip}/#{max_price}/#{page - 0 + 1}"
  $(".listings").html html
  $("#under-price").text "under " + accounting.formatMoney max_price, "$", 0
  $('[name="max_price"]').val accounting.formatMoney max_price, "$", 0
  $("#in-zip").text "in " + zip
  $('[name="zip"]').val zip
  
$ ->
  Router = Backbone.Router.extend
    routes: 
      ":zip/:max_price/:page": 'search'
      ":zip/": 'search'
      "": 'redirect'

    search: (zip, max_price, _page) ->
      zip ||= "85203"
      max_price ||=  "200000"
      page = _page ||  "1"
      
      console.log zip, max_price, page
      max_price = max_price.replace /[^\d]/g, ""
      scrollTo 0,0
      $(".listings").empty().html """
        <img src="loader.gif" />
      """
      $.get "http://homeseekr.com:8502?zip=#{zip}&max_price=#{max_price}&page=#{page}&_ts=#{(new Date()).getTime()}", (listings) ->
        render listings, zip, max_price, page

    redirect: () ->
      router.navigate '85203/200000/1', trigger: true
  page = 1
  router = new Router
  Backbone.history.start()
  
  $("form").submit (e) ->
    e.preventDefault()
    zip = $("[name=zip]").val()
    max_price = $("[name=max_price]").val().replace /[^\d]/g, ""
    
    router.navigate "#{zip}/#{max_price}/1", trigger: true
    
    
  

