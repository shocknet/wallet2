import * as Types from "../../globalTypes";

export const fiatCurrencies: Types.FiatCurrency[] = [
    {
        url: 'https://api.coinbase.com/v2/prices/BTC-USD/spot',
        currency: 'USD',
        symbol: "$"
    },
    {
        url: 'https://api.coinbase.com/v2/prices/btc-eur/spot',
        currency: 'EUR',
        symbol: "€"
    },
    {
        url: 'https://api.coinbase.com/v2/prices/btc-cad/spot',
        currency: 'CAD',
        symbol: '$'
    },
    {
        url: 'https://api.coinbase.com/v2/prices/btc-brl/spot',
        currency: 'BRL',
        symbol: '$'
    },
    {
        url: 'https://api.coinbase.com/v2/prices/btc-mxp/spot',
        currency: 'MXP',
        symbol: '$'
    },
    {
        url: 'https://api.coinbase.com/v2/prices/btc-gbp/spot',
        currency: 'GBP',
        symbol: "£"
    },
    {
        url: 'https://api.coinbase.com/v2/prices/btc-chf/spot',
        currency: 'CHF',
        symbol: "CHF"
    },
    {
        url: 'https://api.coinbase.com/v2/prices/btc-jpy/spot',
        currency: 'JPY',
        symbol: "¥"
    },
    {
        url: 'https://api.coinbase.com/v2/prices/btc-aud/spot',
        currency: 'AUD',
        symbol: '$'
    }
]
