import { Period } from "@/Components/Dropdowns/LVDropdown";

export const getUnixTimeRange = (period: Period, offset: number) => {
	const now = new Date();
	let from_unix: number, to_unix: number;

	switch (period) {
		case Period.WEEK: {
			const firstDayOfWeek = new Date(new Date().setDate(now.getDate() - now.getDay() + (offset * 7))).setHours(0, 0, 0, 0);
			const lastDayOfWeek = new Date(new Date().setDate(now.getDate() - now.getDay() + 6 + (offset * 7))).setHours(23, 59, 59, 999);
			from_unix = Math.floor(firstDayOfWeek / 1000);
			to_unix = Math.floor(lastDayOfWeek / 1000);
			break;
		}

		case Period.MONTH: {
			const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth() + offset, 1).getTime();
			const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1 + offset, 0).setHours(23, 59, 59, 999);
			from_unix = Math.floor(firstDayOfMonth / 1000);
			to_unix = Math.floor(lastDayOfMonth / 1000);
			break;
		}

		case Period.YEAR: {
			const firstDayOfYear = new Date(now.getFullYear() + offset, 0, 1).getTime();
			const lastDayOfYear = new Date(now.getFullYear() + offset, 11, 31).setHours(23, 59, 59, 999);
			from_unix = Math.floor(firstDayOfYear / 1000);
			to_unix = Math.floor(lastDayOfYear / 1000);
			break;
		}
		case Period.ALL_TIME:
			return undefined
	}
	return { from_unix, to_unix };
}
