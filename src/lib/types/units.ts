export type Bitcoin = number & { readonly __brand: unique symbol };
export type Satoshi = number & { readonly __brand: unique symbol };
export type MilliSatoshi = number & { readonly __brand: unique symbol };


export type AmountUnit = "BTC" | "sats";