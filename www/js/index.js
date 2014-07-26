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
	alert("web");
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

        //this.onOrientationChange();

	//search interface
	$("#set-currency").hide();
	$("#set-money").hide();
	$("#set-search").hide();
	
	$("#set-service").on("click", "a",function(){
	  var val = $(this).attr("value");
	  $("#set-service").hide();
	  
	  if(val == "search"){
	    $("#set-search").show();
	  }
	  else{
	    $("#set-currency").show();
	    $("#set-service").attr("value", val);
	  }
	});
	$("#set-currency").on("click", "a",function(){
	  var val = $(this).attr("value");
	  if(val == "back"){
	      $("#set-service").show();
	      $("#set-currency").hide();
	  }else{
	    $("#set-currency").hide();
	    $("#set-money").show();
	    $("#set-currency").attr("value", val);
	  }
	});
	$("#set-money").on("click", "a",function(){
	  var val = $(this).attr("value");
	  if(val == "back"){
	      $("#set-money").hide();
	      $("#set-currency").show();
	  }else{
	    $("#set-money").attr("value", val);
	  }
	});
	$("#set-search").on("click", "a",function(){
	  var val = $(this).attr("value");
	  if(val == "back"){
	      $("#set-search").hide();
	      $("#set-service").show();
	  }
	});
      
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
		$(this).addClass("ui-alt-icon")
	    }
	    else{
		$(this).removeClass("ui-alt-icon")
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

	//top slider menu
	var mouseTracking = false;
	var d = 0;
	$("#map").on("touchstart",function(){
	  var minheight = parseFloat( $(".top-slide-menu").css("min-height") )
	  $(".top-slide-menu").animate({height : minheight});
	})
	$(".top-slide-menu").on('touchmove', ".ui-icon-bars", function(event) {
	    event.preventDefault();
	    event = event.originalEvent.touches[0];
	    d = event.pageY - $(".top-slide-menu").height();
	    $(".top-slide-menu").height( event.pageY );
        });
	$(".top-slide-menu").on("touchend", ".ui-icon-bars", function(event) {
	    var maxheight = Math.floor(parseFloat( $(".top-slide-menu").css("max-height") ))
	    var minheight = Math.floor(parseFloat( $(".top-slide-menu").css("min-height") ))
	    var y;
	    var h = maxheight;

	    event.preventDefault();
	    event = event.originalEvent.touches[0];

	    y = $(".top-slide-menu").height();
	    if( (d > 0) && (y > 0.2*h) || (d < 0) &&  ( y > 0.8*h ) || (y == minheight) /*(y - minheight) > (maxheight - y)*/ ){
	      $(".top-slide-menu").animate({height : maxheight});
	    }
	    else{
	      $(".top-slide-menu").animate({height : minheight});
	    }
	});

	$("#route-btn").click(function(){
                $("#map").maps("addRoute", self.data[self.currentInfoId])
        })

	this.loadData();
    },
    onOrientationChange: function() {
        this.viewport = {
            width  : $(window).width(),
            height : $(window).height()
        };
        $("#map").width(this.viewport.width)
                    .height(this.viewport.height);

        $("#map").maps("fitToViewport");
    },

    loadInfo: function(id){
      var info = this.data[id];
      var stars = Math.round( info.stars + 1 );
      $("#name").text(info.address);
      $("#stars").empty();
      $("#comments").empty();

      for(var i = 0; i < stars; i++){
	$("#stars").append("<span  class='ui-btn ui-shadow ui-corner-all ui-icon-star ui-btn-icon-notext ui-btn-inline'></span>");
      }

      for(var i = info.comments.length-1; i >= 0; i--){
	$("#comments")
	  .append( $("<div class='ui-body ui-body-a ui-corner-all'>" )
	    .append( $("<h3>")
	      .append( stars = $("<div class='comment-rating ui-alt-icon ui-nodisc-icon'>") )
	     )
	    .append( "<p>" + info.comments[i].text.replace("\n", "<br/>") + "</p>" )
	   )
	for(var s = 0; s < info.comments[i].stars+1 ; s++){
	  stars.append("<span data-mini='true'  class='ui-btn  ui-corner-all ui-icon-star ui-btn-icon-notext ui-btn-inline'></span>");
	}
      }

      $("#description").html( Services(info.services).print() );



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
	  for(var i = 0; i < 10; i++){
	    self.data[i] = r[i];
	  }
	  //self.data = r;
	  //self.loadInfo( self.currentInfoId );
          function geolocationSuccess(position) {
                $("#map").maps({
                        data: self.data,
                        center: [position.coords.latitude, position.coords.longitude],
			onOpen: function(e, ui){

			self.currentInfoId = ui.id;
			self.loadInfo( self.currentInfoId );
			$.mobile.changePage( "#info");
		      }
                });
		self.onOrientationChange();
          }
          function geolocationError() {
                $("#map").maps({ data: self.data, center: [55.753559, 37.609218],
		  onOpen: function(e, ui){

		  self.currentInfoId = ui.id;
		  self.loadInfo( self.currentInfoId );
		  $.mobile.changePage( "#info");


		  }	});
		self.onOrientationChange();
          }
	  navigator.geolocation.getCurrentPosition(geolocationSuccess, geolocationError);
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
