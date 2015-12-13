
var Demo = {
  // HTML Nodes
  mapContainer: document.getElementById('map-container'),
  dirContainer: document.getElementById('dir-container'),
  fromInput: document.getElementById('from-input'),
  toInput: document.getElementById('to-input'),
  // API Objects
  dirService: new google.maps.DirectionsService(),
  dirRenderer: new google.maps.DirectionsRenderer(),
  latestResults: null,
  map: null,
  showDirections: function(dirResult, dirStatus) {
    if (dirStatus != google.maps.DirectionsStatus.OK) {
      alert('Directions failed: ' + dirStatus);
      return;
    }
    // Show directions
    Demo.latestResults = dirResult;
    Demo.dirRenderer.setMap(Demo.map);
    Demo.dirRenderer.setPanel(Demo.dirContainer);
    Demo.dirRenderer.setDirections(dirResult);
  },
  getDirections: function() {
    var fromStr = Demo.fromInput.value;
    var toStr = Demo.toInput.value;
    var dirRequest = {
      origin: fromStr,
      destination: toStr,
      travelMode: google.maps.DirectionsTravelMode.BICYCLING,
      unitSystem: google.maps.DirectionsUnitSystem.METRIC,
      provideRouteAlternatives: true
    };
    Demo.dirService.route(dirRequest, Demo.showDirections);
  },
  init: function() {
    Demo.map = new google.maps.Map(Demo.mapContainer, {
      zoom: 14,
      center: {lat: 60.1860486, lng: 24.965601},
      mapTypeId: google.maps.MapTypeId.ROADMAP
    });
    // Show directions onload
    Demo.getDirections();
  }
};


var width = 130,
    height = 100,
    radius = Math.min(width, height) / 2;

var color = d3.scale.ordinal()
    .range(["green", "lightgray"]);

var arc = d3.svg.arc()
    .outerRadius(radius*0.75)
    .innerRadius(radius*0.55);

var arcOuter = d3.svg.arc()
    .outerRadius(radius*1.00)
    .innerRadius(radius*0.80);


var pie = d3.layout.pie()
    .sort(null)
    .value(function(d) { return d.val; });

google.maps.event.addListener(Demo.dirRenderer, 'routeindex_changed', 
  function() {
    var routeIndex = Demo.dirRenderer.getRouteIndex();
    var selectedDistance = Demo.latestResults.routes[routeIndex].legs[0].distance.value;

    var power_generated = Math.min(1, selectedDistance / 5000) * 100;
    var discount = power_generated * 0.4
    d3.select("div#energy").select("div#saved").text(power_generated.toFixed(2) + "% battery charged = ")
    d3.select("div#energy").select("div#discount").text(discount.toFixed(2) + "% discount !")
    d3.select("div#energy").select("div#pie").select("svg").remove()
    var svg = d3.select("div#energy").select("div#pie").append("svg")
      .attr("width", width)
      .attr("height", height)
      .append("g")
    .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

    var data = [{key: "savings", val: discount},
            {key: "other", val: 100 - discount}]

    data.forEach(function(d) {
      d.val = +d.val;
    });

    var g = svg.selectAll(".arc")
        .data(pie(data));

    g.enter().append("g")
        .attr("class", "arc")
        .append("path")
        .attr("d", function(d) {
          return (d.data.key == "savings" ? arcOuter : arc)(d);
        })
        .style("fill", function(d) { return color(d.data.key); });

});

$(function() {
  Demo.init()
});

document.getElementById("get-directions").addEventListener("click", function(){
    Demo.getDirections();
})