// Get the modules
var GeoJSON = ol.format.GeoJSON; 
var Feature = ol.Feature; 
var Map = ol.Map; 
var View = ol.View; 
var TileLayer = ol.layer.Tile, VectorLayer = ol.layer.Vector; 
var CircleStyle = ol.style.Circle, Fill = ol.style.Fill, Stroke = ol.style.Stroke, Style = ol.style.Style;
var VectorSource = ol.source.Vector, OSM = ol.source.OSM, BingMaps = ol.source.BingMaps;
var Circle = ol.geom.Circle; 
var Overlay = ol.Overlay;
var {useGeographic} = ol.proj;
var {toLonLat} = ol.proj;
var {toStringHDMS} = ol.coordinate;
var TileWMS = ol.source.TileWMS;

// The OSM XML is in geographic coordinate system so we have to set the flag
useGeographic();

const format = new GeoJSON();

// This function calculates the style from the GeoJSON features
const styleFunction = function (feature) {
    // Get the timestamp tag in the GeoJSON and parse it as a date
    var rawtime = new Date(feature.get("timestamp"));
    var theYear = rawtime.getFullYear(); // We are only interested in the year
    var currentYear = new Date().getFullYear();
    var colourValue = 255-255*(currentYear-theYear)/(currentYear-2007);

    // Make sure irrelevant data doesn't cover up the relevant data
    var opacityValue = 1;
    if(currentYear-theYear<4) {
        opacityValue = 0.1;
    }
    
    // Formulate a style
    const styles = {
        'Point': new Style({
            image: new CircleStyle({
                radius: 3,
                fill: new Fill({color: 'rgba(255,'+colourValue+','+colourValue+','+opacityValue+')',
                }),
                stroke: new Stroke({color: 'rgba(255,255,255,'+opacityValue+')', width: 1}),
            }),
        }),
        'LineString': new Style({
            stroke: new Stroke({
                width: 4,
                color: 'rgb(255,'+colourValue+','+colourValue+')',
            }),
        }),
    };
    return styles[feature.getGeometry().getType()];
};


// Handle visualising different highway tags for the surfaces map
const styleFunction2 = function (feature) {
    var highwayType2 = feature.get("highway");
    var opacityValue='1';
    if (minormajor.checked){
        opacityValue='0.1';
    }
    const styles2 = {
        'service': new Style({
            stroke: new Stroke({
                color: 'rgba(50, 50, 50,'+opacityValue+')',
                width: 2,
            }),
        }),
        'track': new Style({
            stroke: new Stroke({
                color: 'rgba(50, 50, 50,'+opacityValue/2+')',
                width: 2,
                lineDash: [8,8],
            }),
        }),
        'residential': new Style({
          stroke: new Stroke({
            color: 'rgba(50, 50, 50, 1.0)',
            width: 3,
          }),
        }),
        'unclassified': new Style({
          stroke: new Stroke({
            color: 'rgba(50, 50, 50, 1.0)',
            width: 3,
          }),
        }),
        'trunk': new Style({
          stroke: new Stroke({
            color: 'rgba(255, 0, 0, 1.0)',
            width: 4,
          }),
        }),
        'trunk_link': new Style({
            stroke: new Stroke({
              color: 'rgba(255, 0, 0, 1.0)',
              width: 3,
            }),
          }),
        'motorway': new Style({
            stroke: new Stroke({
              color: 'rgba(255, 0, 0, 1.0)',
              width: 4,
            }),
          }),
        'motorway_link': new Style({
            stroke: new Stroke({
              color: 'rgba(255, 0, 0, 1.0)',
              width: 3,
            }),
        }),
        'footway': new Style({
          stroke: new Stroke({
            color: 'rgba(50, 50, 50, '+opacityValue+')',
            width: 1,
          }),
        }),
        'steps': new Style({
            stroke: new Stroke({
              color: 'rgba(50, 50, 50, '+opacityValue+')',
              width: 1,
            }),
        }),
        'path': new Style({
            stroke: new Stroke({
              color: 'rgba(50, 50, 50, '+opacityValue/2+')',
              width: 1,
              lineDash: [5,5],
            }),
        }),
        'tertiary': new Style({
          stroke: new Stroke({
            color: 'rgba(200, 200, 0, 1.0)',
            width: 4,
          }),
        }),
        'tertiary_link': new Style({
            stroke: new Stroke({
              color: 'rgba(200, 200, 0, 1.0)',
              width: 3,
            }),
          }),
        'primary': new Style({
          stroke: new Stroke({
            color: 'rgba(255, 60, 255, 1.0)',
            width: 4,
          }),
        }),
        'primary_link': new Style({
            stroke: new Stroke({
              color: 'rgba(255, 60, 255, 1.0)',
              width: 3,
            }),
          }),
    };
    return styles2[highwayType2];
}

