$.widget( "custom.maps", {
  // default options
  options: {
    data:{},
    enableSuperPlacemark: false,
  },
  _create: function() {
    var self = this;
    ymaps.ready(init);

    function init() {
        self.map = new ymaps.Map(self.element[0], {
            center: self.options.center,
            zoom: 15,
            controls: []
        });

        placemark = new ymaps.Placemark(self.options.center, {}, {
          preset: 'islands#geolocationIcon'
        });
        placemark.properties.myid = "me";
        self.map.geoObjects.add(placemark);
        self.me = self.map.geoObjects.indexOf(placemark)

        //self.clusterer = new ymaps.Clusterer({minClusterSize: 100500});
        //self.map.geoObjects.add(self.clusterer);

        self.element.on( "click", ".hint-container", function() {
          console.log("onclick")
          var id = $(this).attr("data-id");
          self.map.balloon.close(true);
          self._trigger("onOpen", self, {id: id});

        });
        self.element.on("click", ".ui-btn",function(){
          var id = $(".map-nav-btn", $(this)).attr("data-id");
            self.map.balloon.close(true);
            self.addRoute(self.options.data[id]);

            return false;
        })
	

        self.map.events.add('click', function (e) {
            self.map.balloon.close();
	    if(self.options.enableSuperPlacemark){
	      var coords = e.get('coords');
	      
	      if( self.superPlacemark ){
		self.map.geoObjects.remove( self.superPlacemark );
	      }
	      
	      self.superPlacemark = new ymaps.Placemark(coords, {}, {
		iconLayout: 'default#imageWithContent',
		// iconImageClipRect: [[0,0], [26, 46]],
		iconImageHref: 'img/blueDotIcon.png',
		iconImageSize: [34, 41],
		iconImageOffset: [-17, -20],
		// Определим интерактивную область над картинкой.
		iconShape: {
		    type: 'Rectangle',
		    coordinates: [ [0 - 27, 0 - 31], [27, 31] ]
		},
		//iconColor: (item.load.color == "yellow") ? "orange" : item.load.color,
		hideIconOnBalloonOpen: false,
		balloonCloseButton: false,
		balloonMinHeight: 120
	      });
	      self.findRoute(coords);
	      self.map.geoObjects.add(self.superPlacemark);
	    }
	    
        });

        self.map.events.add('balloonopen', function(e){
          $(".hint-container .map-nav-btn").button();
        })

        self.getService("get_money");
    }
  },
  _setOption: function( key, value ) {
    this._super( key, value );
    var self = this;
    if(key == "data"){
      if(this.map)
        this.getService("get_money");
      else ymaps.ready(function(){
        self.getService("get_money");
      })
    }
    if( (key == "enableSuperPlacemark") && (!value) ){
      self.map.geoObjects.remove( self.superPlacemark );
      self.superPlacemark = false;
    }
  },

  getMoney: function(amount, type) {
    var items, self = this;
    this.clearAll();

    function hasAmount(item) {
      var itemAmount = 0;
      if( item.services.get_money && item.services.get_money[type] ) {
        itemAmount = item.services.get_money[type].reduce(function(prev, cur) {
          return prev + cur.count * cur.value;
        }, 0)
      }

      if( itemAmount < amount ) {
        var filteredItem = $.extend(true, {}, item);
        filteredItem.load.color = "grey";

        return filteredItem;
      }

      return item;
    }

    //this.map.events.removeAll();

    this.getMoneyBoundChangeListener = function (event) {
        var mapBounds = event.get('newBounds');
        var data = self.options.data.filter(function(item, id) {
            if(!item.position)
              item.position = [55.76 + 0.5*id, 37.64 - 0.5*id];
          if(item.position[0] >= Math.min(mapBounds[0][0], mapBounds[1][0]) &&
             item.position[0] <= Math.max(mapBounds[0][0], mapBounds[1][0]) &&
             item.position[1] >= Math.min(mapBounds[0][1], mapBounds[1][1]) &&
             item.position[1] <= Math.max(mapBounds[0][1], mapBounds[1][1]) )
            return true;
          return false;
        });

        items = $.map(data, hasAmount);
        self._putOnMap(items);
    }

    if(this.getServiceBoundChangeListener)
      this.map.events.remove('boundschange', this.getServiceBoundChangeListener);
    if(this.getMoneyBoundChangeListener)
      this.map.events.remove('boundschange', this.getMoneyBoundChangeListener);

    this.map.events.add('boundschange', this.getMoneyBoundChangeListener);

    this.map.events.fire('boundschange',{newBounds: self.map.getBounds()});

    return this;
  },
  findRoute: function(to) {
    var self = this;
    var start = this.map.geoObjects.get(this.me).geometry.getCoordinates();
    var minDistanse = null;
    var nearestPlacemark = null;

    this.map.geoObjects.each(function(placemark) {
      if(placemark.properties.markerId && placemark.properties.color !== "grey") {
        var distanse = ymaps.coordSystem.geo.getDistance(start, placemark.geometry.getCoordinates());
        if(!minDistanse || distanse < minDistanse) {
          minDistanse = distanse;
          nearestPlacemark = placemark;
        }
      }
    });

    ymaps.route([start, nearestPlacemark.geometry.getCoordinates(), to], {
        multiRoute: true,
    }).done(function (route) {
        route.options.set("mapStateAutoApply", true);
        // route.options.set( "wayPointStartIconLayout", "default#image");
        // route.options.set( "wayPointStartIconImageHref", "img/transparent-icon.png");
        // route.options.set( "wayPointStartContentSize", [10, 10])
        // route.options.set( "wayPointStartIconImageSize", [26, 46])
        // route.options.set( "wayPointStartIconImageOffset", [-25, -46])
        route.options.set( "wayPointIconLayout", "default#image");
        route.options.set( "wayPointIconImageHref", "img/transparent-icon.png");
        route.options.set( "wayPointContentSize", [10, 10])
        route.options.set( "wayPointIconImageSize", [26, 46])
        route.options.set( "wayPointIconImageOffset", [-25, -46])

        // route.options.set( "wayPointFinishIcon", "default#imageWithContent");
        // route.options.set( "wayPointFinishIconImageHref", "img/route.png");
        // route.options.set( "wayPointFinishIconImageContent", "Ф");
        // route.options.set( "wayPointFinishIconImageSize", [20, 26])
        // route.options.set( "wayPointFinishIconImageOffset", [-10, -13])
        //           iconImageSize: [34, 41],
        //   iconImageOffset: [-17, -20],
        //    wayPointStartIconImageHref: 'examples/maps/ru/multiroute_custom_icon_layout/images/start_point.png'
        route.properties.myid = "me";
        route.properties.tag = "route";
        self.clearByTag("route");
        self.map.geoObjects.add(route);
    }, function (err) {
        console.log(err);
    }, this);

  },
  addRoute: function(item) {
    var startPosition, endPosition,
        self = this;
    startPosition = self.map.geoObjects.get(this.me).geometry.getCoordinates();
    if(!item.position) {
          alert("No Position!")
          return;
        }
    else endPosition = item.position;

    ymaps.route([startPosition, endPosition], {
        multiRoute: true,
    }).done(function (route) {
        route.options.set("mapStateAutoApply", true);
        route.options.set( "wayPointStartIconLayout", "default#image");
        route.options.set( "wayPointStartIconImageHref", "img/transparent-icon.png");
        route.options.set( "wayPointStartContentSize", [10, 10])
        route.options.set( "wayPointStartIconImageSize", [26, 46])
        route.options.set( "wayPointStartIconImageOffset", [-25, -46])
        route.options.set( "wayPointFinishIconLayout", "default#image");
        route.options.set( "wayPointFinishIconImageHref", "img/transparent-icon.png");
        route.options.set( "wayPointFinishContentSize", [10, 10])
        route.options.set( "wayPointFinishIconImageSize", [26, 46])
        route.options.set( "wayPointFinishIconImageOffset", [-25, -46])
        //    wayPointStartIconImageHref: 'examples/maps/ru/multiroute_custom_icon_layout/images/start_point.png'
        route.properties.myid = "me";
        route.properties.tag = "route";
        self.clearByTag("route");
        self.map.geoObjects.add(route);
    }, function (err) {
        throw err;
    }, this);
  },
  getService: function(serviceType) {
    var items, self = this;
    this.clearAll();

    function hasService(type) {
      return function(item){
        if(!item.services[type]) {
          var filteredItem = $.extend(true, {}, item);
          filteredItem.load.color = "grey";

          return filteredItem;
        }

        return item;
      }
    }

    if(this.getServiceBoundChangeListener)
      this.map.events.remove('boundschange', this.getServiceBoundChangeListener);
    if(this.getMoneyBoundChangeListener)
      this.map.events.remove('boundschange', this.getMoneyBoundChangeListener);

    this.getServiceBoundChangeListener = function (event) {
        var mapBounds = event.get('newBounds');
        var data = self.options.data.filter(function(item, id) {
            if(!item.position)
              item.position = [55.76 + 0.5*id, 37.64 - 0.5*id];
          if(item.position[0] >= Math.min(mapBounds[0][0], mapBounds[1][0]) &&
             item.position[0] <= Math.max(mapBounds[0][0], mapBounds[1][0]) &&
             item.position[1] >= Math.min(mapBounds[0][1], mapBounds[1][1]) &&
             item.position[1] <= Math.max(mapBounds[0][1], mapBounds[1][1]) )
            return true;
          return false;
        })

        items = $.map(data, hasService(serviceType));
        self._putOnMap(items);
    }

    this.map.events.add('boundschange', this.getServiceBoundChangeListener);

    this.map.events.fire('boundschange', {newBounds: self.map.getBounds()});

    return this;
  },
  _putOnMap: function(items, bankomats) {
    var self = this;
    self.clear();

    Array.prototype.forEach.call(items, function(item, id) {
        var iconContent, placemark,
            position = item.position;

        if(!position) {
            alert("No position!");
            return;
        }

        if(item.services.main === "Отделение")
          iconContent = "<img src='img/bank.png'/ style='width:14px;height:14px;margin-left:6px;margin-top:6px;'>"
        if(item.services.main === "Банкомат")
          iconContent = "<img src='img/usd.png'/ style='width:14px;height:14px;margin-left:6px;margin-top:6px;'>"

        var exists = false;
        self.map.geoObjects.each(function(itemOnMap) {
          if(itemOnMap.properties.markerId == item.id)
            exists = true;
        });

        if(exists) return;

        placemark = new ymaps.Placemark(position, {
            iconContent: iconContent,
            // hintContent: office.address,
            balloonContent: self.createHintContent(item)
        }, {
          iconLayout: 'default#imageWithContent',
          // iconImageClipRect: [[0,0], [26, 46]],
          iconImageHref: 'img/' + item.load.color + '-marker.png',
          iconImageSize: [34, 41],
          iconImageOffset: [-17, -20],
          // Определим интерактивную область над картинкой.
          iconShape: {
              type: 'Rectangle',
              coordinates: [ [0 - 27, 0 - 31], [27, 31] ]
          },
          //iconColor: (item.load.color == "yellow") ? "orange" : item.load.color,
          hideIconOnBalloonOpen: false,
          balloonCloseButton: false,
          balloonMinHeight: 120
        });
        placemark.properties.markerId = item.id;
        placemark.properties.color = item.load.color;

        self.map.geoObjects.add(placemark);
    });


    // $( "#map" ).on( "click", ".ymaps-svg-icon", function() {
    //   var id = $(".hint-container", $(this)).attr("data-id");
    //   var balloon;
    //   self.map.geoObjects.each(function(geoObject){
    //     if(geoObject.properties.id == id)
    //       balloon = geoObject.balloon;
    //   })

    //   balloon.open();
    //   // self._trigger("onOpen", self, {id: id});
    // });

    return this;
  },
  createHintContent: function(item) {
    var container = $("<div/>", {class: "hint-container", "data-id": item.id}).append($("<h2/>").append(item.services.main)),
        money = item.services.get_money;
    // moreButton = $("<div/>", {class: "more-button", "data-id": id}).append("<p>...</p>");

    function calcAmount(type) {
      if(!(item.services.get_money && item.services.get_money[type]))
        return 0;

      return item.services.get_money[type].reduce(function(prev, cur) {
        return prev + cur.count * cur.value;
      }, 0)
    }

    function printValues(type, ch) {
      if(!(item.services.get_money && item.services.get_money[type]))
        return ch + "0";

      var money =  item.services.get_money[type].reduce(function(prev, cur) {
        return prev + ", " + ch + cur.value.printInt();
      }, "");
      return money.slice(2);
    }

    container.append($("<p/>").text(item.address));

    var color = (this.options.data[item.id].load.color == "yellow") ? "orange" : this.options.data[item.id].load.color;
    var semafor = $("<div/>");
    if(color)
      semafor.append("<img src='img/" + color + "-semafor.png'/>");

    container.append( $("<div/>", {class: "semafor"})
                          .append( semafor )
                          );
    container.append( $("<div/>").append('<a href="#" class="map-nav-btn" data-id="' + item.id + '" data-iconpos="notext" data-icon="navigation" data-role="button"/>'));
    var moneyAvaliable = [];
    if(item.services.get_money && item.services.get_money.rur)
      moneyAvaliable.push("rur");
    if(item.services.get_money && item.services.get_money.usd)
      moneyAvaliable.push("usd");
    if(item.services.get_money && item.services.get_money.eur)
      moneyAvaliable.push("eur");

    container.append( $("<div/>", {class: "money-types"})
                      .append( this.createDivForMoney(moneyAvaliable, item) )
                      //.append( man )
                      );
              //.append( moreButton );
    // console.log(container)
    return container[0].outerHTML;
  },
  createDivForMoney: function(types, item) {
    var res = $("<div/>");
    for(var i = 0; i < types.length; i++) {
      res.append($("<div/>",{class: "money-"+types[i]}));
    }

    res.addClass("money-count-"+types.length);

    var arrows = $("<div/>").append($("<div/>", {class: "arrow-down-45"}))
                            .append($("<div/>", {class: "arrow-up-45"}))
                            .append($("<div/>", {class: "arrow-up-135"}))
                            .append($("<div/>", {class: "arrow-down-135"}))
                            .append($("<div/>", {class: "arrow-up-30"}))
                            .append($("<div/>", {class: "arrow-down-30"}))
                            .append($("<div/>", {class: "arrow-up-120"}))
                            .append($("<div/>", {class: "arrow-down-120"}))
                            .append($("<div/>", {class: "arrow-up"}))
                            .append($("<div/>", {class: "arrow-down"}));

    res.append(arrows);

    switch(types.length){
      case 1:
        var up = null, down = null;
        if(item.services.put_money && item.services.put_money[types[0]]){
          up = $(".arrow-up",arrows);
          up.show();
        }
        if(item.services.get_money && item.services.get_money[types[0]]){
          down = $(".arrow-down",arrows)
          down.show();
        }

        if( (!up && down) )
          down.css("right", "0px");
        if( (up && !down) )
          up.css("right", "0px");

        break;
      case 2:
        if(item.services.put_money && item.services.put_money[types[0]])
          $(".arrow-up-120",arrows).show();
        if(item.services.get_money && item.services.get_money[types[0]])
          $(".arrow-down-120",arrows).show();

        if(item.services.put_money && item.services.put_money[types[1]])
          $(".arrow-up-30",arrows).show();
        if(item.services.get_money && item.services.get_money[types[1]])
          $(".arrow-down-30",arrows).show();
        break;
      case 3:
        var up = null, down = null;
        if(item.services.put_money && item.services.put_money[types[0]]){
          $(".arrow-up-45",arrows).show();
        }
        if(item.services.get_money && item.services.get_money[types[0]]){
          $(".arrow-down-45",arrows).show();
        }
        if(item.services.put_money && item.services.put_money[types[1]]){
          up = $(".arrow-up",arrows);
          up.show();
        }
        if(item.services.get_money && item.services.get_money[types[1]]){
          down = $(".arrow-down",arrows);
          down.show();
        }
        if(item.services.put_money && item.services.put_money[types[2]]){
          $(".arrow-up-135",arrows).show();
        }
        if(item.services.get_money && item.services.get_money[types[2]]){
          $(".arrow-down-135",arrows).show();
        }

        if( (!up && down) )
          down.css("right", "20px");
        if( (up && !down) )
          up.css("right", "20px");
        break;
    }

    res.append($("<div/>",{class: "money-man"}));

    return res;
  },
  clear: function() {
    var self = this;
    if(this.map) {
      //this.clusterer.removeAll();
      var iter = this.map.geoObjects.getIterator();
      var item = iter.getNext();
      var idsToRemove = [];
      while(item != iter.STOP_ITERATION) {
        if(item.properties.myid != "me" && item.properties.markerId) {
          idsToRemove.push(self.map.geoObjects.indexOf(item));
        }

        item = iter.getNext();
      }

      var mapBounds = self.map.getBounds();
      var data = idsToRemove.filter(function(id) {
        if(!self.map.geoObjects.get(id).geometry)
          return false;

        var position = self.map.geoObjects.get(id).geometry.getCoordinates();

        if(position[0] >= Math.min(mapBounds[0][0], mapBounds[1][0]) &&
           position[0] <= Math.max(mapBounds[0][0], mapBounds[1][0]) &&
           position[1] >= Math.min(mapBounds[0][1], mapBounds[1][1]) &&
           position[1] <= Math.max(mapBounds[0][1], mapBounds[1][1]) )
          return false;
        return true;
      });

      data.forEach(function(id){
        var it = self.map.geoObjects.get(id);
        if( it && it.properties && it.properties.markerId && it.properties.myid != "me")
          self.map.geoObjects.remove(it);
      });

      // this.map.geoObjects.each( function(placemark) {
      //   if(self.map.geoObjects.indexOf(placemark) != self.me )
      //     self.map.geoObjects.remove(placemark);
      // });
      //this.map.geoObjects.removeAll();
    }
  },
  clearAll: function(){
    var self = this;
    if(this.map) {
      //this.clusterer.removeAll();
      var iter = this.map.geoObjects.getIterator();
      var item = iter.getNext();
      var idsToRemove = [];
      while(item != iter.STOP_ITERATION) {
        if(item.properties.myid != "me") {
          idsToRemove.push(self.map.geoObjects.indexOf(item));
        }

        item = iter.getNext();
      }

      idsToRemove.forEach(function(id){
        self.map.geoObjects.remove(self.map.geoObjects.get(id));
      });
    }
  },
  clearByTag: function(tag) {
    var self = this;
    if(this.map) {
      var iter = this.map.geoObjects.getIterator();
      var item = iter.getNext();
      var idsToRemove = [];
      while(item != iter.STOP_ITERATION) {
        if(item.properties && item.properties.tag == tag) {
          //self.map.geoObjects.remove(item);
          //iter = this.map.geoObjects.getIterator();
          idsToRemove.push(self.map.geoObjects.indexOf(item));
        }

        item = iter.getNext();
      }

      idsToRemove.forEach(function(id){
        self.map.geoObjects.remove(self.map.geoObjects.get(id));
      });
      //this.map.geoObjects.each( function(placemark) {
        //if(self.map.geoObjects.indexOf(placemark) != self.me )
          //self.map.geoObjects.remove(placemark);
      //});
      //this.map.geoObjects.removeAll();
    }
  },
  fitToViewport: function() {
    if(this.map) {
      this.map.container.fitToViewport();
    }
  }
});