var doc_counts = []; // use to determine range of values
var CHICAGO_BOUNDS = [[-88.06772634970588, 41.633982748547226],[-87.39652483669637, 42.033534968014294]];
function fillWindowWithMapElem() {
  var elem = document.getElementById('map');
  elem.style.height = window.innerHeight;
  elem.style.width = window.innerWidth;
}

function loadDocumenterData(map) {
  Tabletop.init( { key: 'https://docs.google.com/spreadsheets/d/1tsyas-U9W1S9DdfnvFDA-VXESasRA37vnY6fWp-NeGU/pubhtml?gid=912682141&single=true',
                    simpleSheet: true,
                    callback: function(data, tabletop) {
                      loadCommAreas(data, map);
                    }});
}

function merge_data(documenter_data, map_data) {
  var documenters_by_commarea = {};
  for (var i = 0; i < documenter_data.length; i++) {
    var commarea = documenter_data[i].commarea,
        documenters = documenter_data[i].documenters;
    if (commarea) {
      documenters_by_commarea[commarea] = parseInt(documenters);
    }
  }
  var features = map_data.features;
  for (var i = 0; i < features.length; i++) {
    var ca = features[i];
    var documenters = documenters_by_commarea[ca.properties.area_num_1] || 0;
    ca.properties.documenters = documenters;
    doc_counts.push(documenters);
  }
  return map_data;
}

function loadCommAreas(documenter_data, map) {

  var request = new XMLHttpRequest();
  request.open('GET', 'chicago-commareas.geojson', true);

  request.onload = function() {
    if (request.status >= 200 && request.status < 400) {
      var map_data = JSON.parse(request.responseText);
      window.data = merge_data(documenter_data, map_data);
      map.addSource('commareas', {
          type: 'geojson',
          data: data
      });
      map.addLayer({
        "id": "commareas-line",
        "type": "line",
        "source": "commareas",
        "paint": {
          "line-color": "#ababab",

        }
      })
      map.addLayer({
          "id": "commareas-fill",
          "type": "fill",
          "source": "commareas",
          "paint": {
              "fill-color": {
                property: 'documenters',
                stops: [
                    [0, '#ffffff'],
                    [1, '#EED322'],
                    [2, '#E6B71E'],
                    [3, '#DA9C20'],
                    [6, '#CA8323'],
                    [9, '#B86B25'],
                    [12, '#A25626']
                ]
              },
              "fill-opacity": 0.4
          }
      });
      var popup = new mapboxgl.Popup({
          closeButton: false,
          closeOnClick: false
      });

      function removePopup() {
        map.getCanvas().style.cursor = '';
        popup.remove();
      }

      map.on('mousemove', function (e) {
          var features = map.queryRenderedFeatures(e.point);
          for (var i = 0; i < features.length; i++) {
            if (features[i].layer.id == 'commareas-fill') {
                  map.getCanvas().style.cursor = 'pointer';
                  // Populate the popup and set its coordinates
                  // based on the feature found.
                  var documenter_str = (features[i].properties.documenters == 1)
                                        ? "1 documenter"
                                        : features[i].properties.documenters + " documenters";
                  popup.setLngLat(e.lngLat)
                      .setHTML("<div class='community'>" + features[i].properties.community.toLowerCase()
                             + "</div><p>" + documenter_str + "</p>")
                      .addTo(map);
                  return;
            }
            removePopup();
          }
      });
      map.on('mouseout', function (e) {
        removePopup();
      });
      //
      // map.on('mouseenter', 'commareas-fill', function(e) {
      //     // Change the cursor style as a UI indicator.
      //     console.log('mouseenter',e.features[0].properties.community);
      // });
      //
      // map.on('mouseleave', 'commareas-fill', function() {
      //     console.log('mouseleave');
      // });
    } else {
      console.log('onload error: ' + request.status);
      console.log(request);
    }
  };

  request.onerror = function() {
    console.log('onerror',arguments);
  };

  request.send();

}



mapboxgl.accessToken = 'pk.eyJ1IjoiY2l0eWJ1cmVhdSIsImEiOiJjajQ2ODRpcHMwcjNnMzNwZWVsNWNwdTNyIn0.1V-BmkrLTKkXheyhFrFF1w';
fillWindowWithMapElem();
window.addEventListener('resize', fillWindowWithMapElem);
if (!mapboxgl.supported()) {
    alert('Your browser does not support Mapbox GL');
} else {
  var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/light-v9',
    trackResize: true
  });
  map.fitBounds(CHICAGO_BOUNDS);
  map.on('load', function() {
    loadDocumenterData(map);
  })
}