// Placeholder vector layers that we will update later
const vector2 = new VectorLayer({
    title: 'Vertex Geometry',
    source: new VectorSource({
        attributions: null,
    }),
    style: styleFunction,
});
const vector1 = new VectorLayer({
    title: 'Line Geometry',
    source: new VectorSource({
        attributions: null,
    }),
    style: styleFunction,
});

const vectorSurface = new VectorLayer({
    title: 'Road Surfaces',
    source: new VectorSource({
        attributions: null,
    }),
    style: styleFunction2,
});

// SA Basemap WMS
const samap = new TileLayer({
    //extent: [14360419,-4588180,15696357,-2998632],
    source: new TileWMS({
        url: 'http://157.245.201.158:8080/geoserver/wms',
        params: {
            'LAYERS': 'LeGras:LandUseGeneralised2022_GDA2020',
            'VERSION': '1.1.1',
            'FORMAT': 'image/png',
            tiled: true,
        },
        //projection: 'EPSG:3857',
        serverType: 'geoserver',
        attributions: '<a href="https://data.sa.gov.au/data/dataset/land-use-generalised">&copy; SA Department for Trade and Investment</a>',
    }),
});

// OSM Basemap
const osmStandard = new TileLayer({
    visible: false,
    title: 'OSM Standard',
    type: 'base',
    source: new OSM(),
});
const attributions = '<a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap contributors</a>';

// Carto DB Positron
const cartodb_positron = new TileLayer({
    title: 'OSM CartoDB Positron',
    type: 'base',
    source: new ol.source.XYZ({
        url: 'http://s.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
        attributions: '&copy; <a href="http://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors, &copy; <a href="http://cartodb.com/attributions" target="_blank">CartoDB</a>'
    })
});

// Bing
const bing = new TileLayer({
    visible: false,
    title: 'Bing Maps Aerial',
    type: 'base',
    preload: Infinity,
    source: new BingMaps({
      key: 'AnbdFs0mRHdd9QBYjzoeCXiZGbyCyEbGjlVuXr6VNcT1EPC4gnTH6wRH3ByPkGY8',
      imagerySet: 'Aerial',
      placeholderTiles: false,
    }),
});

// Bing but visible by default
const bing2 = new TileLayer({
    visible: true,
    title: 'Bing Maps Aerial',
    type: 'base',
    preload: Infinity,
    source: new BingMaps({
      key: 'AnbdFs0mRHdd9QBYjzoeCXiZGbyCyEbGjlVuXr6VNcT1EPC4gnTH6wRH3ByPkGY8',
      imagerySet: 'Aerial',
      placeholderTiles: false,
    }),
});

// Popup elements

const container = document.getElementById('popup');
const content = document.getElementById('popup-content');
const closer = document.getElementById('popup-closer');
const container2 = document.getElementById('popup2');
const content2 = document.getElementById('popup-content2');
const closer2 = document.getElementById('popup-closer2');

// Popup OL overlays
const overlay = new Overlay({
element: container,
autoPan: {
    animation: {
    duration: 250,
    },
},
});

const overlay2 = new Overlay({
    element: container2,
    autoPan: {
        animation: {
        duration: 250,
        },
    },
    });

// Handle click event for closing the overlay popup
closer.onclick = function () {
overlay.setPosition(undefined);
closer.blur();
return false;
};

closer2.onclick = function () {
    overlay2.setPosition(undefined);
    closer2.blur();
    return false;
    };

// The actual maps
// Obsolete roads map element
map = new Map({
    layers: [
        new ol.layer.Group({
            title: 'Base maps',
            layers: [bing, osmStandard, cartodb_positron,]
        }), 
        vector1, vector2,
    ],
    target: 'map',
    view: new View({
        center: [133.5,-28.8],
        maxZoom: 20,
        zoom: 3.8,
    }),
    overlays: [overlay],
});

