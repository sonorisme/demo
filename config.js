module.exports = {
    initialAccount: {
        bitstamp: {
            btc: 10,
            ltc: 1000
        },
        bittrex: {
            btc: 10,
            ltc: 1000
        },
        poloniex: {
            btc: 10,
            ltc: 1000
        }
    },
	tradeOnlyPair: 1,
	target: 0.00000001,//For setting baseline for the gap between last deal price of 2 exchanges
	wantedProfit: 0.1,// two way exchange fees are normally 0.5%, should be higher than 0.5 to cover the exchange fees
	baseCoin: "BTC",
	targetCoin: "LTC",
	orderNumber: 500, //Exchange api retrun 500 orders in orderbook in maximum 
	feeRate: 0.000001,// Exchange fee rate 0.0025
	budget: 10,//BTC, limit of each transaction
	interval: 5000, // Call api every 10 sec
	credentials: {
    	bittrex: {
    		key: "111",
    		secret: "111"
    	},
    	poloniex: {
    		key: "111",
    		secret: "111"
    	},
    	bleutrade: {
    		key: "111",
    		secret: "111"
    	},
    	bitstamp: {
    		key: "111",
    		secret: "111",
    		client: "ddddd"
    	}
	} 
};