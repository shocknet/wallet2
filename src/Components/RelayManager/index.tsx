import {
	IonItem, IonButton, IonIcon, IonInput, IonText,
} from "@ionic/react";
import { addOutline, closeOutline } from "ionicons/icons";
import { useEffect, useMemo, useRef, useState } from "react";
import { nanoid } from "nanoid";
import deepEqual from "fast-deep-equal";
import { normalizeWsUrl } from "@/lib/url";


type RelayManagerProps = {
	relays: string[];
	setRelays: React.Dispatch<React.SetStateAction<string[]>>;
};

type Row = { id: string; raw: string };




const normalizeRelay = (s: string): string | null => {
	const trimmed = s.trim();
	if (!trimmed) return null;
	try {
		const res = normalizeWsUrl(trimmed);
		return res;
	} catch {
		return null;
	}
};


const rowsFromRelays = (vals: string[]): Row[] => {
	const base = vals.length ? vals : [""];
	return base.map(v => ({ id: nanoid(), raw: v }));
};

export const RelayManager = ({ relays, setRelays }: RelayManagerProps) => {

	const [rows, setRows] = useState<Row[]>(() => rowsFromRelays(relays));


	const inputsRef = useRef<(HTMLIonInputElement | null)[]>([]);
	const prevLen = useRef(rows.length);


	useEffect(() => {
		const parentNorm = Array.from(
			new Set(relays.map(r => normalizeRelay(r)).filter(Boolean) as string[])
		);
		const localNorm = Array.from(
			new Set(
				rows
					.map(r => normalizeRelay(r.raw))
					.filter(Boolean) as string[]
			)
		);
		if (!deepEqual(parentNorm, localNorm)) {
			setRows(rowsFromRelays(parentNorm.length ? parentNorm : [""]));
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [relays]);


	useEffect(() => {
		if (rows.length > prevLen.current) {
			// next tick so IonInput is rendered
			setTimeout(() => inputsRef.current[rows.length - 1]?.setFocus(), 0);
		}
		prevLen.current = rows.length;
	}, [rows.length]);


	const problems = useMemo(() => {
		const errs = new Map<string, string>();
		const seen = new Map<string, string>(); // norm -> rowId
		rows.forEach((row) => {
			if (!row.raw.trim()) return; // allow empty while editing
			const norm = normalizeRelay(row.raw);
			if (!norm) {
				errs.set(row.id, "Invalid relay URL");
				return;
			}
			if (seen.has(norm)) {
				errs.set(row.id, "Duplicate relay");

			} else {
				seen.set(norm, row.id);
			}
		});
		return errs;
	}, [rows]);

	// Debounced emit to parent (canonical, unique, valid)
	useEffect(() => {
		const t = setTimeout(() => {
			const cleaned = Array.from(
				new Set(
					rows
						.map(r => normalizeRelay(r.raw))
						.filter(Boolean) as string[]
				)
			);
			setRelays((prev) => (deepEqual(prev, cleaned) ? prev : cleaned));
		}, 250);
		return () => clearTimeout(t);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [rows]);


	const updateRow = (id: string, val: string) => {
		setRows(rs => rs.map(r => (r.id === id ? { ...r, raw: val } : r)));
	};

	const removeRow = (id: string) => {
		setRows(rs => {
			const next = rs.filter(r => r.id !== id);
			return next.length ? next : [{ id: nanoid(), raw: "" }];
		});
	};

	const addRow = () => {
		const last = rows[rows.length - 1];
		const lastErr = problems.get(last.id);
		if (!last || !last.raw.trim() || lastErr) return;
		setRows(rs => [...rs, { id: nanoid(), raw: "" }]);
	};

	const onBlurNormalize = (id: string) => {
		setRows(rs =>
			rs.map(r => {
				if (r.id !== id) return r;
				const norm = normalizeRelay(r.raw);
				return { ...r, raw: norm ?? r.raw.trim() };
			})
		);
	};


	const lastDisabled = (() => {
		const last = rows[rows.length - 1];
		if (!last) return true;
		if (!last.raw.trim()) return true;
		return problems.has(last.id);
	})();

	return (
		<>
			{rows.map((row, idx) => (
				<div key={row.id}>
					<IonItem>
						<IonInput
							ref={el => (inputsRef.current[idx] = el)}
							mode="md"
							fill="outline"
							style={{ marginTop: "0.7rem" }}
							value={row.raw}
							spellCheck={false}
							placeholder="wss://relay.example.com"
							onIonInput={e => updateRow(row.id, e.detail.value ?? "")}
							onIonBlur={() => onBlurNormalize(row.id)}
							onKeyDown={e => {
								if (e.key === "Enter") {
									e.preventDefault();
									addRow();
								}
							}}
							autocapitalize="off"
							inputmode="url"
						>
							<IonButton
								slot="end"
								fill="clear"
								onClick={() => removeRow(row.id)}
								aria-label="Remove relay"
							>
								<IonIcon icon={closeOutline} />
							</IonButton>
						</IonInput>
					</IonItem>
					{problems.has(row.id) && (
						<IonItem lines="none">
							<IonText color="danger">{problems.get(row.id)}</IonText>
						</IonItem>
					)}
				</div>
			))}

			<IonButton
				expand="full"
				fill="clear"
				onClick={addRow}
				className="ion-margin-top"
				style={{ fontWeight: 600 }}
				disabled={lastDisabled}
			>
				<IonIcon icon={addOutline} slot="start" />
				Add new relay
			</IonButton>
		</>
	);
};
