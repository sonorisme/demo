let request = require("request");
let cryptos = require("./cryptos.js");
let config = require("./config.js");
let baseCoin = config.baseCoin;//'BTC';
let orderNumber = config.orderNumber; //500
let baseCoinPrice = new Promise(function (res, rej) {
	request("https://api.coinmarketcap.com/v1/ticker/" + cryptos[baseCoin], function (error, response, body) {
            
		try {
			let data = JSON.parse(body);
			console.log("getting base coin price: ", data[0]["price_usd"]);
			res(data[0]["price_usd"]);

		} catch (error) {
			console.log("Error getting JSON response for base coin price!"); //Throws error
			rej(error);
		}

	});
});


let markets = [

	{
		marketName: "bittrex",
		URL: "https://bittrex.com/api/v1.1/public/getmarketsummaries",
		toBTCURL: false,
		pairURL : "",
		last: function (data, coin_prices) { //Where to find the last price of coin in JSON data
			return new Promise(function (res, rej) {
				try {
					for (let obj of data.result) {
						if(obj["MarketName"].includes(baseCoin + "-")) {
							let coinName = obj["MarketName"].replace(baseCoin + "-", "");
							if (!coin_prices[coinName]) coin_prices[coinName] = {};
							coin_prices[coinName].bittrex = obj.Last;
						}
					}
					res(coin_prices);
				}
				catch (err) {
					console.log(err);
					rej(err);
				}

			});
		},
		orderBook: function(type, targetCoin){
			let url = "";
			if (type == "buy"){
				url = "https://bittrex.com/api/v1.1/public/getorderbook?market=" + baseCoin + "-" + targetCoin.toUpperCase() + "&type=buy";
			} else {
				url = "https://bittrex.com/api/v1.1/public/getorderbook?market=" + baseCoin + "-" + targetCoin.toUpperCase() + "&type=sell";

			}
			return new Promise(function (resolve, reject) {
				request(url, function (error, response, body) {
					try {
						let data = JSON.parse(body);
						let orders = [];
						console.log("Success: Retrieving orders - " + type);
						if (data.result.length > orderNumber){
							for (let i = 0; i < orderNumber; i++){
								orders.push(data.result[i]);
							}
						} else {
							data.result.map(x => orders.push(x));
						}
						resolve(orders);
					} catch (error) {
						console.log("Error getting JSON response from", url, error); //Throws error
						reject(error);
					}

				});
			});
		}
	},

	{
		marketName: "poloniex",
		URL: "https://poloniex.com/public?command=returnTicker",
		toBTCURL: false,
		pairURL : "",
		last: function (data, coin_prices) { //To find the last price of coin in JSON data
			return new Promise(function (res, rej) {
				try {
					for (var obj in data) {
						if(obj.includes(baseCoin + "_")&&obj!=="BTC_EMC2") {
							let coinName = obj.replace(baseCoin + "_", "");
							if (!coin_prices[coinName]) coin_prices[coinName] = {};
							coin_prices[coinName].poloniex = data[obj].last;
						}
					}
					res(coin_prices);
				}
				catch (err) {
					console.log(err);
					rej(err);
				}

			});
		},
		orderBook: function(type, targetCoin){
			let url = "https://poloniex.com/public?command=returnOrderBook&currencyPair=" + baseCoin + "_" + targetCoin.toUpperCase() + "&depth=" + orderNumber;
      
			return new Promise(function (resolve, reject) {
				request(url, function (error, response, body) {
					try {
						let data = JSON.parse(body);
						let orders = [];
						console.log("Success: Retrieving orders - " + type);
						if (type == "buy"){
							let x = [];
							for (let i = 0; i < data.bids.length; i++){
								x[i] = {};
								x[i].Quantity = data.bids[i][1];
								x[i].Rate = data.bids[i][0];
								orders.push(x[i]);
							}
                            
						} else {
                       
							let x = [];
							for (let i = 0; i < data.asks.length; i++){
								x[i] = {};
								x[i].Quantity = data.asks[i][1];
								x[i].Rate = data.asks[i][0];
								orders.push(x[i]);
							}
                            
						}
                        
						resolve(orders);
					} catch (error) {
						console.log("Error getting JSON response from", url, error); //Throws error
						reject(error);
					}

				});
			});
		}

	}

];

let marketNames = [];
for(let i = 0; i < markets.length; i++) { 
	marketNames.push([[markets[i].marketName], [markets[i].pairURL]]);
}
console.log("Markets:", marketNames);
module.exports = function () {
	this.markets = markets;
	this.marketNames = marketNames;
	baseCoinPrice.then(function(x){
		this.baseCoinPrice = x;
	});
};
//markets = array of object
//marketnames = array of array [name. url]