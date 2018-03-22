let request = require("request");
let cryptos = require("./cryptos.js");
let config = require("./config.js");
let baseCoin = config.baseCoin;//'BTC';
let orderNumber = config.orderNumber; //500
let targetCoin = config.targetCoin;
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
		marketName: "bitstamp",
		URL: "https://www.bitstamp.net/api/v2/ticker/" + targetCoin.toLowerCase() + baseCoin.toLowerCase(),
		toBTCURL: false,
		pairURL : "",
		last: function (data, coin_prices) { //To find the last price of coin in JSON data
			return new Promise(function (res, rej) {
				try {
					let coinName = targetCoin;
					if (!coin_prices[coinName]) coin_prices[coinName] = {};
					coin_prices[coinName].bitstamp = data.last;
					res(coin_prices);
				}
				catch (err) {
                    debugger
					// console.log(err);
					// rej(err);
				}

			});
		},
		orderBook: function(type, targetCoin){
			let url = "https://www.bitstamp.net/api/v2/order_book/" + targetCoin.toLowerCase() + baseCoin.toLowerCase();
            
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
                        debugger
						// console.log("Error getting JSON response from", url, error); 
						// reject(error);
					}

				});
			});
		}
	},




	{
		marketName: "bittrex",
		URL: "https://bittrex.com/api/v1.1/public/getticker?market=" + baseCoin + "-" + targetCoin.toUpperCase(),
		toBTCURL: false,
		pairURL : "",
		last: function (data, coin_prices_origin) { //To find the last price of coin in JSON data
			return new Promise(function (res, rej) {
				try {
                    let coin_prices = {...coin_prices_origin}
					let coinName = targetCoin;
					if (!coin_prices[coinName]) coin_prices[coinName] = {};
					coin_prices[coinName].bittrex = data.result.Last;
                    if (!coin_prices.LTC.bittrex){
                        debugger
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
						console.log("Error getting JSON response from", url, error); 
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
                   
					let pair = baseCoin + "_" + targetCoin;
					if (data[pair]){
						let coinName = targetCoin;
						if (!coin_prices[coinName]) coin_prices[coinName] = {};
						coin_prices[coinName].poloniex = data[pair].last;
					} else{
						throw new Error("Poloniex does not have this pair.");
					}

					res(coin_prices);
				}
				catch (err) {
                    debugger
					// console.log(err);
					// rej(err);
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
						debugger
                        // console.log("Error getting JSON response from", url, error); //Throws error
						// reject(error);
					}

				});
			});
		}

	},
    
];

let marketNames = [];
for(let i = 0; i < markets.length; i++) { 
	marketNames.push([[markets[i].marketName], [markets[i].pairURL]]);
}
console.log("Markets:", marketNames);
module.exports = function () {

	this.markets = markets;
	this.marketNames = marketNames;
    this.targetCoin = targetCoin;
	baseCoinPrice.then(function(x){
		this.baseCoinPrice = x;
	});
};
//markets = array of object
//marketnames = array of array [name. url]