// Road surfaces map element
map2 = new Map({
    layers: [
        new ol.layer.Group({
            title: 'Base maps',
            layers: [bing, osmStandard, cartodb_positron,]
        }),
        vectorSurface,],
    target: 'map2',
    view: new View({
        center: [133.5,-28.8],
        maxZoom: 20,
        zoom: 3.8,
    }),
    overlays: [overlay2],
});

// South Australia map element
map3 = new Map({
    layers: [
        new ol.layer.Group({
            title: 'Base maps',
            layers: [osmStandard,bing2]
        }),
        samap,],
    target: 'map3',
    view: new View({
        center: [134.5,-32.5],
        maxZoom: 20,
        zoom: 5,
    }),
    //overlays: [overlay2],
}); 

// Create popup when you click a loaded vector feature
map.on("click", function(e) {
    map.forEachFeatureAtPixel(e.pixel, function (feature, layer) {
        var rawtime = new Date(feature.get("timestamp"));
        var theYear = rawtime.getFullYear();
        const coordinate = e.coordinate;
        var featureName = feature.get("name");
        if (featureName==null) {
        featureName = feature.get("id").replace("/"," ");
        featureName = featureName[0].toUpperCase()+featureName.slice(1);
        }
        content.innerHTML = featureName +" was last edited in "+theYear+". <br /> <a target='_blank' href='https://www.openstreetmap.org/edit?"+feature.get("id").replace("/","=")+"'>✏️ Edit in OpenStreetMap</a>";
        overlay.setPosition(coordinate);
    });
});

map2.on("click", function(e) {
    map2.forEachFeatureAtPixel(e.pixel, function (feature, layer) {
        var highwayType2 = feature.get("highway");
        const coordinate = e.coordinate;
        var featureName = feature.get("name");
        if (featureName==null) {
        featureName = feature.get("id").replace("/"," ");
        featureName = featureName[0].toUpperCase()+featureName.slice(1);
        }
        content2.innerHTML = featureName +" (<code>"+highwayType2+"</code>) has no surface tag! <br /> <a target='_blank' href='https://www.openstreetmap.org/edit?"+feature.get("id").replace("/","=")+"'>✏️ Edit in OpenStreetMap</a>";
        overlay2.setPosition(coordinate);
    });
});

// Display or remove the loading spinner
map.on('loadstart', function () {
    map.getTargetElement().classList.add('spinner');
});
map.on('loadend', function () {
    map.getTargetElement().classList.remove('spinner');
});
map2.on('loadstart', function () {
    map2.getTargetElement().classList.add('spinner');
});
map2.on('loadend', function () {
    map2.getTargetElement().classList.remove('spinner');
});
map3.on('loadstart', function () {
    map3.getTargetElement().classList.add('spinner');
});
map3.on('loadend', function () {
    map3.getTargetElement().classList.remove('spinner');
});

