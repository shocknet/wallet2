export const truncateString = (str: string, maxLength: number): string => {
    if (str.length > maxLength) {
        return `${str.substring(0, 10)}...${str.substring(str.length - 10, str.length)}`;
    } else {
        return str;
    }
}