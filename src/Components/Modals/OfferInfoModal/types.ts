export type OfferDraft = {
	label: string;
	price_sats: number;
	payer_data: string[];
	callback_url: string;
	rejectUnauthorized: boolean;
	token: string;
	blind: boolean | undefined;
};
