console.log("hello, lauren. you're liked to map_initialize.js");

var map;
//collect all the location inputs into an array
var locations = document.getElementsByClassName('location');
var transitInputs = document.getElementsByClassName('transit-type');
var destinationInputTypes = document.getElementsByClassName('destination-type');
var dateTimeInput = document.getElementById('meetup-date-time');

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

function calculateDistances(markers, modesOfTransit, destinationTypes) {
  // debugger;

  // var dateTime = document.getElementById('meetup-date-time').value;
  // "2015-04-09T19:00"

  // var dateTime = new Date('April 7, 2015 19:30:00');
  // var birthday = new Date(1995, 11, 17, 3, 24, 0);

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
      // transitOptions: {arrivalTime: dateTime}
    }, function(response, status) {
      callback(response, status, 0, travelTimes, markers, modesOfTransit, destinationTypes)
    });
  
  service.getDistanceMatrix(
    {
      origins: [locationTwo],
      destinations: [locationOne],
      travelMode: google.maps.TravelMode[modesOfTransit[1]],
      unitSystem: google.maps.UnitSystem.METRIC,
      // transitOptions: {arrivalTime: dateTime}
    }, function(response, status) {
      callback(response, status, 1, travelTimes, markers, modesOfTransit, destinationTypes)
    });

  // getStartPointForPlaceQuery(markers);

}

function callback(response, status, originLocationNumber, travelTimes, markers, modesOfTransit, destinationTypes) {

  if (status != google.maps.DistanceMatrixStatus.OK) {
    console.log("couldn't calculate distance")
  } else {
    
    var seconds = response.rows[0].elements[0].duration.value;
    // console.log(seconds);
    travelTimes[originLocationNumber] = seconds;

  }

  if(travelTimes[0] && travelTimes[1]){
    getStartPointForPlaceQuery(markers, travelTimes, modesOfTransit, destinationTypes);
    console.log(travelTimes);
  }
}

function getStartPointForPlaceQuery(markers, travelTimes, modesOfTransit, destinationTypes){
  //bisection algorithm to determine approx how long two people traveling towards each other would take to meet
  //probably doesn't need to iterate 10000 times - will look into this later

  if(travelTimes[0] > travelTimes[1]){
    var x = travelTimes[0];
    var y = travelTimes[1];
  } else {
    var x = travelTimes[1];
    var y = travelTimes[0];
  }

  var array = new Array(10000);

  $.each(array, function(index, t){
    if(index === 0){
      var k = ((y*(x-y))/x);
      array[0] = k;
    } else {
      array[index] = ((y*(x-array[index-1]))/x);
    }
  });

  var timeToMiddle = array[9999];

  if(travelTimes[0] > travelTimes[1]){
    var distOfTotalFromLocationOne = timeToMiddle/x
  } else {
    var distOfTotalFromLocationOne = timeToMiddle/y
  }

  var startPointForPlaceQuery = google.maps.geometry.spherical.interpolate(markers[0][0].Lf.Ba, markers[1][0].Lf.Ba, distOfTotalFromLocationOne);

  // console.log(startPointForPlaceQuery);
  collectDestinations(startPointForPlaceQuery, markers, modesOfTransit, destinationTypes);
}

function collectDestinations(startPoint, markers, modesOfTransit, destinationTypes){
  //must think about how to get this to keep finding places until returns 20?

  var request = {
    location: startPoint,
    radius: 1000,
    types: destinationTypes
  };
  var service = new google.maps.places.PlacesService(map);
  // service.radarSearch(request, function(results, status){
  //   debugger;
  //   destinationsCallback(results, status, markers);

  // })
  service.nearbySearch(request, function(results, status) {
    // debugger;
    destinationsCallback(results, status, markers, modesOfTransit);
  });

}

function destinationsCallback(results, status, markers, modesOfTransit) {
  //results is the google name for the returned list of places

  if (status == google.maps.places.PlacesServiceStatus.OK) {

    var a = markers[0][1];
    var b = markers[1][1];
    var travelTimesObject = {0:{}, 1:{}};

    $.each(results, function(i, result) {
      var service = new google.maps.DistanceMatrixService();
      service.getDistanceMatrix(
        {
          origins: [a],
          destinations: [results[i].geometry.location],
          travelMode: google.maps.TravelMode[modesOfTransit[0]],
          unitSystem: google.maps.UnitSystem.METRIC,
        }, function(response, status) {     
          travelTimesBuilderCallback(response, status, 0, i, results[i].name, results.length, travelTimesObject, results);
        });

      service.getDistanceMatrix(
        {
          origins: [b],
          destinations: [results[i].geometry.location],
          travelMode: google.maps.TravelMode[modesOfTransit[1]],
          unitSystem: google.maps.UnitSystem.METRIC,
        }, function(response, status) {
          travelTimesBuilderCallback(response, status, 1, i, results[i].name, results.length, travelTimesObject, results);
        });
    });

  }
}

