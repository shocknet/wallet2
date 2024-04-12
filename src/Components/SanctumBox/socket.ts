import { getClientKey } from "./helpers";

export interface Creds {
	accessToken: string;
	nsec: string;
	identifier: string;
}

type NewSocketReq = {
	sendOnOpen: Record<string, string | number | boolean>;
	onToStartSanctum: (requestToken: string, clientKey: string) => void;
	onError: (reason: string) => void;
	onSuccess: (data: Creds) => void;
	onGenericData?: (data: any) => void
	onUnexpectedClosure?: () => void;
	sanctumUrl: string;
};
const newSocket = ({
	sendOnOpen,
	onToStartSanctum,
	onError,
	onSuccess,
	onGenericData,
	onUnexpectedClosure,
	sanctumUrl
}: NewSocketReq) => {
	const toSendPrep = sendOnOpen;

	const clientKey = getClientKey();
	toSendPrep.clientKey = clientKey



	const ws = new WebSocket(
		`${sanctumUrl.replace("https", "wss").replace("http", "ws")}/`
	);
	let socketClosed = false;

	const closeSocket: () => void = () => {
		if (!socketClosed) {
			socketClosed = true;
			ws.close();
		}
	};
	ws.onclose = () => {
		if (!socketClosed) {
			console.log("Socket closed unexpectedly");
			if (onUnexpectedClosure) { onUnexpectedClosure() }
		}
	}
	ws.onopen = async () => {
		console.log("socketing..");
		const s = JSON.stringify(toSendPrep)
		ws.send(s);
	};
	ws.onmessage = event => {
		const parsed = JSON.parse(event.data as string);

		if (parsed.error) {
			closeSocket();
			onError(parsed.error as string);
			return;
		}
		if (parsed.accessToken) {
			closeSocket();
			onSuccess(parsed);
			return;
		}
		if (parsed.requestToken) {
			onToStartSanctum(parsed.requestToken as string, clientKey);
			return;
		}
		if (onGenericData) {
			onGenericData(parsed)
		}
	};
	return closeSocket;
};

export default newSocket;