// This function handles the user input stuff (form submission, API requests etc until generation of the vector layer). It is an asynchronous function because we have to wait for a response from the APIs we are using (Nominatim and Overpass)
async function nominatimQuery(e){
    e.preventDefault(); // Prevents the page reloading when form submitted

    // Add the loading spinner
    map.getTargetElement().classList.add('spinner');

    // Get the user inputs
    var form = document.forms["location"];
    var locationString=form["locationString"].value;
    var highwayType=form["geometryLevel"].value;
    var geometryType=form["nodeway"].value;
    // Basic error handling if user submits empty string
    if (locationString=="") {
        alert("You must enter a suburb or postcode");
        map.getTargetElement().classList.remove('spinner');
        return;
    }
    // Get the OSM town relation ID by feeding in the suburb string into Nominatim API
    if (locationString.includes("relation:")) { //Fallback feature allows user to type relation:1234567 manually
        locationString = locationString.replace ( /[^\d.]/g, '' );
        var theRelation = parseInt(locationString);
    } else {
        const nominatimURL = new URL("https://nominatim.openstreetmap.org/search?")
        nominatimURL.search = new URLSearchParams({
            q: locationString,
            format: "geojson"
        });
        const response = await fetch(nominatimURL);
        const json = await response.json();
        try {
            var theRelation = JSON.stringify(json.features[0].properties.osm_id);
        }
        catch (err) {
            alert("Error: "+err.message+"\nI couldn't find that place. Please review the spelling or enter the OSM relation manually in the format: relation:123456");
            map.getTargetElement().classList.remove('spinner');
            return;
        }
    }
    // Constructing the Overpass query based on the user input
    const queryHighway = {
        path: 'way[highway=footway](area.a);way[highway=path](area.a);way[highway=cycleway](area.a);way[highway=steps](area.a);',
        service: 'way[highway=track](area.a);way[highway=service](area.a);',
        minor: 'way[highway=pedestrian](area.a);way[highway=residential](area.a);way[highway=unclassified](area.a);',
        major: 'way[highway=tertiary](area.a);way[highway=secondary](area.a);way[highway=primary](area.a);way[highway=trunk](area.a);way[highway=motorway](area.a);',
    };
    const queryGeometry = {
        node: "node(w);out meta;",
        way: "(._;>;);out meta;",
    };

    // Get the metadata of all the roads contained within the relation using Overpass API
    const overpassQuery = new URL("https://overpass-api.de/api/interpreter?")
    overpassQuery.search = new URLSearchParams({
        data: "rel(" + theRelation + ");map_to_area->.a;("+queryHighway[highwayType]+");"+ queryGeometry[geometryType],
    });
    const overpassResponse = await fetch(overpassQuery);
    if(overpassResponse.status==400) {
        alert("Error 400: Bad request\nProbably the relation number supplied to Overpass was invalid.");
        map.getTargetElement().classList.remove('spinner');
        return;
    } else if (!overpassResponse.ok) {
        alert("Error "+overpassResponse.status+": "+overpassResponse.statusText+"\nAn unknown error occurred. Maybe Overpass is not responding.");
        map.getTargetElement().classList.remove('spinner');
        return;
    }
    // Parse the XML
    const xmlText = await overpassResponse.text();
    const xml = await (new window.DOMParser()).parseFromString(xmlText, "text/xml");

    // Finished loading
    map.getTargetElement().classList.remove('spinner');

    // Convert the OSM XML to GeoJSON because Openlayers does not support OSM metadata tags
    const geojson = osmtogeojson(xml);

    // Put the new GeoJSON object into vector features for Openlayers
    const vectorSource = new VectorSource({
        features: new GeoJSON().readFeatures(geojson),
    });

    // Update the existing vector layer with the new source
    if (geometryType == 'node') {
        vector2.setSource(vectorSource);
        try {
            map.getView().fit(vectorSource.getExtent());
        }
        catch(err) {
            alert("Error:"+err.message+"\nNo features have been found! Most likely the correct OSM relation was not received. You can type the correct relation manually in the format: relation:123456");
            return;
        }

    }
    if (geometryType == 'way') {
        vector1.setSource(vectorSource);
        try {
            map.getView().fit(vectorSource.getExtent());
        }
        catch(err) {
            alert("Error:"+err.message+"\nNo features have been found! Most likely the correct OSM relation was not received. You can type the correct relation manually in the format: relation:123456");
            return;
        }
    }

    const features = vectorSource.getFeatures();
    console.log(features);

    //plotJson(geojson);
}

