var services = {
  currency: {
    rur: { name: "Рубли" },
    usd: { name: "Доллары"},
    eur: { name: "Евро"},
  },
  
  get_money: function(data){
    var result = "<p>Выдача наличных. В наличии:<br/>";
    var currency;
    for(c in data){
	if(!data.hasOwnProperty (c) || !this.currency[c] ) continue;
	
	currency = data[c];
	
	result += this.currency[c].name + ": ";
	for(var  i = 0; i < currency.length; i++){
	  result += currency[i].value;
	  if( i != currency.length-1 ) result += ", ";
	}
	result += "<br/>";
    }  
	
    
    return result;
  },
  main: function(data){
      return "";
  }
  
}


var Services = function( data ){
  
  
  
  return {
    print: function(){
	var result = "";
	for(service in data){
	  if(!data.hasOwnProperty (service) || !services[service] ) continue;
	  
	  result += services[service](data[service]);
	}
	return result;
    }
  };
};

