console.log("hello, lauren. you're liked to map_initialize.js");

var map;
//collect all the location inputs into an array
var locations = document.getElementsByClassName('location');
var transitInputs = document.getElementsByClassName('transit-type');

function setCenterNoGeoloc() {
  var nosupportpos = new google.maps.LatLng(51.512802, -0.091324);                     
  map.setCenter(nosupportpos);
};

function addMarker(map, inputAddress, locationNumber, markers) {
  console.log('inside addMarker function');
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

function calculateDistances(markers, modesOfTransit) {
  var travelTimes = {};
  var locationOne = markers[0][1];
  var locationTwo = markers[1][1];
  var service = new google.maps.DistanceMatrixService();
  service.getDistanceMatrix(
    {
      origins: [locationOne],
      destinations: [locationTwo],
      travelMode: google.maps.TravelMode[modesOfTransit[0]],
      unitSystem: google.maps.UnitSystem.METRIC,
    }, function(response, status) {
      callback(response, status, 0, travelTimes, markers)
    });
  
  service.getDistanceMatrix(
    {
      origins: [locationTwo],
      destinations: [locationOne],
      travelMode: google.maps.TravelMode[modesOfTransit[1]],
      unitSystem: google.maps.UnitSystem.METRIC,
    }, function(response, status) {
      callback(response, status, 1, travelTimes, markers)
    });

  // getStartPointForPlaceQuery(markers);

}

function callback(response, status, originLocationNumber, travelTimes, markers) {
  if (status != google.maps.DistanceMatrixStatus.OK) {
    console.log("couldn't calculate distance")
  } else {
    
    var seconds = response.rows[0].elements[0].duration.value;
    // console.log(seconds);
    travelTimes[originLocationNumber] = seconds;

  }

  if(travelTimes[0] && travelTimes[1]){
    getStartPointForPlaceQuery(markers, travelTimes);
    console.log(travelTimes);
  }
}

function getStartPointForPlaceQuery(markers, travelTimes){

  //bisection algorithm to determine approx how long two people traveling towards each other would take to meet
  //probably doesn't need to iterate 100 times - will look into this later
  var x = travelTimes[0];
  var y = travelTimes[1];

  var array = new Array(100);

  $.each(array, function(index, t){
    if(index === 0){
      var k = ((y*(x-y))/x);
      array[0] = k;
    } else {
      array[index] = ((y*(x-array[index-1]))/x);
    }
  });

  var timeToMiddle = array[99];
  var distOfTotalFromLocationOne = timeToMiddle/x

  console.log(timeToMiddle);
  console.log(distOfTotalFromLocationOne);


  var startPointForPlaceQuery = google.maps.geometry.spherical.interpolate(markers[0][0].Lf.Ba, markers[1][0].Lf.Ba, distOfTotalFromLocationOne);

  // console.log(startPointForPlaceQuery);
  returnPlaces(startPointForPlaceQuery);
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

  //create this dynamically based on number of locations?
  var modesOfTransit = {0:{}, 1:{}};

  $('#calculate').click(function(){
    //call addMarker function to add any pre-button-click input from user
    $.each(locations, function(index, location){
      if(location.value !==""){
        addMarker(map, location.value, index, markers);
      };
    });

    //collect mode of transit from user input
    $.each(transitInputs, function(index, transitType){
      var modeOfTransit = $(transitType.selectedOptions).data('transit')
      modesOfTransit[index] = modeOfTransit;
    })

    // console.log(modesOfTransit);
    //have access to populate markers and modesOfTransit objets in here, yay!
    calculateDistances(markers, modesOfTransit);
  });
  

}

google.maps.event.addDomListener(window, 'load', initialize);
