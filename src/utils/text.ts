export const truncateTextMiddle = (
	address: string,
	startChars = 7,
	endChars = 7,
	separator = '...'
): string => {
	if (!address || address.length <= startChars + endChars) return address;
	return `${address.substring(0, startChars)}${separator}${address.substring(address.length - endChars)}`;
};