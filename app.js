const axios = require('axios');
const { isEmptyObject } = require('jquery');
const $ = require('jquery');
const JSONFileStorage = require('node-json-file-storage');

const apiKey = 'your-key-here';
const apiHost = 'coingecko.p.rapidapi.com';

const file_uri = __dirname + "/userdata.json";
const storage = new JSONFileStorage(file_uri);

$(() => { // Wait for document to load

    /**
     * Ping the API using ping endpoint and measure the latency in ms
     */
    const pingApi = () => {
        let options = {
            method: 'GET',
            url: 'https://coingecko.p.rapidapi.com/ping',
            headers: {
                'x-rapidapi-key': apiKey,
                'x-rapidapi-host': apiHost
            }
        };

        let startTime = new Date();
        axios.request(options).then(() => {
            let endTime = new Date();
            let latency = endTime - startTime;

            if (latency <= 100)
                $('#apitime').html(`CoinGecko API: <span style="color: #469374">${latency}ms</span>`);
            else if (latency > 100 && latency < 150)
                $('#apitime').html(`CoinGecko API: <span style="color: #f0c808">${latency}ms</span>`);
            else
                $('#apitime').html(`CoinGecko API: <span style="color: #e63946">${latency}ms</span>`);
        }).catch((error) => {
            $('#apitime').html(error);
            return false;
        });

        return true;
    };

    /**
     * Get all supported coins and put them into a select element
     */
    const getCoinsList = () => {
        let options = {
            method: 'GET',
            url: 'https://coingecko.p.rapidapi.com/coins/list',
            headers: {
                'x-rapidapi-key': apiKey,
                'x-rapidapi-host': apiHost
            }
        };

        axios.request(options).then((response) => {
            let data = response.data;

            data.forEach(coin => {
                $('select').append(new Option(coin.name, coin.id));
            });

        }).catch((error) => {
            console.error(error);
        });
    };

    /**
     * Add new coin to watch list
     */
    const addCoinToList = () => {
        let selectedCoin = $('select').val();
        let selectedCoinName = $('select').find('option:selected').text();
        let amount = $('input[name="amount"').val();

        let options = {
            method: 'GET',
            url: `https://coingecko.p.rapidapi.com/coins/${selectedCoin}`,
            params: {
                developer_data: 'false',
                market_data: 'true',
                sparkline: 'false',
                community_data: 'false',
                localization: 'false',
                tickers: 'false'
            },
            headers: {
                'x-rapidapi-key': apiKey,
                'x-rapidapi-host': apiHost
            }
        };

        axios.request(options).then((response) => {
            let currentPrice = response.data['market_data']['current_price']['eur'];
            let symbol = response.data['symbol'];
            let worth = currentPrice * amount;

            const id = saveToFile(selectedCoinName, selectedCoin, symbol, amount);

            $('#list').append(`
            <div id="${id}" class="row mb-1 p-1">
                <div class="col-12">
                    <div class="card text-white bg-dark">
                        <div class="card-header">
                            <b>${selectedCoinName.toLocaleUpperCase()}</b>
                        </div>
                        <div class="card-body">
                            <p class="text mb-0">
                                Exchange rate <b>1${symbol.toUpperCase()} = ${currentPrice}€</b><br />
                                You own <b>${amount + symbol.toUpperCase()}</b> worth <b>${worth.toFixed(2)}€</b>
                            </p>
                            <p class="d-none editform mb-0">
                                Enter new value
                                <input type="text" class="form-control" value="${amount}">
                                <button type="button" class="btn btn-success mt-2 editconfirmbtn" data-node-id="${id}" data-coin-name="${selectedCoinName}" data-coin-id="${selectedCoin}" data-symbol="${symbol}"><i class="fas fa-edit"></i> Confirm edit</button>
                            </p>
                        </div>
                        <div class="card-footer">
                            <button type="button" class="btn btn-success btn-sm editbtn" data-node-id="${id}"><i class="fas fa-edit"></i></button>
                            <button type="button" class="btn btn-danger btn-sm delbtn" data-node-id="${id}"><i class="fas fa-trash"></i></button>
                        </div>
                    </div>
                </div>
            </div>
            `);

        }).catch(function (error) {
            console.error(error);
        });
    };

    /**
     * Load all coin info from userdata and display in list
     */
    const loadFromFile = () => {
        const allCoins = storage.all();

        if (!isEmptyObject(allCoins)) {
            for (const [key, value] of Object.entries(allCoins)) {
                let options = {
                    method: 'GET',
                    url: `https://coingecko.p.rapidapi.com/coins/${value.coinId}`,
                    params: {
                        developer_data: 'false',
                        market_data: 'true',
                        sparkline: 'false',
                        community_data: 'false',
                        localization: 'false',
                        tickers: 'false'
                    },
                    headers: {
                        'x-rapidapi-key': apiKey,
                        'x-rapidapi-host': apiHost
                    }
                };

                axios.request(options).then((response) => {
                    let currentPrice = response.data['market_data']['current_price']['eur'];
                    let worth = currentPrice * value.amount;

                    $('#list').append(`
                    <div id="${value.id}" class="row mb-1 p-1">
                        <div class="col-12">
                            <div class="card text-white bg-dark">
                                <div class="card-header">
                                    <b>${value.coinName.toLocaleUpperCase()}</b>
                                </div>
                                <div class="card-body">
                                    <p class="text mb-0">
                                        Exchange rate <b>1${value.symbol.toUpperCase()} = ${currentPrice}€</b><br />
                                        You own <b>${value.amount + value.symbol.toUpperCase()}</b> worth <b>${worth.toFixed(2)}€</b>
                                    </p>
                                    <p class="d-none editform mb-0">
                                        Enter new value
                                        <input type="text" name="newvalue" class="form-control" value="${value.amount}">
                                        <button type="button" class="btn btn-success mt-2 editconfirmbtn" data-node-id="${value.id}" data-coin-name="${value.coinName}" data-coin-id="${value.coinId}" data-symbol="${value.symbol}"><i class="fas fa-edit"></i> Confirm edit</button>
                                    </p>
                                </div>
                                <div class="card-footer">
                                    <button type="button" class="btn btn-success btn-sm editbtn" data-node-id="${value.id}"><i class="fas fa-edit"></i></button>
                                    <button type="button" class="btn btn-danger btn-sm delbtn" data-node-id="${value.id}"><i class="fas fa-trash"></i></button>
                                </div>
                            </div>
                        </div>
                    </div>
                    `);
                }).catch(function (error) {
                    console.error(error);
                });
            }
        }
    };


    /**
     * Save coin info to userdata file
     * Returns id of the saved object
     * @param {String} coinName 
     * @param {String} coinId 
     * @param {String} symbol 
     * @param {Number} amount 
     */
    const saveToFile = (coinName, coinId, symbol, amount) => {
        const obj = {
            coinName: coinName,
            coinId: coinId,
            symbol, symbol,
            amount: amount
        };

        const id = storage.put(obj);

        return id;
    };

    /**
     * Delete coin from userdata file
     * Returns bool if delete was successful 
     * @param {String} id 
     */
    const delFromFile = (id) => {
        const bool = storage.remove(id);

        return bool;
    };

    /**
     * Listen on button click add call addCoinToList function
     */
    $("#addnew").on('click', () => {
        addCoinToList();
    });

    /**
     * Listen on delete button click and delete element + coin info from file
     */
    $(document).on('click', '.delbtn', (event) => {
        let targetNodeId = $(event.target).data('nodeId');

        if (delFromFile(targetNodeId))
            $(`#${targetNodeId}`).remove();
    });

    /**
     * Listen on edit button and show edit form
     */
    $(document).on('click', '.editbtn', (event) => {
        let targetNodeId = $(event.target).data('nodeId');
        $(`#${targetNodeId}`).find('.text').css('display', 'none');
        $(`#${targetNodeId}`).find('.editform').removeClass('d-none');
    });

    /**
     * Listen on edit confirm button and edit the node
     */
    $(document).on('click', '.editconfirmbtn', (event) => {
        let targetNodeId = $(event.target).data('nodeId');

        /**
         * Delete the old coin info a create new with edited data and refresh list from file
         */
        if (delFromFile(targetNodeId)) {
            saveToFile($(event.target).data('coinName'), $(event.target).data('coinId'), $(event.target).data('symbol'), $(`#${targetNodeId}`).find('input[name="newvalue"]').val());
            $('#list').html("");
            loadFromFile();
        }
    });

    /**
     * If ping is successful continue if not show API message
     */
    if (pingApi()) { 
        loadFromFile(); // Load all saved coin info
        getCoinsList();
    
        /**
         * Set interval to refresh list with current prices every 5 minutes
         */
        setInterval(() => {
            $('#list').html("");
            loadFromFile();
        }, 300000); // 5 mins
    } else {
        $('#list').append("<p class='text-white text-center'>There was a problem while connection to CoinGecko API. Is your API key correct?</p>");
    }

});