function travelTimesBuilderCallback(response, status, originLocationNumber, placeIndex, name, numberOfPlaces, travelTimesObject, results) {
  if (status != google.maps.DistanceMatrixStatus.OK) {
    console.log("couldn't calculate distance")
  } else {
    var seconds = response.rows[0].elements[0].duration.value;
    // travelTimesObject[originLocationNumber][placeIndex + " " + name] = seconds;
    travelTimesObject[originLocationNumber][placeIndex] = seconds;
  }
  //if this function has been called for the last time, rank the placed by computing the sum of squares
  if (Object.keys(travelTimesObject[0]).length === results.length && Object.keys(travelTimesObject[1]).length === results.length){
    rankPlacesByTravelTimeFairness(travelTimesObject, results);
  }
}

function rankPlacesByTravelTimeFairness(travelTimesObject, results){
  // taking the sum of the squares of each place - will take into account both the absolute times and the distribution of times
  // debugger;
  console.log("Time to rank places by travel-time fairness.")
  var sumSquares = {};
  Object.keys(travelTimesObject[0]).forEach(function(key) {
    var a = travelTimesObject[0][key]*travelTimesObject[0][key];
    var b = travelTimesObject[1][key]*travelTimesObject[1][key];
    sumSquares[key] = a+b;
  });
  //sort ascending by values = ranking places shortest total travel time and fairness
  rankedDestinations = Object.keys(sumSquares).sort(function(a,b){
    return sumSquares[a]-sumSquares[b];
  });
  console.log(rankedDestinations);
  addResultsMarkers(rankedDestinations, results, travelTimesObject);
}

function addResultsMarkers(rankings, placesObject, travelTimesObject) {

  // debugger;

  console.log('inside addResultsMarkers function');
  //add top 5 choices to the map


  for(i=0; i<5 && i<placesObject.length; i++){

    var colors = ['#ffff00', 'white', 'white', 'white', 'white'];
    var zIndex = [2000, 1000, 1000, 1000, 1000];

    var choice = parseInt(rankings[i]);
    var position = placesObject[choice].geometry.location;
    var title = placesObject[choice].name;
    var contentstring = '<div id="content">'+
      '<h1 class="info-window-heading">'+ placesObject[choice].name +'</h1>'+
      '<div id="info-window-content">'+
      '<p>' + placesObject[choice].types[0] + '/' + placesObject[choice].types[1] + '</p>' +
      '<p>' + placesObject[choice].vicinity + '</p>' +
      '<p>' + placesObject[choice].rating + ' stars from google users!</p>' +
      '<p>' + Math.round(travelTimesObject[0][choice]/60) + ' minutes from location 1</p>' +
      '<p>' + Math.round(travelTimesObject[1][choice]/60) + ' minutes from location 2</p>' +
      '</div>'+
      '</div>';
    var infowindow = new google.maps.InfoWindow({
        content: contentstring
    });
    var resultsMarker = new google.maps.Marker({
      map: map,
      position: position,
      animation: google.maps.Animation.DROP,
      title: title,
      infowindow: infowindow,
      zIndex: zIndex[i],
      icon: {
            // Star
            path: 'M 0,-24 6,-7 24,-7 10,4 15,21 0,11 -15,21 -10,4 -24,-7 -6,-7 z',
            fillColor: colors[i],
            fillOpacity: 1,
            scale: 1.5/4,
            strokeColor: '#bd8d2c',
            strokeWeight: 1
          }
    });

    google.maps.event.addListener(resultsMarker, 'click', function() {
      this.infowindow.open(map, this);
    });

  }

  $(".trigger-list-view").show();
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
  var destinationTypes = []

  $('#calculate').click(function(){
    //call addMarker function to add any pre-button-click input from user
    // var dateTime = document.getElementById('meetup-date-time').value;

    var addMarkerPromise = new Promise(function(resolve, reject){
      $.each(locations, function(index, location){
        if(location.value !==""){
          addMarker(map, location.value, index, markers);
        };
      });
      resolve(markers);
    });

    //collect mode of transit from user input
    $.each(transitInputs, function(index, transitType){
      var modeOfTransit = $(transitType.selectedOptions).data('transit')
      modesOfTransit[index] = modeOfTransit;
    })

    $.each(destinationInputTypes, function(index, destinationType){
      if(destinationType.checked){
        destinationTypes.push(destinationType.id);
      }
    })
    debugger;

    addMarkerPromise.then(function(result){
      console.log("inside addMarkerPromise");
      console.log(result);
      return result;
    })
    // console.log(modesOfTransit);
    // console.log(markers);
    //have access to populate markers and modesOfTransit objets in here, yay!
    // debugger;

    // Promise.all([addMarkerPromise]).then(function(result){
      // debugger;
      // calculateDistances(result, secondargument);
    // })

    addMarkerPromise.then(function(result){
      debugger;
    })
    // debugger;
    calculateDistances(markers, modesOfTransit, destinationTypes);
  });

  $("#slide-from-right-button").click(function (e) {
    e.preventDefault();
    console.log('sliide')
      $('#slide-left').toggle('slide', {direction: 'right'}, 2000);
  });

}

google.maps.event.addDomListener(window, 'load', initialize);