// This function duplicates the previous for road surface. There is probably a lot of redundant code here I could have split into smaller functions.
async function nominatimQuery2(e){
    e.preventDefault(); // Prevents the page reloading when form submitted

    // Add the loading spinner
    map2.getTargetElement().classList.add('spinner');

    // Get the user inputs
    var form = document.forms["location2"];
    var locationString=form["locationString2"].value;

    if (locationString=="") {
        alert("You must enter a suburb or postcode");
        map2.getTargetElement().classList.remove('spinner');
        return;
    }
    if (locationString.includes("relation:")) { //Fallback feature allows user to type relation:1234567 manually
        locationString = locationString.replace ( /[^\d.]/g, '' );
        var theRelation = parseInt(locationString);
    } else {
        const nominatimURL = new URL("https://nominatim.openstreetmap.org/search?")
        nominatimURL.search = new URLSearchParams({
            q: locationString,
            format: "geojson"
        })
        const response = await fetch(nominatimURL);
        const json = await response.json();
        try {
            var theRelation = JSON.stringify(json.features[0].properties.osm_id);
        }
        catch (err) {
            alert("Error: "+err.message+"\nI couldn't find that place. Please review the spelling or enter the OSM relation manually in the format: relation:123456");
            map2.getTargetElement().classList.remove('spinner');
            return;
        }
    }

    // Get the metadata of all the roads contained within the relation using Overpass API
    const overpassQuery = new URL("https://overpass-api.de/api/interpreter?")
    overpassQuery.search = new URLSearchParams({
        data: 'rel('+theRelation+');map_to_area->.a;way[highway][!surface](area.a);(._;>;);out body;',
        //"rel(" + theRelation + ");map_to_area->.a;("+queryHighway[highwayType]+");"+ queryGeometry[geometryType],
    })
    const overpassResponse = await fetch(overpassQuery);
    if(overpassResponse.status==400) {
        alert("Error 400: Bad request\nProbably the relation number supplied to Overpass was invalid.");
        map2.getTargetElement().classList.remove('spinner');
        return;
    } else if (!overpassResponse.ok) {
        alert("Error "+overpassResponse.status+": "+overpassResponse.statusText+"\nAn unknown error occurred. Maybe Overpass is not responding.");
        map2.getTargetElement().classList.remove('spinner');
        return;
    }
    // Parse the XML
    const xmlText = await overpassResponse.text();
    const xml = await (new window.DOMParser()).parseFromString(xmlText, "text/xml");

    // Finished loading
    map2.getTargetElement().classList.remove('spinner');

    // Convert the OSM XML to GeoJSON because Openlayers does not support OSM metadata tags
    const geojson = osmtogeojson(xml);
    // Put the new GeoJSON object into vector features for Openlayers
    const vectorSource = new VectorSource({
        features: new GeoJSON().readFeatures(geojson),
    });

    // Update the existing vector layer with the new source
    vectorSurface.setSource(vectorSource);

    // Fly the map to the new data
    try {
        map2.getView().fit(vectorSource.getExtent());
    }
    catch(err) {
        alert("Error:"+err.message+"\nNo features have been found! Most likely the correct OSM relation was not received. You can type the correct relation manually in the format: relation:123456");
        return;
    }

} 

// Layer switcher
var layerSwitcher = new LayerSwitcher({
       reverse: true,
       groupSelectStyle: 'group'
    });
var layerSwitcher2 = new LayerSwitcher({
        reverse: true,
        groupSelectStyle: 'group'
      });
var layerSwitcher3 = new LayerSwitcher({
        reverse: true,
        groupSelectStyle: 'group'
    });
map.addControl(layerSwitcher);
map2.addControl(layerSwitcher2);
map3.addControl(layerSwitcher3);

// Download and Clear buttons for vector data
// Hide the download buttons until there is vector data loaded
tools.style.visibility='hidden';
toolsVintage.style.visibility='hidden';

// Clear button for Surfaces map
const clear = document.getElementById('clear');
clear.addEventListener('click', function () {
    const theFeatureSource = vectorSurface.getSource();
    theFeatureSource.clear();
    tools.style.visibility='hidden';
});

// Download button for Surfaces map
const download = document.getElementById('download');
vectorSurface.on('change', function () {
    tools.style.visibility='visible'; 
    const theFeatureSource = vectorSurface.getSource();
    const features = theFeatureSource.getFeatures();
    //if(features.length==0){
    //    alert("Error: No features have been found! Most likely the correct OSM relation was not received. You can type the correct relation manually in the format: relation:123456");
    //}
    const json = format.writeFeatures(features);
    download.href = 'data:application/json;charset=utf-8,' + encodeURIComponent(json);
});

// Clear button for Obsolete roads map
const clear_vintage = document.getElementById('clearVintage');
clear_vintage.addEventListener('click', function () {
    vector1.getSource().clear();
    vector2.getSource().clear();
    toolsVintage.style.visibility='hidden';
});

// The download button for obsolete roads should have a date filter rather than just download all the geometry, which would be useless. 
// I have opted to use a slider.
// When the slider is changed, update the HTML and also rerun the function that preloads the download data
var sliderValue = document.getElementById("yearSlider"), sliderDiv = document.getElementById("sliderAmount");
yearSlider.max=new Date().getFullYear().toString();
sliderValue.onchange = function () {
    sliderDiv.innerHTML = this.value;
    if (wayradio.checked) {
        vintageDownloader(vector1);
    } else {
        vintageDownloader(vector2);
    }
}

