/*
 * Copyright (c) 2012., Qualcomm, Inc.
 *
 *    Licensed under the Apache License, Version 2.0 (the "License");
 *    you may not use this file except in compliance with the License.
 *
 *    You may obtain a copy of the License at
 *
 *        http://www.apache.org/licenses/LICENSE-2.0
 *
 *    Unless required by applicable law or agreed to in writing, software
 *    distributed under the License is distributed on an "AS IS" BASIS,
 *    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *    See the License for the specific language governing permissions and
 *    limitations under the License.
 */
Ext.define('MyApp.controller.PetTracker', {
    extend: 'Ext.app.Controller',
    markers: [],
    directionsDisplay: null,
    directionsService: null,
    config: {
        stores: ['PetTracker'],
        refs: {
            petListPanel: 'petListPanel',
            petList: '#PetList',
            tourMap: 'tourMap',
            radiusPicker: 'radiusPicker'
        },
        control: {
            petListPanel: {
                petSelectCommand: "onPetSelected"
            },
            tourMap: {
                backButton: "onBackButton",
                mapRender: "onMapRender",
                nearButton: "onNear"
            },
            radiusPicker: {
                pickerChanged: "onPickerRadiusChange"
            }
        }
    },
    launch: function() {
        // Initialize Google Map Services
        this.directionsDisplay = new google.maps.DirectionsRenderer();
        this.directionsService = new google.maps.DirectionsService();

        var mapRendererOptions = {
            //draggable: true,  //Allows to drag route
            //hideRouteList: true,
            suppressMarkers: true
        };

        this.directionsDisplay.setOptions(mapRendererOptions);
    },

    // Transitions
    slideLeftTransition: { type: 'slide', direction: 'left' },
    slideRightTransition: { type: 'slide', direction: 'right' },

    onPetSelected: function (list, record) {
        var mapView = this.getTourMap();
        mapView.setRecord(record);
        Ext.Viewport.animateActiveItem(mapView, this.slideLeftTransition);

        this.renderMap(mapView, mapView.down("#tourMap").getMap(), record.data);
    },

    onBackButton: function () {
        console.log("Back to home");
        var store = Ext.getStore('PetTracker');
        store.getProxy().setUrl('http://tourdb-kingston.rhcloud.com/dogtag');
        store.load();
        Ext.Viewport.animateActiveItem(this.getPetListPanel(), this.slideRightTransition);
    },

    onNear: function() {
        this.getRadiusPicker().show();
    },
    onPickerRadiusChange: function(picker, pickerValue) {
        var store = Ext.getStore('PetTracker');
        var gmap = this.getTourMap().down("#tourMap");
        var geo = gmap.getGeo();
        var g_marks = this.markers;
        store.getProxy().setUrl('http://tourdb-kingston.rhcloud.com/dogtag'
            + geo.getLongitude() + '/' + geo.getLatitude() + '/' + pickerValue["radius"]);
        store.load({
              callback: function (records, options, success) {
                  if (records.length > 0) {
                      Ext.each(records, function (record) {
                          var p = new google.maps.LatLng(record.data.latitude, record.data.longitude);
                          var m = new google.maps.Marker({
                              position: p,
                              title: record.data.name + "'s Location",
                              animation: google.maps.Animation.DROP,
                              map: gmap.getMap()
//                              icon: 'resources/img/brown_markerD.png'
                          });
                          g_marks.push(m);
                      });
                  }
              }
        });

    },

    renderMap: function (extmap, map, record) {
         //erase old markers
		 if (this.markers.length == 0){
			 var geo = extmap.down("#tourMap").getGeo();
			 var currentPosition = new google.maps.LatLng(geo.getLatitude(), geo.getLongitude());
			 };

        var position = new google.maps.LatLng(record.latitude, record.longitude);

        var dynaMarker = new google.maps.Marker({
            position: position,
            title: record.name + "'s Location",
            map: map,
            icon: 'resources/img/yellow_MarkerB.png'
        });

        this.markers.push(dynaMarker);

        var infowindow = new google.maps.InfoWindow({
            content: "We've found your dog sniffing flowers!"
        });

        google.maps.event.addListener(dynaMarker, 'click', function () {
            infowindow.open(map, dynaMarker);
        });

        setTimeout(function () {
            map.panTo(position);
        }, 1000);

        var geo = extmap.down("#tourMap").getGeo();
        var currentPosition = new google.maps.LatLng(geo.getLatitude(), geo.getLongitude());
        this.plotRoute(map, currentPosition, position);

        // stop updates to center
        geo.suspendUpdates();
    },

    plotRoute: function (map, orig, dest) {
        this.directionsDisplay.setMap(map);
		var waypts = [];
		//var checkboxArray = document.getElementById("waypoints");
		if (this.markers.length > 0) 
             Ext.each(this.markers, function (marker) {
                 waypts.push({
				location:marker.getPosition(),
				stopover:true
				});
			};

		var request = {
			origin: orig,
			destination: dest,
			waypoints: waypts,
			optimizeWaypoints: true,
			travelMode: google.maps.TravelMode.WALKING
		};

        this.directionsService.route(request, function(response, status) {
			if (status == google.maps.DirectionsStatus.OK) {
				directionsDisplay.setDirections(response);
				var route = response.routes[0];
				var summaryPanel = document.getElementById("directions_panel");
				summaryPanel.innerHTML = "";
      // For each route, display summary information.
				for (var i = 0; i < route.legs.length; i++) {
					var routeSegment = i+1;
					summaryPanel.innerHTML += "<b>Route Segment: " + routeSegment + "</b><br />";
					summaryPanel.innerHTML += route.legs[i].start_address + " to ";
					summaryPanel.innerHTML += route.legs[i].end_address + "<br />";
					summaryPanel.innerHTML += route.legs[i].distance.text + "<br /><br />";
				}
			}
		});


});}