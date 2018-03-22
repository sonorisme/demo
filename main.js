"use strict";

console.log("Starting app...");

const config = require("./config.js");
const request = require("request"); 
const Promise = require("bluebird"); 
const express = require("express");
const app = express();
const util = require("util");
const jsonFormat = require("json-format");
const fs = require("fs");
const cryptos = require("./cryptos.js");
const placeOrders = require("./placeOrders.js");

if (config.tradeOnlyPair){
	require("./settings2.js")(); 
} else{
	require("./settings1.js")(); 
}

//global variables
let coinNames = [];
let lastResults = []; 
let focusGroup = [];
let id = 0;
let target = config.target;//0.0005;
let wantedProfit = config.wantedProfit;//0.4;
let baseCoin = config.baseCoin;//'BTC';
let budget = config.budget;//BTC
let feeRate = config.feeRate;
let accountOrigin = config.initialAccount;
let iteration = 1;
//coin_prices: coinname->exchangeName->lastPrice
let coin_prices = {}, numberOfRequests = 0, results = []; 

function createDemoMd(){
	fs.writeFileSync('demo.md', `### Initial Account
. | Bittrex | Bitstamp | Poloniex | Total
--- | ---:| ---:| ---:| ---:
BTC | ${accountOrigin.bittrex.btc} | ${accountOrigin.bitstamp.btc} | ${accountOrigin.poloniex.btc} | ${accountOrigin.bittrex.btc + accountOrigin.bitstamp.btc + accountOrigin.poloniex.btc}
${targetCoin} | ${accountOrigin.bittrex[targetCoin]} | ${accountOrigin.bitstamp[targetCoin]} | ${accountOrigin.poloniex[targetCoin]} | ${accountOrigin.bittrex[targetCoin] + accountOrigin.bitstamp[targetCoin] + accountOrigin.poloniex[targetCoin]}
` + "\n\n")}

function printBalance(){
	let totalBtc = accountOrigin.bittrex.btc + accountOrigin.bitstamp.btc + accountOrigin.poloniex.btc
	let totalTargetCoin = accountOrigin.bittrex[targetCoin.toLowerCase()] + accountOrigin.bitstamp[targetCoin.toLowerCase()] + accountOrigin.poloniex[targetCoin.toLowerCase()]
	fs.appendFileSync('demo.md', `##### Account Balance
. | Bittrex | Bitstamp | Poloniex | Total
--- | ---:| ---:| ---:| ---:
BTC | ${accountOrigin.bittrex.btc} | ${accountOrigin.bitstamp.btc} | ${accountOrigin.poloniex.btc} | ${totalBtc}
${targetCoin} | ${accountOrigin.bittrex[targetCoin.toLowerCase()]} | ${accountOrigin.bitstamp[targetCoin.toLowerCase()]} | ${accountOrigin.poloniex[targetCoin.toLowerCase()]} | ${totalTargetCoin}
` + "\n\n")
}

createDemoMd();

(async function main() {
	console.log("Iteration: " + iteration);
	iteration++;
	let arrayOfRequests = [];

	for (let i = 0; i < markets.length; i++) {
		// console.log(coin_prices)
		// debugger
		arrayOfRequests.push(getMarketData(markets[i], coin_prices));
	}

	await Promise.all(arrayOfRequests.map(p => p.catch(e => e)))
		.then(results => { 
			return computePrices(coin_prices)
		})
		.catch(e => console.log(e));

	setTimeout(main, config.interval);
})();

function getMarketData(market, coin_prices) {
	let coin_prices_copy = {...coin_prices}
	return new Promise(function (resolve, reject) {
		request(market.URL, function (error, response, body) {
			try {
				let data = JSON.parse(body);
				console.log("Success", market.marketName);
				console.log(market.marketName)
				let newCoinPrices = market.last(data, coin_prices, market.toBTCURL);
				newCoinPrices.then(function(x){
					numberOfRequests++;
					if (numberOfRequests >= 1){
						computePrices(coin_prices); 
					}
					resolve(x) 
				}).catch(e=> {
					console.log('this is the problem: '+e)
				})					
				

				// newCoinPrices.then(function(x){
				// 	if (!x){
				// 		console.log(x)
				// 		debugger
				// 	}
					
				// })

			} catch (error) {
				console.log("Error getting JSON response from", market.URL, error); //Throws error
				reject(error);
			}
		});
	});
}

