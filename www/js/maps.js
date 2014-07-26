$.widget( "custom.maps", {
  // default options
  options: {
    data:{}
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

        self.clusterer = new ymaps.Clusterer({minClusterSize: 5});
        self.map.geoObjects.add(self.clusterer);

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
  },

  getMoney: function(amount, type) {
    var items, self = this;

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
          iconContent = "<img src='img/bank.png'/ style='width:13px;height:13px;'>"
        if(item.services.main === "Банкомат")
          iconContent = "<img src='img/ATM.png'/ style='width:13px;height:13px;'>"

        placemark = new ymaps.Placemark(position, {
            iconContent: iconContent,
            // hintContent: office.address,
            balloonContent: self.createHintContent(item),
            balloonCloseButton: false
        }, {
          iconColor: (item.load.color == "yellow") ? "orange" : item.load.color,
          hideIconOnBalloonOpen: false
        });

        self.clusterer.add(placemark);
    });

    $( "#map" ).on( "click", ".hint-container", function() {
      console.log("onclick")
      var id = $(this).attr("data-id");
      self.map.balloon.close(true);
      self._trigger("onOpen", self, {id: id});

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
    var container = $("<div/>", {class: "hint-container", "data-id": item.id}).append($("<h4/>").append(item.address)),
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

    if(money && money.usd)
      container.append($("<p/>").append(printValues("usd", "$")));
    if(money && money.eur)
      container.append($("<p/>").append(printValues("eur", "€")));
    if(money && money.rur)
      container.append($("<p/>").append(printValues("rur", "<span class=\"rur\">p<span>уб.</span></span>")));

    var color = (this.options.data[item.id].load.color == "yellow") ? "orange" : this.options.data[item.id].load.color;
    var semafor = $("<div/>");
    if(color)
      semafor.append("<img src='img/" + color + "-semafor.png'/>");
    var avgLoad = $("<div/>");
    if(item.load.avg_load)
      avgLoad.append("~" + item.load.avg_load + " минут");

    container.append( $("<div/>", {class: "semafor"})
                          .append( semafor )
                          .append( avgLoad )
                          )
              //.append( moreButton );
    // console.log(container)
    return container[0].outerHTML;
  },
  clear: function() {
    var self = this;
    if(this.map) {
      this.clusterer.removeAll();
      // var iter = this.map.geoObject.getIterator();
      // var item = iter.getNext();
      // while(item != iter.STOP_ITERATION && iter.getNext() != iter.STOP_ITERATION) {
      //   if(item.properties.myid != "me") {
      //     self.map.geoObjects.remove(item);
      //     iter = this.map.geoObjects.getIterator();
      //   }

      //   item = iter.getNext();
      // }
      //this.map.geoObjects.each( function(placemark) {
        //if(self.map.geoObjects.indexOf(placemark) != self.me )
          //self.map.geoObjects.remove(placemark);
      //});
      //this.map.geoObjects.removeAll();
    }
  },
  clearByTag: function(tag) {
    var self = this;
    if(this.map) {
      var iter = this.map.geoObjects.getIterator();
      var item = iter.getNext();
      while(item != iter.STOP_ITERATION) {
        if(item.properties && item.properties.tag == tag) {
          self.map.geoObjects.remove(item);
          iter = this.map.geoObjects.getIterator();
        }

        item = iter.getNext();
      }
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