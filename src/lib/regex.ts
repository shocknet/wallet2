export const BITCOIN_ADDRESS_REGEX = /^(bitcoin:)?(bc1[qp][ac-hj-np-z02-9]{8,87}|[13][1-9A-HJ-NP-Za-km-z]{25,34})$/;
export const BITCOIN_ADDRESS_BASE58_REGEX = /^[13][1-9A-HJ-NP-Za-km-z]{25,34}$/;
export const LN_INVOICE_REGEX = /^(lightning:)?(lnbc|lntb)[0-9a-zA-Z]+$/;
export const LNURL_REGEX = /^(lightning:)?[Ll][Nn][Uu][Rr][Ll][0-9a-zA-Z]+$/;
export const NOFFER_REGEX = /^(lightning:)?[Nn][Oo][Ff][Ff][Ee][Rr][0-9a-zA-Z]+$/;
export const LN_ADDRESS_REGEX = /^(lightning:)?[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,24}$/;
