### Introduction

This piece of program is a Node.js trading system that does automatic high frequency arbitrage between cryptocurrency exchanges.

### Entry point

```node main```

### Disclaimer

__USE THE SOFTWARE AT YOUR OWN RISK. YOU ARE RESPONSIBLE FOR YOUR OWN MONEY. PAST PERFORMANCE IS NOT NECESSARILY INDICATIVE OF FUTURE RESULTS.__

__THE AUTHORS AND ALL AFFILIATES ASSUME NO RESPONSIBILITY FOR YOUR TRADING RESULTS.__

### Code Information

The trade results are output in `results.txt` file in the `output` directory, while detailed logs are stored in `orderSpecifics.txt` file in the `log` directory.

#### Implemented Exchanges

Set `tradeOnlyPair` to `true` in `config.js` to trade only one pair, and multiple pairs vise versa.
 
| Exchange | Trade Multiple Pairs | Trade Single Pair |
| -------- |:----:|:-----:|
|Bitstamp|X|✓|
|Bittrex|✓|✓|
|Poloniex|✓|✓|
|Bleutrade|✓|X|


### main.js
Part of this file and setting.js is inherited from the NPM package.
2 functions ```getMarketData()``` and ```computePrices()``` are from the NPM package. First one is for creating an object with every crypto coin as its properties: ```{btc: { bittrex: 50usd, bitstamp: 50usd, ... }, ltc: {xxx: xxx}, ... }```. ```computePrices()``` is to take the object(`coin_prices`) created by `getMarketData()` as input to calculate the price differences of each coin between each possible exchange pair and put in to an array ordered ascendently by the price difference. Codes was added in this function to detect price intersection of two exchanges and if the difference of prices between two different exchanges is higher than our target set in config.js, then get order books and place orders.
```computePrices()``` indicates the coin and the exchanges where the difference between the last prices of the exchanges is higher than our wanted profit. For example, the difference is 1% for LTC between Bittrex and Bitstamp and the target is 0.5%. ```matchOrders()``` is the function I created to compare the bid orders and ask orders from respective exchanges. It compares both price and quantity to decide how many to buy or sell at what price.

### setting1.js & setting2.js
These files store exchange-specific methods and properties.
setting1.js is for trading all pairs and setting2.js for only one designated pair.

### placeOrders.js & placeOrders_origin.js
API wrappers for exchanges for placing orders. 
In line 15 in main.js, include placeOrders.js for testing which will output results in log and output directories, while placeOrders_origin.js has code for placing actual orders.
**Here if assume the default mode of placing orders via API is Fully Filled Only, then the next step of calling API for retrieving open orders will return every order that is not executed yet. On the contrary, if the default is Partially filled enabled, whether the API for retrieving remaining open orders will return the left part of those partially filled orders is not sure.**

**The strategy is to create 2 arrays to store quantity-rate pairs for respective bid and ask market. Whenever the orders listed in ask market have lower price than the bid market, calculate the available quantity, then add the quantity-rate pair in the array. Lastly pass the arrays with coin pair to ```placeOrders()``` which loop through all quantity-rate pair to place orders.**

### secondMatch.js
The function in the file receives those orders that hang in the exchange and cannot be executed as parameter. It then makes another API call for updated orderbook from the relevent exchange to see whether new oerders with better price come up. Then place the new orders to replace those old ones that are not executed, namely cancelling open orders and placing new orders with better price to match the new orders in the orderbook. 
In secondMatch_experiment.js, **assume open orders can only be cancelled as whole.** For example, there is an open order to buy 100 LTC at 0.1 BTC for each hanging in the exchange. then call API after 5sec for updated orderbooks. Say ,there is a new ask order with 0.09 BTC per LTC, but quantity is 50
**The strategy here is to place two new buy orders of {quantity: 50, rate: 0.09} and {quantity: 50, rate: 0.1} and one order that cancels the previous open order of {quantity: 100, rate: 0.1}.** 

### Problems
1. Ocasionally generates identical repetitive results in results.txt in output directory. Still debugging.
2. As mentioned in secondMatch.js section, when an order can only be cancelled as whole, one single open order can result in 3 more seperate API calls instantly. The problem is that some exchanges, for example Poloniex, only allow 6 APIs per sec.
3. The default option of API for placing order is unkonw. For example Poloniex has options like fillOrKill, imidiateOrCancel, while other one takes only price, quantity, pair as parameters, so what is the default is not sure.