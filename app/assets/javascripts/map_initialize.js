console.log("hello, lauren. you're liked to map_initialize.js");

var map;

function initialize() {

  var mapOptions = {
    zoom: 13 
  };

  map = new google.maps.Map(document.getElementById('map-canvas'),
      mapOptions);

  //gets browser geolocation and sets it to center of the map
  if(navigator.geolocation) {
    console.log("broswer supports geolocation, centering map on user");
    navigator.geolocation.getCurrentPosition(function(position) {
      var pos = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
      map.setCenter(pos);
    }, function() {
      // Browser support Geolocation, but latlng unavailable
      console.log("broswer supports geolocation, but it's turned off")
      setCenterNoGeoloc();
    });
  } else {
    // Browser doesn't support Geolocation
    console.log("broswer doesn't support geolocation");
    var nosupportpos = new google.maps.LatLng(51.512802, -0.091324);                     
    map.setCenter(nosupportpos);
  }

}

google.maps.event.addDomListener(window, 'load', initialize);
