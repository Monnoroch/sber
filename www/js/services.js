var services = {
  currency: {
    rur: { name: "Рубли", icon: "<span class='rur'>p<span>уб.</span></span>" },
    usd: { name: "Доллары", icon: "$"},
    eur: { name: "Евро", icon: "€"},
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
    }
  };
};

