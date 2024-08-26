import { BackupAction } from "../types"
import { applyChange, observableDiff } from "deep-diff"


export const getDiffAsActionDispatch = <T>(
	remote: Record<string, T>,
	local: Record<string, T>,
	actionType: string,
	actions: BackupAction[]
): Record<string, T> => {
	const merged = JSON.parse(JSON.stringify(remote));

	observableDiff(
		remote,
		local,
		(d) => {
			if (d.kind === "N") {
				actions.push({
					type: actionType,
					payload: d.rhs
				});
				applyChange(merged, local, d);
			}
		},
		(path) => path.length === 1
	);

	return merged;	
}

export const mergeBasicRecords = (local: Record<string, any>, remote: Record<string, any>,): Record<string, any> => {
	return { ...remote, ...local }
}




export const mergeRecords = <T>(local: Record<string, T>, remote: Record<string, T>, mergeItem: (local: T, remote: T) => T) => {
	for (const key in remote) {
		if (!local[key]) {
			local[key] = remote[key]
		} else {
			local[key] = mergeItem(local[key], remote[key])
		}
	}
	return local
}


export const mergeArrayValues = <T>(remote: T[], local: T[], getId: (v: T) => string): T[] => {
	const record: Record<string, T> = {}
	remote.forEach(r => record[getId(r)] = r)
	local.forEach(l => record[getId(l)] = l)
	return Object.values(record)
}






