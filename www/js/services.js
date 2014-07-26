var services = {
  currency: {
    rur: {
      name: "Рубли",
      icon: "<span class='rur'>p<span>уб.</span></span>",
      values: [1000, 5000, 10000, 20000, 50000, 100000, 200000, 500000, 1000000, "more"],
    },
    usd: { name: "Доллары", icon: "$",
      values: [ 20, 100, 200, 400, 1000, 2000, 4000, 10000, 20000, "more" ]
    },
    eur: { name: "Евро", icon: "€",
      values: [ 20, 100, 200, 400, 1000, 2000, 4000, 10000, 20000, "more" ]
    },
  },
  
  get_money: function(data){
    var result;
    var currency;
    var ul;
    result = $("<div data-role='collapsible' data-inset='false'  data-collapsed-icon='arrow-r' data-expanded-icon='arrow-d'>")
      .append( "<h3>Выдача наличных</h3>" )
      .append( ul = $("<ul data-role='listview'>") )
    for(c in data){
	if(!data.hasOwnProperty (c) || !this.currency[c] ) continue;
	
	currency = data[c];
	
	for(var  i = 0; i < currency.length; i++){
	  ul.append( "<li>" + currency[i].value + " " + this.currency[c].icon +  "</li>" );
	}
    }  
    ul.listview();
    result.collapsible( );
	
    
    return result;
  },
  main: function(data){
      return "";
  },
  
  moneySet: function(currency){
      var val = this.currency[ currency ].values;
      var result = $();
      var c;
      for( var  i = 0; i < val.length; i++ ){
	if( i%5 == 0 ){
	  c = $("<div>");
	  result = result.add(c);
	}
	if( val[i] == "more" ){
	  c.append( "<a href='#' class='ui-btn ui-corner-all value' value='" + val[i] + "'>Больше</a>" );
	}else{
	  c.append( "<a href='#' class='ui-btn ui-corner-all value' value='" + val[i] + "'>" + val[i].printInt() +  "</a>" );
	}
	
      }
      
      //result = result.add( c = $("<div/>", {class: "last"}) )
      for(i in this.currency){
	  if(!this.currency.hasOwnProperty (i) ) continue;
	  result = result.add( "<a href='#' class='ui-btn ui-corner-all currency' value='" + i + "'>" + this.currency[i].name + "</a>" );
      }
      return result;
      
    }
  
}


var Services = function( data ){
  
  return {
    print: function(){
	var result = $("<div>");
	for(service in data){
	  if(!data.hasOwnProperty (service) || !services[service] ) continue;
	  
	  result.append( services[service](data[service]) );
	}
	return result;
    },
  };
};

