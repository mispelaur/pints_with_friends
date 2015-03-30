console.log("hello, lauren. you're liked to map_initialize.js");

var map;
//collect all the location inputs into an array
var locations = document.getElementsByClassName('location');


function setCenterNoGeoloc() {
  var nosupportpos = new google.maps.LatLng(51.512802, -0.091324);                     
  map.setCenter(nosupportpos);
};

function addMarker(map, inputAddress, locationNumber, markers) {
  console.log('inside addMarker function');
  debugger;
  if(/* inputAddress === undefined || */inputAddress !== markers[locationNumber][1]){
    // console.log("input address is (undefined?): " + inputAddress);
    console.log(inputAddress + " different to: " + markers[locationNumber][1]);

    //find out if there's an old marker to delete
    if(markers[locationNumber][1] === "placeholder") {
      // do nothing, there was no initial marker to delete
    }else{
      console.log("user has changed input for this location, so initial marker is deleted")
      //if statement added to fix bug: bug when user first inputs something that can't be geocoded... 
      if(markers[locationNumber][0]){
        markers[locationNumber][0].setMap(null);
      }
    };
    // showMarkerFromGeocoderResults
    var geocoder = new google.maps.Geocoder();
    var showMarkerFromGeocoderResults = function(results, status) {
      if (status == google.maps.GeocoderStatus.OK) {
        var position = results[0].geometry.location;
        var marker = new google.maps.Marker({
          map: map,
          position: position,
          // icon: 'http://maps.google.com/mapfiles/kml/paddle/wht-circle.png'
        });
      } else {
        console.log("oh no. you can't geocode that address!");
      }
      console.log("adding marker to array. locationNumber: " + locationNumber);

      //add marker to the markers array
      markers[locationNumber]=[marker, inputAddress];

      //reset the bounds of the map to accommodate new inputs
      var latlngbounds = new google.maps.LatLngBounds();
      for(i=0; i<markers.length; i++){
        if(markers[i][0] === "placeholder"){
          //do nothing, marker doesn't yet exist
        }else{
          latlngbounds.extend(new google.maps.LatLng(markers[i][0].position.k, markers[i][0].position.D));
        }
      }

      map.setOptions({ maxZoom: 13 });
      map.fitBounds(latlngbounds);
      map.setOptions({ maxZoom: null });
      
    };
    var geocoderOptions = { address: inputAddress };
    geocoder.geocode(geocoderOptions, showMarkerFromGeocoderResults);
  }else{
    console.log("user hasn't changed location input. no new marker needed.")
  }
}

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

  //create an (i by 2) multidimnsional placeholder array where i is number of locations input by user
  var markers = new Array(locations.length);
  for(i = 0; i < markers.length; i++){
      markers[i] = ["placeholder", "placeholder"];
  };

  //listen to each location, and when user done typing ('focusout'), call addMarker function
  $.each(locations, function(index, location){
    google.maps.event.addDomListener(location, 'focusout', function(event){
      console.log('focused out of location: ' + index);
      var input = $(this).val();

      if(input !== ""){
        console.log("calling addMarker funciton for location: " + index);
        addMarker(map, input, $(this).data('id'), markers);
      };
    });
  });  

}

google.maps.event.addDomListener(window, 'load', initialize);
