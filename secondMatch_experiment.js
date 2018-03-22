//strategy is cancell all open orders and add the unfulfilled portion of open orders 
//into the selected orders


const config = require("./config");
if (config.tradeOnlyPair){
	require("./settings3.js")(); 
} else{
	require("./settings2.js")(); 
}


let sellerData = require("./sellerdata");
let buyerData = require("./buyerdata");

async function openOrders_weBuy(openOrdersPassed, sellerExchange, targetCoin){
	var openOrders = JSON.parse(JSON.stringify(openOrdersPassed));
	for (let i = 0; i < markets.length; i++){
		if (markets[i].marketName == sellerExchange){
			return [await callApi(markets[i]), sellerExchange, targetCoin];
			break;
		}
	}
	function callApi(exchange){
		//newApiCall is promise of array of objects{Quantity, Rate}
		let newApiCall = exchange.orderBook("sell", targetCoin); 
		 return newApiCall.then(function(newOrders){
			let selectOrders = [];
			for (let i = 0; i < openOrders.length; i++){
				if (newOrders[0].Rate <= openOrders[i].Rate){
					if ( newOrders[0].Quantity >= openOrders[i].Quantity){
						
						selectOrders.push({ Quantity: openOrders[i].Quantity, Rate: newOrders[0].Rate});
						newOrders[0].Quantity -= openOrders[i].Quantity;
						openOrders[i].Quantity -= openOrders[i].Quantity; 
				
						return secondMatch(0, i + 1);
					} else {
						selectOrders.push({Quantity: newOrders[0].Quantity, Rate: newOrders[0].Rate});
						newOrders[0].Quantity -= newOrders[0].Quantity;
						openOrders[i].Quantity -= newOrders[0].Quantity; 

						return secondMatch(1, i);
					}
					break;
				} else if (i == openOrders.length - 1){
					throw new Error("Can not execute any open orders");
				} 
			}
			function secondMatch(indexNew, indexFail){
				if (indexNew == newOrders.length || indexFail == openOrders.length) {
					console.log("finished");

					//combining order we place the second time with the left open orders,
					//then cancell all open orders,
					//then execute the combined orders
					let filteredOpenOrders = openOrders.filter(function(x){
						return x.Quantity > 0;
					});
					let selectAndLeft = selectOrders.concat(filteredOpenOrders);
				

					return selectAndLeft;
				}
				else if (newOrders[indexNew].Rate <= openOrders[indexFail].Rate){
					if ( newOrders[indexNew].Quantity >= openOrders[indexFail].Quantity){

						selectOrders.push({Quantity: openOrders[indexFail].Quantity, Rate: newOrders[indexNew].Rate});
						newOrders[indexNew].Quantity -= openOrders[indexFail].Quantity;
						openOrders[indexFail].Quantity -= openOrders[indexFail].Quantity; 

						return secondMatch(indexNew, indexFail + 1);
					} else {
						
						selectOrders.push({Quantity: newOrders[indexNew].Quantity, Rate: newOrders[indexNew].Rate});
						newOrders[indexNew].Quantity -= newOrders[indexNew].Quantity;
						openOrders[indexFail].Quantity -= newOrders[indexNew].Quantity; 

						return secondMatch(indexNew + 1, indexFail);
					}
				} else {
					if (newOrders[indexNew].Rate > openOrders[indexFail].Rate){
						return secondMatch(indexNew, indexFail + 1 );
					} else {
						throw new Error("unexpected!!!!!!");
						
					}
				}
			}
		}).then(function(x){
			//[orders to place plus the rest of open order]
			return x;
		}).catch( function (e){
			console.log("Open orders match error: " + e);
			throw e;
		});	
	}
}


async function openOrders_weSell(openOrdersPassed, buyerExchange, targetCoin){
	var openOrders = JSON.parse(JSON.stringify(openOrdersPassed));

	for (let i = 0; i < markets.length; i++){
		if (markets[i].marketName == buyerExchange){
			return [await callApi(markets[i]), buyerExchange, targetCoin];
			break;
		}
	}
	function callApi(exchange){
		//newApiCall is promise of array of objects{Quantity, Rate}
		let newApiCall = exchange.orderBook("buy", targetCoin); 
		return newApiCall.then(function(newOrders){
			let selectOrders = [];

			for (let i = 0; i < openOrders.length; i++){
				if (newOrders[0].Rate >= openOrders[i].Rate){
					if ( newOrders[0].Quantity >= openOrders[i].Quantity){
						
						selectOrders.push({Quantity: openOrders[i].Quantity, Rate: newOrders[0].Rate});
						newOrders[0].Quantity = newOrders[0].Quantity - openOrders[i].Quantity;
						openOrders[i].Quantity = openOrders[i].Quantity - openOrders[i].Quantity; 
				
						return secondMatch(0, i + 1);
					} else {

						selectOrders.push({Quantity: newOrders[0].Quantity, Rate: newOrders[0].Rate});
						newOrders[0].Quantity = newOrders[0].Quantity - newOrders[0].Quantity;
						openOrders[i].Quantity = openOrders[i].Quantity - newOrders[0].Quantity; 

						return secondMatch(1, i);
					}
					break;
				} else if (i == openOrders.length - 1){
					throw new Error("Can not execute any open orders");
				} 

			}
			function secondMatch(indexNew, indexFail){
				if (indexNew == newOrders.length || indexFail == openOrders.length) {
					console.log("finished");
					let filteredOpenOrders = openOrders.filter(function(x){
						return x.Quantity > 0;
					});
					let selectAndLeft = selectOrders.concat(filteredOpenOrders);
					return [selectAndLeft];
				}
				else if (newOrders[indexNew].Rate >= openOrders[indexFail].Rate){
					if ( newOrders[indexNew].Quantity >= openOrders[indexFail].Quantity){

						selectOrders.push({ Quantity: openOrders[indexFail].Quantity, Rate: newOrders[indexNew].Rate});
						newOrders[indexNew].Quantity = newOrders[indexNew].Quantity - openOrders[indexFail].Quantity;
						openOrders[indexFail].Quantity = openOrders[indexFail].Quantity - openOrders[indexFail].Quantity; 

						return secondMatch(indexNew, indexFail + 1);
					} else {
					
						selectOrders.push({ Quantity: newOrders[indexNew].Quantity, Rate: newOrders[indexNew].Rate});
						newOrders[indexNew].Quantity = newOrders[indexNew].Quantity - newOrders[indexNew].Quantity;
						openOrders[indexFail].Quantity = openOrders[indexFail].Quantity - newOrders[indexNew].Quantity; 

						return secondMatch(indexNew + 1, indexFail);
					}
				} else {
					if (newOrders[indexNew].Rate < openOrders[indexFail].Rate){
						return secondMatch(indexNew, indexFail + 1 );
					} else {
						throw new Error("unexpected!!!!!!");
						
					}
				}
			}
		}).then(function(x){
			//x : [select orders plus left open orders]
			return x;
		}).catch( function (e){
			console.log("Open orders match error: " + e);
			throw e;
		});	
	}
}

module.exports = {
	weBuy: openOrders_weBuy,
	weSell: openOrders_weSell
};