// The original radio button we used for the query can be used to select what you download. This is useful if you have both lines and vertices loaded in.
var radiobuttonValue1 = document.getElementById("wayradio"), radiobuttonValue2 = document.getElementById("noderadio");
radiobuttonValue1.onchange = function () {
    if (wayradio.checked) {
        vintageDownloader(vector1);
    } else {
        vintageDownloader(vector2);
    }
}
// For some reason the onchange listener does not fire if the radio button is changed from "true" to "false". Not sure why. so we have to listen to the other button too
radiobuttonValue2.onchange = function () {
    if (wayradio.checked) {
        vintageDownloader(vector1);
    } else {
        vintageDownloader(vector2);
    }
}

// Rerun the function if the layer visibility or query is changed
const download_vintage = document.getElementById('downloadVintage');
vector1.on('change', function() {
    toolsVintage.style.visibility='visible'; 
    vintageDownloader(vector1);
});
vector2.on('change', function() {
    toolsVintage.style.visibility='visible'; 
    vintageDownloader(vector2);
});

// The actual downloading function for obsolete roads! Here at last. The code is adapted from the Openlayers download button tutorial though modified quite heavily
function vintageDownloader(layer) {
    const theFeatureSource = layer.getSource();
    const features = theFeatureSource.getFeatures();
    var numFeatureUpdater = document.getElementById("numFeatures");
    var found = [];
    // Filter the found geometry by the slider value, look through all the features and append it to the array
    for (var i = 0, ii = features.length; i < ii; i++) {
        if (new Date(features[i].get("timestamp")).getFullYear() < parseInt(yearSlider.value)) {
            found.push(features[i]);
        }
    }
    // Update the HTML with the number of matches so the user knows they are not just downloading an empty file
    if (layer == vector1) {
        numFeatureUpdater.innerHTML = found.length + " lines found";
    } else {
        numFeatureUpdater.innerHTML = found.length + " vertices found";
    }
    
    const json = format.writeFeatures(found); // Write the features as GeoJSON
    download_vintage.href = 'data:application/json;charset=utf-8,' + encodeURIComponent(json);
}

//plotJson(geojson_object);
// I was intending for this to display a histogram of the timestamps but it was difficult to implement. It worked but scaling the bins correctly for data in the thousands was really hard.
// Probably I will use a frequency bar chart instead of a histogram considering it is discrete data
// It used the D3 javascript graphing library
// Maybe I'll implement it in a later version of Osmia

/* function plotJson(j){
    // The plot dimensions
    var width = 500,
        height = 500,
        padding = 50;

    // Get the geojson years in the one array
    var data = j["features"].map((item) => new Date(item.properties.timestamp).getFullYear());
    
    var histogram = d3.layout.histogram()
        .bins(17) // Should change this to max-min year
        (data)
    console.log(histogram); // I couldn't really understand the values it gives for x and dx. That was the big reason I gave up on this.
    var y = d3.scale.linear()
        .domain([0,d3.max(histogram.map(function (i) { return i.length; }))])
        .range([0,height]);

    var x = d3.scale.linear() // No matter what I did, I couldn't get this scale to do anything sensible. It would usually wreck the bar width
        .domain([0,10])
        .range([0,width]);

    var xAxis = d3.svg.axis() // It looks terrible
        .scale(x)
        .orient("bottom");

    var canvas = d3.select("#myPlot").append("svg") // I removed the myPlot div from the original code, you need to add it back to make it work
        .attr("width", width)
        .attr("height", height + padding);

    var group = canvas.append("g") // New SVG group
        .attr("transform", "translate(0,"+ height + ")")
        .call(xAxis);

    var bars = canvas.selectAll(".bar")
        .data(histogram)
        .enter()
        .append("g")
        .attr("transform","translate(20,0)");

    // Create the actual SVG rectangle for the bars
    bars.append("rect")
        .attr("x", function (d) {return x(d.x); })
        .attr("y", function (d) {return 500 - y(d.y); })
        .attr("width", 15 ) //function (d) {return x(d.dx); }
        .attr("height", function (d) {return y(d.y); })
        .attr("fill", "steelblue") // Seems to be a popular colour for D3 histograms
} */