function matchOrders(buy, sell, title, holder){

	let buyOrders = JSON.parse(JSON.stringify(buy));
	let sellOrders = JSON.parse(JSON.stringify(sell));
	let totalBTCProfit = 0;
	let totalBTCCost = 0;
	let buyPairs = [];
	let sellPairs = [];
	let account = {...accountOrigin}
	let sentence = `#### Transactions
Buy From | Balance | Amount | Price | Total | Sell at | Balance | Amount | Price | Total 
--- | ---:| ---:| ---:| ---:| --- | ---:| ---:| ---:| ---:` + "\n";

	return intermidiary( 0, 0);
 
	function intermidiary(a, b){
		return new Promise(function(resolve, reject){
			buyHowMuch(a, b);			
			function buyHowMuch(x, y, z){
				function writeTofile(output){
					holder["market impact"] = (((baseCoinPrice * totalBTCCost) / holder["market cap usd"]) * 100) + "%";
					let totalFees = (totalBTCCost * feeRate + (Number(totalBTCCost) + Number(totalBTCProfit)) * feeRate);

					//The latest compared order does not count into total orders we buy or sell
					if (z == 1){
						fs.appendFileSync("log/orderSpecifics.md", "Altcoin: " + title + "\nTotal Cost: " + totalBTCCost + " BTC (" + totalBTCCost * baseCoinPrice + " USD)\n" + "Total Profit: " + (totalBTCProfit-(totalBTCCost * feeRate + (Number(totalBTCCost) + Number(totalBTCProfit)) * feeRate)) + "BTC (" + (totalBTCProfit - (totalBTCCost * feeRate + (Number(totalBTCCost) + Number(totalBTCProfit)) * feeRate)) * baseCoinPrice + " USD)\n" + "Profit to Cost Ratio: " + (totalBTCProfit/totalBTCCost) * 100 + "%\n" + "Market Impact: " + holder["market impact"] + "\n" + "Buy " + Number(x) +" orders and sell " + Number(y + 1) + " orders.\n" + "Buyer Market: " + holder["market2"]["name"] + ", Seller Market: " + holder["market1"]["name"] + "\n------------------------------\n");                
						if (totalBTCProfit - totalFees > 0){
							let time = new Date()
							time = time.toLocaleTimeString('en-US')
							fs.appendFileSync('demo.md', sentence + "\n##### " + time + "\n\n")
							accountOrigin = account
							printBalance()
							fs.appendFileSync("output/results.txt", "Altcoin: " + title + "\nTotal Cost: " + totalBTCCost + "BTC (" + totalBTCCost * baseCoinPrice + " USD)\n" + "Toalt fees: " + (totalBTCCost * feeRate + (Number(totalBTCCost) + Number(totalBTCProfit)) * feeRate) + " BTC (" + (totalBTCCost * feeRate + (Number(totalBTCCost) + Number(totalBTCProfit)) * feeRate ) * baseCoinPrice + " USD)\nTotal Profit: " + (totalBTCProfit-(totalBTCCost * feeRate + (Number(totalBTCCost) + Number(totalBTCProfit)) * feeRate)) + "BTC (" + (totalBTCProfit-(totalBTCCost * feeRate + (Number(totalBTCCost) + Number(totalBTCProfit)) * feeRate)) * baseCoinPrice + " USD)\n" + "Profit to Cost Ratio: " + (totalBTCProfit/totalBTCCost) * 100 + "%\n" + "Market Impact: " + holder["market impact"] + "\n" + "Buy " + Number(x) +" orders and sell " + Number(y + 1) + " orders.\n" + "Buyer Market: " + holder["market2"]["name"] + ", Seller Market: " + holder["market1"]["name"] + "\n------------------------------\n");
							a = Object.keys(holder["top 3 sell orders"])[0];
							b = Object.keys(holder["top 3 buy orders"])[0];
							holder["top 3 sell orders"][a] = holder["top 3 sell orders"][a].slice(0, 3);
							holder["top 3 buy orders"][b] = holder["top 3 buy orders"][b].slice(0, 3);
							fs.appendFileSync("buytime.js", jsonFormat(holder));
							resolve([buyPairs, sellPairs, title, holder["market1"]["name"], holder["market2"]["name"]]);
						} else{
							reject("Wanted profit not met!");
						}
					} else if (z == 2) {
						fs.appendFileSync("log/orderSpecifics.md", "Altcoin: " + title + "\nTotal Cost: " + totalBTCCost + "BTC (" + totalBTCCost * baseCoinPrice + " USD)\n" + "Total Profit: " + (totalBTCProfit-(totalBTCCost * feeRate + (Number(totalBTCCost) + Number(totalBTCProfit)) * feeRate)) + "BTC (" + (totalBTCProfit-(totalBTCCost * feeRate + (Number(totalBTCCost) + Number(totalBTCProfit)) * feeRate)) * baseCoinPrice + " USD)\n" + "Profit to Cost Ratio: " + (totalBTCProfit/totalBTCCost) * 100 + "%\n" +"Market Impact: " + holder["market impact"] + "\n" + "Buy " + Number(x + 1) +" orders and sell " + Number(y) + " orders.\n" + "Buyer Market: " + holder["market2"]["name"] + ", Seller Market: " + holder["market1"]["name"] + "\n------------------------------\n");
						if (totalBTCProfit - totalFees > 0){
							fs.appendFileSync('demo.md', sentence + "\n\n")
							accountOrigin = account
							printBalance()
							fs.appendFileSync("output/results.txt", "Altcoin: " + title + "\nTotal Cost: " + totalBTCCost + "BTC (" + totalBTCCost * baseCoinPrice + " USD)\n" + "Toalt fees: " + (totalBTCCost * feeRate + (Number(totalBTCCost) + Number(totalBTCProfit)) * feeRate) + "BTC (" + (totalBTCCost * feeRate + (Number(totalBTCCost) + Number(totalBTCProfit)) * feeRate ) * baseCoinPrice + " USD)\nTotal Profit: " + (totalBTCProfit-(totalBTCCost * feeRate + (Number(totalBTCCost) + Number(totalBTCProfit)) * feeRate)) + "BTC (" + (totalBTCProfit-(totalBTCCost * feeRate + (Number(totalBTCCost) + Number(totalBTCProfit)) * feeRate)) * baseCoinPrice + " USD)\n" + "Profit to Cost Ratio: " + (totalBTCProfit/totalBTCCost) * 100 + "%\n" +"Market Impact: " + holder["market impact"] + "\n" + "Buy " + Number(x + 1) +" orders and sell " + Number(y) + " orders.\n" + "Buyer Market: " + holder["market2"]["name"] + ", Seller Market: " + holder["market1"]["name"] + "\n------------------------------\n");
							a = Object.keys(holder["top 3 sell orders"])[0];
							b = Object.keys(holder["top 3 buy orders"])[0];
							holder["top 3 sell orders"][a] = holder["top 3 sell orders"][a].slice(0, 3);
							holder["top 3 buy orders"][b] = holder["top 3 buy orders"][b].slice(0, 3);
							fs.appendFileSync("buytime.js", jsonFormat(holder));
							resolve([buyPairs, sellPairs, title, holder["market1"]["name"], holder["market2"]["name"]]);
						} else{
							reject("Wanted profit not met!");
						}
					} else {
						reject("Exceeded budget!");
					}

				}
                
				if (!sellOrders[x] || !buyOrders[y]){
					writeTofile();
				}
				else if (sellOrders[x].Rate < buyOrders[y].Rate){

					let checkLimitBuy = totalBTCCost + sellOrders[x].Quantity * sellOrders[x].Rate;
					let checkLimitSell = checkLimitBuy + totalBTCProfit + Number(sellOrders[x].Quantity * buyOrders[y].Rate - sellOrders[x].Quantity * sellOrders[x].Rate);                  
					if (checkLimitBuy > budget || checkLimitSell > budget){
						writeTofile();
						return;
					}

					if (buyOrders[y].Quantity >= sellOrders[x].Quantity){
						//we buy all first sell order
					
						let balanceSell = {}, balanceBuy = {}
						let sellParty = holder["market1"]["name"].toLowerCase()
						let buyParty = holder["market2"]["name"].toLowerCase()
						balanceSell[targetCoin.toLowerCase()] = account[sellParty][targetCoin.toLowerCase()] + Number(sellOrders[x].Quantity) 
						balanceSell.btc = account[sellParty].btc - sellOrders[x].Quantity * sellOrders[x].Rate
						balanceBuy[targetCoin.toLowerCase()] = account[buyParty][targetCoin.toLowerCase()] - Number(sellOrders[x].Quantity)
						balanceBuy.btc = account[buyParty].btc + sellOrders[x].Quantity * buyOrders[y].Rate
						sentence = sentence + `${sellParty} | ${balanceSell[targetCoin.toLowerCase()]} ${targetCoin.toLowerCase()}, ${balanceSell.btc} btc | ${sellOrders[x].Quantity} | ${sellOrders[x].Rate} btc | ${sellOrders[x].Quantity * sellOrders[x].Rate} | ${buyParty} | ${balanceBuy[targetCoin.toLowerCase()]} ${targetCoin.toLowerCase()}, ${balanceBuy.btc} btc | ${sellOrders[x].Quantity} | ${buyOrders[y].Rate} btc | ${sellOrders[x].Quantity * buyOrders[y].Rate} ` + "\n"
						account[sellParty][targetCoin.toLowerCase()] = balanceSell[targetCoin.toLowerCase()]
						account[sellParty].btc = balanceSell.btc
						account[buyParty][targetCoin.toLowerCase()] = balanceBuy[targetCoin.toLowerCase()]
						account[buyParty].btc = balanceBuy.btc
					
					
						let a = "Seller Market Order Index: " + x + " | Order Type: Buy | Quantity: " + sellOrders[x].Quantity + " | Price: " + sellOrders[x].Rate + " BTC | Cost: " + sellOrders[x].Quantity * sellOrders[x].Rate;
						let b = "Buyer Market Order Index: " + y + " | Order Type: Sell | Quantity: " + sellOrders[x].Quantity + " | Price: " + buyOrders[y].Rate + " BTC | Earn: " + sellOrders[x].Quantity * buyOrders[y].Rate;
						let c = "Profit: " + (sellOrders[x].Quantity * buyOrders[y].Rate - sellOrders[x].Quantity * sellOrders[x].Rate) + " BTC"; 
						buyPairs.push([sellOrders[x].Quantity, sellOrders[x].Rate]);
						sellPairs.push([sellOrders[x].Quantity, buyOrders[y].Rate]);
						fs.appendFileSync("log/orderSpecifics.md", a + "\n" + b + "\n" + c + "\n");
						buyOrders[y].Quantity -= sellOrders[x].Quantity;
						totalBTCCost += Number(sellOrders[x].Quantity * sellOrders[x].Rate);
						totalBTCProfit += Number(sellOrders[x].Quantity * buyOrders[y].Rate - sellOrders[x].Quantity * sellOrders[x].Rate);
						buyHowMuch(x + 1, y, 1);
                        
					} else {
						//we buy portion of sell orders
						
						let balanceSell = {}, balanceBuy = {}
						let sellParty = holder["market1"]["name"].toLowerCase()
						let buyParty = holder["market2"]["name"].toLowerCase()
						balanceSell[targetCoin.toLowerCase()] = account[sellParty][targetCoin.toLowerCase()] + Number(buyOrders[y].Quantity) 
						balanceSell.btc = account[sellParty].btc - buyOrders[y].Quantity * sellOrders[x].Rate
						balanceBuy[targetCoin.toLowerCase()] = account[buyParty][targetCoin.toLowerCase()] - Number(buyOrders[y].Quantity)
						balanceBuy.btc = account[buyParty].btc + buyOrders[y].Quantity * buyOrders[y].Rate
						sentence = sentence + `${sellParty} | ${balanceSell[targetCoin.toLowerCase()]} ${targetCoin.toLowerCase()}, ${balanceSell.btc} btc | ${buyOrders[y].Quantity} | ${sellOrders[x].Rate} btc | ${buyOrders[y].Quantity * sellOrders[x].Rate} btc | ${buyParty} | ${balanceBuy[targetCoin.toLowerCase()]} ${targetCoin.toLowerCase()}, ${balanceBuy.btc} btc | ${buyOrders[y].Quantity} | ${buyOrders[y].Rate} | ${buyOrders[y].Quantity * buyOrders[y].Rate} ` + "\n"
						account[sellParty][targetCoin.toLowerCase()] = balanceSell[targetCoin.toLowerCase()]
						account[sellParty].btc = balanceSell.btc
						account[buyParty][targetCoin.toLowerCase()] = balanceBuy[targetCoin.toLowerCase()]
						account[buyParty].btc = balanceBuy.btc
				
						let a = "Seller Market Order Index: " + x + " | Order Type: Buy | Quantity: " + buyOrders[y].Quantity + " | Price: " + sellOrders[x].Rate + " BTC | Cost: " + buyOrders[y].Quantity * sellOrders[x].Rate;
						let b = "Buyer Market Order Index: " + y + " | Order Type: Sell | Quantity: " + buyOrders[y].Quantity + " | Price: " + buyOrders[y].Rate + " BTC | Earn: " + buyOrders[y].Quantity * buyOrders[y].Rate;
						let c = "Profit: " + (buyOrders[y].Quantity * buyOrders[y].Rate - buyOrders[y].Quantity * sellOrders[x].Rate) + " BTC"; 
						buyPairs.push([buyOrders[y].Quantity, sellOrders[x].Rate]);
						sellPairs.push([buyOrders[y].Quantity, buyOrders[y].Rate]);
						fs.appendFileSync("log/orderSpecifics.md", a + "\n" + b + "\n" + c + "\n");
						totalBTCCost += Number(buyOrders[y].Quantity * sellOrders[x].Rate);
						totalBTCProfit += Number(buyOrders[y].Quantity * buyOrders[y].Rate - buyOrders[y].Quantity * sellOrders[x].Rate);
                
						sellOrders[x].Quantity -= buyOrders[y].Quantity;
						buyHowMuch(x, y + 1, 2);
					}
					
				} else {
					//we dont buy
					if (x == 0 && y == 0){
						reject("No room for profit: All ask price is higher than all bid price");
					} else{
						writeTofile();
                       
					}
				}
			}
		});   
	}
}
//data is coin prices, {btc: { bittrex: 50usd, xxx: 50usd }, ltc: {xxx: xxx}}
async function computePrices(data) {
	results = [];
	function loopData() {
		return new Promise(function (resolve, reject){

			if (numberOfRequests >= 2) {
				for (let coin in data) {

					if (Object.keys(data[coin]).length > 1) {
						//coinNames: global empty array
						if (coinNames.includes(coin) == false) coinNames.push(coin);
						let arr = [];
						for (let market in data[coin]) {
							arr.push([data[coin][market], market]);//price and exchange name for each coin, [[30usd, bittrex], [...]]
						}
						arr.sort(function (a, b) {
							return a[0] - b[0];
						});

						//create result object
						for (let i = 0; i < arr.length; i++) {
							for (let j = i + 1; j < arr.length; j++) {

								if (arr[i][0] >= arr[j][0]){
							
									results.push(
										{
											coin: coin,
											difference: (arr[i][0] - arr[j][0]) / arr[j][0],
											time: new Date(),
											market2: {
												name: arr[i][1],
												last: arr[i][0]
											},
											market1: {
												name: arr[j][1],
												last: arr[j][0]
											}

										}
									);
								} else {
								
									results.push(
										{
											coin: coin,
											difference: (arr[j][0] - arr[i][0]) / arr[i][0],
											time: new Date(),
											market2: {
												name: arr[j][1],
												last: arr[j][0]
											},
											market1: {
												name: arr[i][1],
												last: arr[i][0]
											}

										}
									);
								}

								//compare each focus group element with the element just added in results array
								//if the difference of last prices between two different exchanges is higher than our target
								//get order books and place orders 
								if (focusGroup.length > 0){
									for (let i = focusGroup.length - 1; i >= 0; i--){
										if (focusGroup[i][0] == results[results.length - 1].coin && focusGroup[i][1] == results[results.length - 1].market1.name && focusGroup[i][2] == results[results.length - 1].market2.name) {
											focusGroup.splice(i, 1);
											console.log("Deleted from Watch list: " + focusGroup.length);
										}
										else if (focusGroup[i][0] == results[results.length - 1].coin && focusGroup[i][1] == results[results.length - 1].market2.name && focusGroup[i][2] == results[results.length - 1].market1.name) {
											if (focusGroup[i][3] > target) {
												let indexHolder = i;
												let holder = results[results.length - 1]; 
												holder.id = focusGroup[i][4];
												holder.timeOfIntersec = (results[results.length - 1].time - focusGroup[i][5]) / 1000 + " sec ago";

												focusGroup.splice(i, 1);
												console.log("Deleted from Watch list: " + focusGroup.length);

												let promiseHolder1, promiseHolder2, promiseHolder3;
												//get order books
												markets.map(function (a){
													if (a.marketName == holder.market2.name){
														if (!holder.coin){
															debugger
														}
														promiseHolder1 = a.orderBook("buy", holder.coin).then(function(x){
															let ordersWithMarket = {};
                                                           
															ordersWithMarket[a.marketName] = x;

															holder["top 3 buy orders"] = ordersWithMarket;
                                                            
                                                            
														}).catch( function (e){
															throw e;
															console.log("Wrong with fetching orderbook: " + e);
														});
													} else if (a.marketName == holder.market1.name){
														if (!holder.coin){
															debugger
														}
														promiseHolder2 = a.orderBook("sell", holder.coin).then(function(x){
															let ordersWithMarket = {};
                                                           
															ordersWithMarket[a.marketName] = x;
                                
															holder["top 3 sell orders"] = ordersWithMarket;
                                                            
														}).catch( function (e){
															throw e;
															console.log("Wrong with fetching orderbook: " + e);
														});
													}
												});

												//get market cap
												promiseHolder3 = new Promise(function (resolve, reject) {
													request("https://api.coinmarketcap.com/v1/ticker/" + cryptos[holder.coin], function (error, response, body) {
														try {
															let data = JSON.parse(body);
                                                            
															if (data[0]){
																if(data[0]["market_cap_usd"]){
																	resolve(data[0]["market_cap_usd"]);
																} else {
																	reject("market cap error!");
																}    
															} else {
																reject("market cap error!");
															}
														} catch (error) {
															console.log("Error getting JSON response from marketcap!"); //Throws error
															reject(error);
														}
													});
												}).then(function(x){
													holder["market cap usd"] = x;
												}).catch( function (e){
													throw e;
													console.log("wrong with fetching marketcap: " + e);
												});
                                                
												Promise.all([promiseHolder1, promiseHolder2, promiseHolder3]).then(function(x){
													var percent;
                                                   
													var a = Object.keys(holder["top 3 sell orders"])[0];
													var b = Object.keys(holder["top 3 buy orders"])[0];
													return matchOrders(holder["top 3 buy orders"][b], holder["top 3 sell orders"][a], holder.coin, holder);
                                                    
												}).then(function(x){
													placeOrders(x, baseCoin);
												}).catch(function(e){
													console.log(e);
												});
											}
										} 
									}
								}

								//look for intersection and add those into focus group
								for (var q = 0; q < lastResults.length; q++ ){
                                    
									if (lastResults[q].coin == results[results.length - 1].coin){    
										if (lastResults[q].market2.name == results[results.length - 1].market1.name && lastResults[q].market1.name == results[results.length - 1].market2.name && results[results.length - 1].difference > 0){
											results[results.length - 1].id = id;
											id++;
											focusGroup.push([results[results.length - 1].coin, results[results.length - 1].market2.name,results[results.length - 1].market1.name, results[results.length - 1].difference, id - 1, results[results.length - 1].time]);
											console.log("Added in Whatch List: " + focusGroup.length);
											fs.appendFile("log/intersection.json", jsonFormat([lastResults[q], results[results.length - 1]]), function(err){
												if (err) throw err;
												console.log("Price reversed!");
                                                
											});
										}
									}                              
								}
							}
						}
					}
				}
				results.sort(function (a, b) {
					return a.difference - b.difference;
				});
				resolve();
			}
		});
	}
	await loopData();
	lastResults = results;
}

