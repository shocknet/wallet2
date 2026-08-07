import moment from "moment";
import { IonDatetime } from "@ionic/react";

type Props = {
	value: number;
	onChange: (expiresAtUnix: number) => void;
};

export function ExpirationRuleEditor({ value, onChange }: Props) {
	return (
		<div className="flex flex-col items-center gap-2">
			<p className="self-start text-sm text-muted">
				Expires in {moment.unix(value).fromNow(true)}
			</p>

			<IonDatetime
				presentation="time-date"
				min={moment().toISOString()}
				value={moment.unix(value).toISOString()}
				firstDayOfWeek={1}
				onIonChange={(event) => {
					const raw = event.detail.value;
					const iso = Array.isArray(raw) ? raw[0] : raw;
					if (!iso) {
						return;
					}
					const nextUnix = moment(iso).unix();
					if (!Number.isFinite(nextUnix) || nextUnix === value) {
						return;
					}
					onChange(nextUnix);
				}}
			>
				<span slot="title">Select Debit Grant Expiration Date</span>
			</IonDatetime>
		</div>
	);
}
