export const describeSendFailure = (err: unknown): string => {
	if (err instanceof AggregateError) {
		for (const inner of err.errors) {
			const reason = describeSendFailure(inner);
			if (reason !== "send failed") return reason;
		}
		return err.message || "send failed";
	}
	if (typeof err === "string" && err.trim()) return err;
	if (err instanceof Error && err.message.trim()) return err.message;
	return "send failed";
};

/** EVENT was written; missing OK is not a failed RPC send. */
export const eventAlreadyPublished = (reason: string): boolean =>
	reason.toLowerCase().includes("publish timed out");
