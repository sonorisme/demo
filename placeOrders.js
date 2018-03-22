//With dummy api secrets, poloniex throw error, bittrex don't, instead output false in its returned json.

//result = [ array buyPairs, array sellPairs, string title, string sellerMarket, string buyerMarket]
//const config = require("./config.js");

const Promise = require("bluebird");
// const request = require("request");
// const Bittrex = require("bittrex-wrapper");
// const bittrex = new Bittrex(config.credentials.bittrex.key , config.credentials.bittrex.secret);
// const Poloniex = require("poloniex-api-node");
// const poloniex = new Poloniex(config.credentials.poloniex.key, config.credentials.poloniex.secret);

// const Bitstamp = require("bitstamp");
// const bitstamp = new Bitstamp(config.credentials.bitstamp.key , config.credentials.bitstamp.secret);
const fs = require("fs");
//const secondMatch = require("./secondMatch");
//result: [buyPairs, sellPairs, title, holder['market1']['name']----selletMarket, holder['market2']['name']-----buyerMarket]
module.exports = function placeOrders(result, baseCoin){
	switch(result[3]){
	case "bittrex":
		
		if (true){
			let orderResults = [];
			let resultOfBuy = result[0].map(function(x){
				

				// return bittrex.marketBuyLimit(baseCoin+'-'+result[2], x[0], x[1]).then(function(y){
				 // 		if (y.error){
				 // 			throw new Error(y.error)
				 // 		}
				 // 		if (!y.success){
				 // 			throw new Error('Success state: ' + y.success + ', Reason: ' + y.message)
				 // 		}
				 // 		return y;
				// })
				let a = `Place Buy order at Bittrex: Pair: ${baseCoin}-${result[2]}, Quantity: ${x[0]}, Rate: ${x[1]}`;
				fs.appendFileSync("demoForPlaceOrder.js", a + "\n");
				return 1;
					

			});
					
				
			Promise.all(resultOfBuy).then(function(x){
				// 	orderResults = x;
				
				// 	bittrex.marketGetOpenOrders(baseCoin+'-'+result[2]).then(function(orders){
				// 		console.log(orders)
				// 	}).catch(function(e){
				// 		throw e;
				// 	})
				// marketCancel(uuid) - Used to cancel a buy or sell order
				// uuid - required uuid of buy or sell order
				fs.appendFileSync("demoForPlaceOrder.js", "-----End of Orders-------\n");
				
			});
				
				
		}
		break;
	case "bitstamp":
		if (true){
			let orderResults = [];
			let resultOfBuy = result[0].map(function(x){
				//currencyPair, rate, amount, fillOrKill, immediateOrCancel, postOnly [, callback])
				// return new Promise(function(res, rej){
				// 	bitstamp.buy(result[2].toLowerCase() + baseCoin.toLowerCase(), x[0], x[1], x[1] + 100, function(result){
			

				// 		if (y.error || !y.success){
				// 			throw new Error(y.error)
				// 		}
				// 		if (!y.success){
				// 			throw new Error('Success state: ' + y.success)
				// 		}

				// 		res(b);
				// 	});
				// })
				let a = `Place Buy order at Bitstamp: Pair: ${baseCoin}-${result[2]}, Quantity: ${x[0]}, Rate: ${x[1]}`;
				fs.appendFileSync("demoForPlaceOrder.js", a + "\n");
				return 1;
											
					
			});
			Promise.all(resultOfBuy).then(function(x){
				// orderResults = x;
					
				// bitstamp.open_orders(result[2].toLowerCase() + baseCoin.toLowerCase(), function(a, b){
				// 	console.log(a, b)
				// }).catch(function(e){
				// 	throw e
				// })
				//bitstamp.cancel_order(id, console.log)
				fs.appendFileSync("demoForPlaceOrder.js", "-----End of Orders-------\n");					
					
			});
				
				
		}
		break;
			

	case "poloniex":
		if (true){
			let orderResults = [];
			let resultOfBuy = result[0].map(function(x){
				//currencyPair, rate, amount, fillOrKill, immediateOrCancel, postOnly [, callback])
				// return poloniex.buy(baseCoin+'_'+result[2], x[1], x[0], false, false, false).then((y) => {
				//   	if (y.error || !y.success){
				//   		throw new Error(y.error)
				//   	}
				//   	if (!y.success){
				//   		throw new Error('Success state: ' + y.success)
				//   	}

				//   	return y;
				// })
				let a = `Place Buy order at Poloniex: Pair: ${baseCoin}-${result[2]}, Quantity: ${x[0]}, Rate: ${x[1]}`;
				fs.appendFileSync("demoForPlaceOrder.js", a + "\n");
				return 1;
					
			});
			Promise.all(resultOfBuy).then(function(x){
				// orderResults = x;
					
				// poloniex.returnOpenOrders( baseCoin+'_'+result[2]).then(function(orders){
				// 	console.log(orders)
				// }).catch(function(e){
				// 	throw e
				// })
				//cancelOrder(orderNumber [, callback])
				fs.appendFileSync("demoForPlaceOrder.js", "-----End of Orders-------\n");					
					
			});
		}
		break;
			
	case "bleutrade":
		break;
	default:
	}

	switch(result[4]){
	case "bittrex":
		if (true){
			let orderResults = [];
			let resultOfSell = result[1].map(function(x){
				// return bittrex.marketSellLimit(baseCoin+'-'+result[2], x[0], x[1]).then(function(y){
				// 	if (y.error){
				// 		throw new Error(y.error)
				// 	}
				// 	if (!y.success){
				// 		throw new Error('Success state: ' + y.success  + ', Reason: '+ y.message)
				// 	}
				 // 		return y;
				// })
				let a = `Place sell order at Bittrex: Pair: ${baseCoin}-${result[2]}, Quantity: ${x[0]}, Rate: ${x[1]}`;
				fs.appendFileSync("demoForPlaceOrder.js", a + "\n");
				return 1;
					
			});
					
				
			Promise.all(resultOfSell).then(function(x){
				// orderResults = x;
				
				// bittrex.marketGetOpenOrders(baseCoin+'-'+result[2]).then(function(orders){
				// 	console.log(orders)
				// }).catch(function(e){
				// 	throw e;
				// })
			
			});
				

		}
		break;

	case "bitstamp":
		if (true){
			let orderResults = [];
			let resultOfBuy = result[1].map(function(x){
				// return new Promise(function(res, rej){
				// 	bitstamp.sell(result[2].toLowerCase() + baseCoin.toLowerCase(), x[0], x[1], x[1] + 100, function(a, b){
				// 		console.log(a, b);

				// 		if (y.error || !y.success){
				// 			throw new Error(y.error)
				// 		}
				// 		if (!y.success){
				// 			throw new Error('Success state: ' + y.success)
				// 		}

				// 		res(b);
				// 	});
				// })
				let a = `Place sell order at Bitstamp: Pair: ${baseCoin}-${result[2]}, Quantity: ${x[0]}, Rate: ${x[1]}`;
				fs.appendFileSync("demoForPlaceOrder.js", a + "\n");
				return 1;
											
				
			});
			Promise.all(resultOfBuy).then(function(x){
				// orderResults = x;
					
				// bitstamp.open_orders(result[2].toLowerCase() + baseCoin.toLowerCase(), function(a, b){
				// 	console.log(a, b)
				// }).catch(function(e){
				// 	throw e
				// })
				//bitstamp.cancel_order(id, console.log)

			});
				
				
		}
		break;
			
			
	case "poloniex":
		if (true){
			let orderResults = [];
			let resultOfSell = result[1].map(function(x){
				//currencyPair, rate, amount, fillOrKill, immediateOrCancel, postOnly [, callback])
				// return poloniex.sell(baseCoin+'_'+result[2], x[1], x[0], false, false, false).then((y) => {
				//   	if (y.error || !y.success){
				 // 			throw new Error(y.error)
				 // 		}
				 // 		if (!y.success){
				 // 			throw new Error('Success state: ' + y.success)
				 // 		}
				//   	return y;
				// })
				let a = `Place sell order at Poloniex: Pair: ${baseCoin}-${result[2]}, Quantity: ${x[0]}, Rate: ${x[1]}`;
				fs.appendFileSync("demoForPlaceOrder.js", a + "\n");
				return 1;
				
			});
			Promise.all(resultOfSell).then(function(x){
				// orderResults = x;
				
				// poloniex.returnOpenOrders( baseCoin+'_'+result[2]).then(function(orders){
				// 	console.log(orders)
				// }).catch(function(e){
				// 	throw e
				// })
		
			});
			
		}
		break;
				
	case "bleutrade":
		break;
	default:

	}
};