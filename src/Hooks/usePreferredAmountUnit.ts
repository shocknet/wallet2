import { AmountUnit } from "../lib/types/units"
import { usePreference } from "./usePreference"

export const usePreferredAmountUnit = () => {
	const { cachedValue, setValue, isLoaded } = usePreference<AmountUnit>("amountUnit", "sats");

	return { unit: cachedValue, setUnit: setValue, isLoaded };
}
