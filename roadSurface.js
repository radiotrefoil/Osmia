var Map = ol.Map; //import Map from 'ol/Map.js';
var OSMXML = ol.format.OSMXML; //import OSMXML from 'ol/format/OSMXML.js';
var VectorSource = ol.source.Vector; //import VectorSource from 'ol/source/Vector.js';
var View = ol.View; //import View from 'ol/View.js';
var XYZ = ol.source.XYZ; //import XYZ from 'ol/source/XYZ.js';
var CircleStyle = ol.style.Circle, Fill = ol.style.Fill, Stroke = ol.style.Stroke, Style = ol.style.Style;
//import {Circle as CircleStyle, Fill, Stroke, Style} from 'ol/style.js';
var OSM = ol.source.OSM; //import OSM from 'ol/source/OSM.js';
var TileLayer = ol.layer.Tile; //import {Tile as TileLayer, Vector as VectorLayer} from 'ol/layer.js';
var VectorLayer = ol.layer.Vector;
var bboxStrategy = ol.loadingstrategy.all; //use loadingstrategy "all" instead of "bbox" so that it doesn't spam the Overpass API every time you pan or zoom the map
var {transformExtent} = ol.proj; //import {transformExtent} from 'ol/proj.js';
var GeoJSON = ol.format.GeoJSON; //import GeoJSON from 'ol/format/GeoJSON.js';

let map2 = null;

const styles2 = {

'highway': {
    'service': new Style({
      stroke: new Stroke({
        color: 'rgba(50, 50, 50, 1.0)',
        width: 2,
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
	'footway': new Style({
      stroke: new Stroke({
        color: 'rgba(50, 50, 50, 0.5)',
        width: 1,
      }),
    }),
	'tertiary': new Style({
      stroke: new Stroke({
        color: 'rgba(200, 200, 0, 1.0)',
        width: 4,
      }),
    }),
	'primary': new Style({
      stroke: new Stroke({
        color: 'rgba(255, 60, 255, 1.0)',
        width: 4,
      }),
    }),
  },
};

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
    // Get the OSM town relation ID by feeding in the suburb string into Nominatim API
    const nominatimURL = new URL("https://nominatim.openstreetmap.org/search?")
    nominatimURL.search = new URLSearchParams({
        q: locationString,
        format: "geojson"
    })
    const response = await fetch(nominatimURL);
    const json = await response.json();
    const theRelation = JSON.stringify(json.features[0].properties.osm_id)

    const vectorSource = new VectorSource({
    format: new OSMXML(),
    loader: function (extent, resolution, projection, success, failure) {
        const epsg4326Extent = transformExtent(extent, projection, 'EPSG:4326');
        const client = new XMLHttpRequest();
        client.open('POST', 'https://overpass-api.de/api/interpreter');
        client.addEventListener('load', function () {
        const features = new OSMXML().readFeatures(client.responseText, {
            featureProjection: map2.getView().getProjection(),
        });
        console.log(features);
        vectorSource.addFeatures(features);
        success(features);
        });
        client.addEventListener('error', failure);
        const query =
                'rel('+theRelation+')->.suburb;.suburb;map_to_area;way[highway][!surface](area);(._;>;);out meta;';
        client.send(query);
    },
    strategy: bboxStrategy,
    });
    // Finished loading
    map2.getTargetElement().classList.remove('spinner');

    // Update the existing vector layer with the new source
    vectorSurface.setSource(vectorSource);

    // Fly the map to the new data
    map2.getView().fit(vectorSource.getExtent());
}
const vectorSurface = new VectorLayer({
  source: null,
  style: function (feature) {
    for (const key in styles) {
      const value = feature.get(key);
	  console.log(value);
	  console.log(key);
      if (value !== undefined) {
        for (const regexp in styles[key]) {
          if (new RegExp(regexp).test(value)) {
            return styles[key][regexp];
          }
        }
      }
    }
    return null;
  },
});

const attributions2 =
  '<a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap contributors</a>';

const raster = new TileLayer({
		source: new OSM()
	});
map2 = new Map({
  layers: [raster,vectorSurface],
  target: document.getElementById('map2'),
  view: new View({
    center: [133.5,-28.8],
    maxZoom: 20,
    zoom: 3.8,
  }),
});