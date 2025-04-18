import axios from "axios";
import { BitcoinTransaction } from "./types/mempool";



const MEMPOOL_API = "https://mempool.space/api";


async function fetchTransaction(txId: string) {
	try {
		const response = await axios.get(`${MEMPOOL_API}/tx/${txId}`);
		return response.data;
	} catch (error) {
		console.error("Error fetching transaction:", error);
		return null;
	}
}

async function fetchLatestBlockHeight() {
	try {
		const response = await axios.get(`${MEMPOOL_API}/blocks/tip/height`);
		return response.data;
	} catch (error) {
		console.error("Error fetching latest block height:", error);
		return null;
	}
}


export async function getTransaction(txId: string): Promise<BitcoinTransaction | null> {
	const data = await fetchTransaction(txId);

	if (!data) {
		console.error("Failed fetching tx data:", data);
		return null;
	}
	if (!data.status.confirmed) {
		return { txId, confirmations: 0, fee: data.status.fee };
	}
	const latestBlockHeight = await fetchLatestBlockHeight();
	if (!latestBlockHeight) {
		console.log("Failed fetching latest block height");
		return null;
	}

	return { txId, confirmations: latestBlockHeight - data.status.block_height + 1, fee: data.status.fee };

}
