/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
Number.prototype.printFloat = function (fix){
    if(fix == undefined) fix = 2;
    return String(this.toFixed(fix)).replace(/(\d)(?=(\d\d\d)+([^\d]|$))/g, '$1 ');
}
Number.prototype.printInt = function (){
  return this.printFloat(0);
}

var processHash = function( url ) {
    var parsed = $.mobile.path.parseUrl( url ),
        hashQuery = parsed.hash.split( "?" );
    return {
        parsed: parsed,
        cleanHash: ( hashQuery.length > 0 ? hashQuery[ 0 ] : "" ),
        queryParameters: ( hashQuery.length > 1 ? hashQuery[ 1 ] : "" )
    };
};


var app = {

    server: "http://msymbolics.com:9900",
    gate: "/sber/gate.php?",

    data: {},

    currentInfoId: -1,

    // Application Constructor
    initialize: function() {
        this.bindEvents();
    },
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function() {
      var self = this;
      this.app = document.URL.indexOf( 'http://' ) === -1 && document.URL.indexOf( 'https://' ) === -1;
      if ( this.app ) {
		// TODO
	  // document.addEventListener('deviceready', this.onDeviceReady, false);
	   $(document).ready(function(){
	      self.onDeviceReady();
	  })
      } else {
	//alert("web");
	  $(document).ready(function(){
	      self.onDeviceReady();
	  })
      }

        window.addEventListener('orientationchange', this.onOrientationChange);

	document.ontouchmove = function(event){
	  if( $.mobile.activePage.attr('id') == "mapapp" ){
	   event.preventDefault();
	  }
	}

        $( document ).bind( "mobileinit", function() {
            // Make your jQuery Mobile framework configuration changes here!
            $.mobile.allowCrossDomainPages = true;
            $.support.cors = true;
        });
    },
    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicitly call 'app.receivedEvent(...);'
    onDeviceReady: function() {
      var self = this;

    $(document)
    .on( "pagechange", function( event, data ) {
		if( data.options.openmenu ){
		  $("#menu").panel("open");
		}
    })
    .on( "pagebeforechange", function( event, data ) {
        // When we go from #secondary-page to #secondary-page we wish to indicate
        // that a transition to the same page is allowed.
        if ( $.type( data.toPage ) === "string" &&
            data.options.fromPage &&
            data.options.fromPage.attr( "id" ) === "mapapp" &&
            processHash( data.toPage ).cleanHash === "#mapapp" ) {
		data.options.openmenu = true;
                data.options.allowSamePageTransition = true;
		if( data.options.link ){
		  data.options.link.removeClass("ui-btn-active");
		}
        }
    })
    .on( "pagecontainerbeforetransition", function( event, data ) {
        var queryParameters = {},
            processedHash = processHash( data.absUrl );
        // We only modify default behaviour when navigating to the secondary page
        if ( processedHash.cleanHash === "#mapapp" ) {
            // Assemble query parameters object from the query string
            if ( processedHash.queryParameters ) {
                $.each( processedHash.queryParameters.split( "&" ),
                    function( index, value ) {
                        var pair = value.split( "=" );
                        if ( pair.length > 0 && pair[ 0 ] ) {
                            queryParameters[ pair[ 0 ] ] =
                                ( pair.length > 1 ? pair[ 1 ] : true );
                        }
                    });
            }
            $("#set-money").hide();
	    $("#set-search").hide();
	    $("#set-service").hide();
            switch( queryParameters.menu ){
	      case "search":
		$("#set-search").show();
		break;
	      case "get_money":
	      case "put_money":
		$("#set-money").show();
		break;
	      default:
		$("#set-service").show();
		break;
	    }

            // Set the title from the query parameters
            //$( "#section" ).text( queryParameters.section );
            // Set the url of the page - this will be used by navigation to set the
            // URL in the location bar
            $( "#mapapp" ).jqmData( "url", processedHash.parsed.hash );
        }
    });
	$("#set-money").on("click", ".value", function(){
	  var value = Number( $(this).attr("value") );
	  var currency = $("#set-money").attr("currency");
	  $("#set-money").attr("value", value);

	  if(value && currency){
	    $("#map").maps("getMoney", value, currency);
	    //$("#menu").panel("close");
	  }
	  
	  $("#set-money .value").removeClass("on");
	  $(this).addClass("on");
	  
	})
	$("#set-money").on("click", ".currency", function(){
	  var value = Number( $("#set-money").attr("value") );
	  var currency = $(this).attr("value")
	  $("#set-money").attr("currency", currency);

	  $("#set-money .value-cont").remove();
	  $("#set-money .ui-controlgroup-controls").prepend( services.moneySet(currency) )/*.controlgroup().controlgroup("refresh");*/

	  if(value && currency){
	    $("#map").maps("getMoney", value, currency);
	    //$("#menu").panel("close");
	  }
	  $("#set-money .currency").removeClass("on");
	  $(this).addClass("on");

	})
	//search
	$("#search-button").click(function(){
	    var val = parseFloat( $("#search-value").val() );
	    var currency = $("#currency").val();
	    $("#map").maps("getMoney", val, currency);
	})

	//rating
	$("#set-rating .ui-btn").click(function(){
	  var index = Number($(this).attr("index"));
	  $("#set-rating .ui-btn").each(function(){
	    var i = Number($(this).attr("index"));
	    if(i <= index){
		$(this).addClass("ui-green-icon")
	    }
	    else{
		$(this).removeClass("ui-green-icon")
	    }
	  })
	  $("#set-rating").attr( "rating", index );
	})

	// put comment and rating
	$("#push-comment").click(function(){
	  var rating = Number( $("#set-rating").attr("rating") );
	  var text = $("#set-comment").val();
	  $("#set-comment").val("");
	  self.addComment(self.currentInfoId, rating, text);
	})


	$("#route-btn").click(function(){
                $("#map").maps("addRoute", self.data[self.currentInfoId])
        })
	
	$("#enable-super-placemark").on("click", function(){
	  $(this).toggleClass("on");
	  $("#map").maps({enableSuperPlacemark:  !$("#map").maps("option", "enableSuperPlacemark" ) })
	})
	$("#home").on("click", function(){
	  $("#map").maps({ center: [55.758728299999994, 37.6106999] });
	})

	this.loadData();
    },
    onOrientationChange: function() {
        this.viewport = {
            width  : $("#mapapp .ui-content").width(),
            height : $("#mapapp .ui-content").height()
        };
        $("#map").width(this.viewport.width)
                    .height(this.viewport.height);

        $("#map").maps("fitToViewport");
    },

    loadInfo: function(id){
      var info = this.data[id];
      var stars = Math.round( info.stars + 1 );
      $("#main-type").text(info.services.main);
      $("#address").text(info.address);
      $("#stars").empty();
      $("#comments").empty();

      for(var i = 0; i < stars; i++){
	$("#stars").append("<span  class='ui-btn ui-shadow ui-corner-all ui-icon-star ui-btn-icon-notext ui-btn-inline'></span>");
      }

      for(var i = info.comments.length-1; i >= 0; i--){
	$("#comments")
	  .append( $("<div class='ui-body ui-body-a ui-corner-all'>" )
	    .append( $("<h3>")
	      .append( stars = $("<div class='comment-rating ui-green-icon ui-nodisc-icon'>") )
	     )
	    .append( "<p>" + info.comments[i].text.replace("\n", "<br/>") + "</p>" )
	   )
	for(var s = 0; s < info.comments[i].stars+1 ; s++){
	  stars.append("<span data-mini='true'  class='ui-btn  ui-corner-all ui-icon-star ui-btn-icon-notext ui-btn-inline'></span>");
	}
      }

      $("#services")
	.empty()
	.append( Services(info.services).print() );


    var color = (info.load.color == "yellow") ? "orange" : info.load.color;
    if(color)
      $("#semafore").html("<img src='img/" + color + "-semafor.png'/><br/>Время в очереди "+ info.load.avg_load + " мин.");



    },

    loadData: function(){
      var self = this;
      $.ajax({
	type: "GET",
	url: this.app?(this.server + "/sber/data"):(this.gate),
	dataType: "json",
	data: {
	  host: this.server + "/sber/data",
	},
	success: function(r){
	  self.data = [];
	  for(var i = 0; i < r.length; i+=10) {
	    self.data[i] = r[i];
	  }
	  // self.data = r;
	  //self.loadInfo( self.currentInfoId );

		$("#map").maps({
		        data: self.data,
		        center: [55.758728299999994, 37.6106999],
			onOpen: function(e, ui){

			self.currentInfoId = ui.id;
			self.loadInfo( self.currentInfoId );
			$.mobile.changePage( "#info");
		      }
		});
		self.onOrientationChange();
//          function geolocationSuccess(position) {
  //               $("#map").maps({
  //                       data: self.data,
  //                       center: [position.coords.latitude, position.coords.longitude],
		// 	onOpen: function(e, ui){

		// 	self.currentInfoId = ui.id;
		// 	self.loadInfo( self.currentInfoId );
		// 	$.mobile.changePage( "#info");
		//       }
  //               });
		// self.onOrientationChange();
		// console.log( [position.coords.latitude, position.coords.longitude])
  //         }
  //         function geolocationError() {
  //               $("#map").maps({ data: self.data, center: [55.753559, 37.609218],
		//   onOpen: function(e, ui){

		//   self.currentInfoId = ui.id;
		//   self.loadInfo( self.currentInfoId );
		//   $.mobile.changePage( "#info");


		//   }	});
		// self.onOrientationChange();
  //         }
	  // navigator.geolocation.getCurrentPosition(geolocationSuccess, geolocationError,{timeout: 10000});
	}
      })
    },

    addComment: function(id, star, text){
      var self = this;
      var data;
      if( !text ){
	data = {
	    id: id,
	    star: star,
	    host: this.server + "/sber/star?",
	  }
      }
      else{
	data = {
	    id: id,
	    star: star,
	    text: text,
	    host: this.server + "/sber/comment?",
	  }
      }
      $.mobile.loading( "show");


      $.ajax({
	type: "GET",
	url: this.app?(data.host):(this.gate),
	dataType: "json",
	data: data,
	success: function(r){
	  self.data[id] = r;
	  self.loadInfo(id);
	  $.mobile.loading( "hide");
	},
      })

    }

};
