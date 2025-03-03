export const formatNumberWithCommas = (num: string) => {
	return num.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

export const sanitizeSatsInput = (value: string) => {
	const cleaned = value.replace(/[^0-9.]/g, '');

	const sanitized = cleaned === "0" ? "0" : cleaned.replace(/^0+/, '');

	const formatted = formatNumberWithCommas(sanitized);
	return formatted;
};

export const parseCommaFormattedSats = (formattedValue: string): number => {
	return parseInt(formattedValue.replace(/,/g, '')) || 0;
};

