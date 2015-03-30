console.log("hello, lauren. you're liked to map_initialize.js");

var map;
//collect all the location inputs into an array
var locations = document.getElementsByClassName('location');

function setCenterNoGeoloc() {
  var nosupportpos = new google.maps.LatLng(51.512802, -0.091324);                     
  map.setCenter(nosupportpos);
};

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
      // browser supports geolocation, but latlng unavailable
      console.log("broswer supports geolocation, but it's turned off, defaulting center to London")
      setCenterNoGeoloc();
    });
  } else {
    // browser doesn't support geolocation
    console.log("broswer doesn't support geolocation, defaulting center to London");
    setCenterNoGeoloc();
  }

  $.each(locations, function(index, location){
    google.maps.event.addDomListener(location, 'focusout', function(event){
      console.log('focused out of location: ' + index);
      var input = $(this).val();
    });
  });  

}

google.maps.event.addDomListener(window, 'load', initialize);
