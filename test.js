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
const buy = require('./ltc.js')
const sell = require('./ltc2.js')

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
BTC | 10 | 10 | 10 | 30
LTC |1000 | 1000 | 1000 | 3000` + "\n\n")}

function printBalance(){
	let totalBtc = accountOrigin.bittrex.btc + accountOrigin.bitstamp.btc + accountOrigin.poloniex.btc
	let totalLtc = accountOrigin.bittrex.ltc + accountOrigin.bitstamp.ltc + accountOrigin.poloniex.ltc
	fs.appendFileSync('demo.md', `##### Account Balance
. | Bittrex | Bitstamp | Poloniex | Total
--- | ---:| ---:| ---:| ---:
BTC | ${accountOrigin.bittrex.btc} | ${accountOrigin.bitstamp.btc} | ${accountOrigin.poloniex.btc} | ${totalBtc}
LTC | ${accountOrigin.bittrex.ltc} | ${accountOrigin.bitstamp.ltc} | ${accountOrigin.poloniex.ltc} | ${totalLtc}
` + "\n\n")
}

createDemoMd();

matchOrders(sell, buy, 'ltc', 'bittrex', 'bitstamp')
function matchOrders(buy, sell, title, market1, market2){
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
			let ii = 0
			buyHowMuch(a, b);			
			function buyHowMuch(x, y, z){
				function writeTofile(output){
					//holder["market impact"] = (((baseCoinPrice * totalBTCCost) / holder["market cap usd"]) * 100) + "%";
					let totalFees = (totalBTCCost * feeRate + (Number(totalBTCCost) + Number(totalBTCProfit)) * feeRate);

					//The latest compared order does not count into total orders we buy or sell
					if (z == 1){
						//fs.appendFileSync("log/orderSpecifics.md", "Altcoin: " + title + "\nTotal Cost: " + totalBTCCost + " BTC (" + totalBTCCost * baseCoinPrice + " USD)\n" + "Total Profit: " + (totalBTCProfit-(totalBTCCost * feeRate + (Number(totalBTCCost) + Number(totalBTCProfit)) * feeRate)) + "BTC (" + (totalBTCProfit - (totalBTCCost * feeRate + (Number(totalBTCCost) + Number(totalBTCProfit)) * feeRate)) * baseCoinPrice + " USD)\n" + "Profit to Cost Ratio: " + (totalBTCProfit/totalBTCCost) * 100 + "%\n" + "Market Impact: " + "\n" + "Buy " + Number(x) +" orders and sell " + Number(y + 1) + " orders.\n" + "Buyer Market: " + market1 + ", Seller Market: " + market2 + "\n------------------------------\n");                
						if (totalBTCProfit - totalFees > 0){
							console.log(sentence)
							debugger
							fs.appendFileSync('demo.md', sentence + "\n\n")
							accountOrigin = account
							printBalance()
							//fs.appendFileSync("output/results.txt", "Altcoin: " + title + "\nTotal Cost: " + totalBTCCost + "BTC (" + totalBTCCost * baseCoinPrice + " USD)\n" + "Toalt fees: " + (totalBTCCost * feeRate + (Number(totalBTCCost) + Number(totalBTCProfit)) * feeRate) + " BTC (" + (totalBTCCost * feeRate + (Number(totalBTCCost) + Number(totalBTCProfit)) * feeRate ) * baseCoinPrice + " USD)\nTotal Profit: " + (totalBTCProfit-(totalBTCCost * feeRate + (Number(totalBTCCost) + Number(totalBTCProfit)) * feeRate)) + "BTC (" + (totalBTCProfit-(totalBTCCost * feeRate + (Number(totalBTCCost) + Number(totalBTCProfit)) * feeRate)) * baseCoinPrice + " USD)\n" + "Profit to Cost Ratio: " + (totalBTCProfit/totalBTCCost) * 100 + "%\n" + "Buy " + Number(x) +" orders and sell " + Number(y + 1) + " orders.\n" + "Buyer Market: " + market1 + ", Seller Market: " + market2 + "\n------------------------------\n");
							resolve([buyPairs, sellPairs, title, market2, market1]);
						} else{
							reject("Wanted profit not met!");
						}
					} else if (z == 2) {
						fs.appendFileSync("log/orderSpecifics.md", "Altcoin: " + title + "\nTotal Cost: " + totalBTCCost + "BTC (" + totalBTCCost * baseCoinPrice + " USD)\n" + "Total Profit: " + (totalBTCProfit-(totalBTCCost * feeRate + (Number(totalBTCCost) + Number(totalBTCProfit)) * feeRate)) + "BTC (" + (totalBTCProfit-(totalBTCCost * feeRate + (Number(totalBTCCost) + Number(totalBTCProfit)) * feeRate)) * baseCoinPrice + " USD)\n" + "Profit to Cost Ratio: " + (totalBTCProfit/totalBTCCost) * 100 + "%\n" + "Buy " + Number(x + 1) +" orders and sell " + Number(y) + " orders.\n" + "Buyer Market: " + market1 + ", Seller Market: " + market2 + "\n------------------------------\n");
						if (totalBTCProfit - totalFees > 0){
							fs.appendFileSync('demo.md', sentence + "\n\n")
							accountOrigin = account
							printBalance()
							//fs.appendFileSync("output/results.txt", "Altcoin: " + title + "\nTotal Cost: " + totalBTCCost + "BTC (" + totalBTCCost * baseCoinPrice + " USD)\n" + "Toalt fees: " + (totalBTCCost * feeRate + (Number(totalBTCCost) + Number(totalBTCProfit)) * feeRate) + "BTC (" + (totalBTCCost * feeRate + (Number(totalBTCCost) + Number(totalBTCProfit)) * feeRate ) * baseCoinPrice + " USD)\nTotal Profit: " + (totalBTCProfit-(totalBTCCost * feeRate + (Number(totalBTCCost) + Number(totalBTCProfit)) * feeRate)) + "BTC (" + (totalBTCProfit-(totalBTCCost * feeRate + (Number(totalBTCCost) + Number(totalBTCProfit)) * feeRate)) * baseCoinPrice + " USD)\n" + "Profit to Cost Ratio: " + (totalBTCProfit/totalBTCCost) * 100 + "%\n" + "Buy " + Number(x + 1) +" orders and sell " + Number(y) + " orders.\n" + "Buyer Market: " + market1 + ", Seller Market: " + market2 + "\n------------------------------\n");
							resolve([buyPairs, sellPairs, title, market2, market1]);
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
						//Buy From | Balance | Amount | Price | Total | Sell at | Balance | Amount | Price | Total
// 						if (ii == 0){
// 						fs.appendFileSync('demo.md', `#### Transactions
// Buy From | Balance | Amount | Price | Total | Sell at | Balance | Amount | Price | Total 
// --- | ---:| ---:| ---:| ---:| --- | ---:| ---:| ---:| ---:` + "\n")	
// 							ii++						
// 						}
					
							let balanceSell = {}, balanceBuy = {}
							let sellParty = market2.toLowerCase()
							let buyParty = market1.toLowerCase()
							
							balanceSell.ltc = account[sellParty].ltc + Number(sellOrders[x].Quantity) 
							balanceSell.btc = account[sellParty].btc - sellOrders[x].Quantity * sellOrders[x].Rate
							balanceBuy.ltc = account[buyParty].ltc - Number(sellOrders[x].Quantity)
							balanceBuy.btc = account[buyParty].btc + sellOrders[x].Quantity * buyOrders[y].Rate
							//fs.appendFileSync('demo.md', `${sellParty} | ${balanceSell.ltc} ltc, ${balanceSell.btc} btc | ${sellOrders[x].Rate} | ${sellOrders[x].Quantity * sellOrders[x].Rate} | ${buyParty} | ${balanceBuy.ltc} ltc, ${balanceBuy.btc} btc | ${sellOrders[x].Quantity} | ${buyOrders[y].Rate} | ${sellOrders[x].Quantity * buyOrders[y].Rate} ` + "\n")
							//console.log(sentence + "\n\n")
							sentence = sentence + `${sellParty} | ${balanceSell.ltc} ltc, ${balanceSell.btc} btc | ${sellOrders[x].Quantity} | ${sellOrders[x].Rate} btc | ${sellOrders[x].Quantity * sellOrders[x].Rate} | ${buyParty} | ${balanceBuy.ltc} ltc, ${balanceBuy.btc} btc | ${sellOrders[x].Quantity} | ${buyOrders[y].Rate} btc | ${sellOrders[x].Quantity * buyOrders[y].Rate} ` + "\n"
							//console.log(sentence)
							//debugger
							account[sellParty].ltc = balanceSell.ltc
							account[sellParty].btc = balanceSell.btc
							account[buyParty].ltc = balanceBuy.ltc
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
// 						if (ii == 0){
// 						fs.appendFileSync('demo.md', `#### Transactions
// Buy From | Balance | Amount | Price | Total | Sell at | Balance | Amount | Price | Total 
// --- | ---:| ---:| ---:| ---:| --- | ---:| ---:| ---:| ---:` + "\n")	
// 							ii++						
// 						}
						
							let balanceSell = {}
							let balanceBuy = {}
							let sellParty = market2.toLowerCase()
							let buyParty = market1.toLowerCase()
							balanceSell.ltc = account[sellParty].ltc + Number(buyOrders[y].Quantity) 
							balanceSell.btc = account[sellParty].btc - buyOrders[y].Quantity * sellOrders[x].Rate
							
							balanceBuy.ltc = account[buyParty].ltc - Number(buyOrders[y].Quantity)
							balanceBuy.btc = account[buyParty].btc + buyOrders[y].Quantity * buyOrders[y].Rate
							//fs.appendFileSync('demo.md', `${sellParty} | ${balanceSell.ltc} ltc, ${balanceSell.btc} btc | ${sellOrders[x].Rate} | ${buyOrders[y].Quantity * sellOrders[x].Rate} | ${buyParty} | ${balanceBuy.ltc} ltc, ${balanceBuy.btc} btc | ${buyOrders[y].Quantity} | ${buyOrders[y].Rate} | ${buyOrders[y].Quantity * buyOrders[y].Rate} ` + "\n")
							sentence = sentence + `${sellParty} | ${balanceSell.ltc} ltc, ${balanceSell.btc} btc | ${buyOrders[y].Quantity} | ${sellOrders[x].Rate} btc | ${buyOrders[y].Quantity * sellOrders[x].Rate} btc | ${buyParty} | ${balanceBuy.ltc} ltc, ${balanceBuy.btc} btc | ${buyOrders[y].Quantity} | ${buyOrders[y].Rate} | ${buyOrders[y].Quantity * buyOrders[y].Rate} ` + "\n"
							account[sellParty].ltc = balanceSell.ltc
							account[sellParty].btc = balanceSell.btc
							account[buyParty].ltc = balanceBuy.ltc
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