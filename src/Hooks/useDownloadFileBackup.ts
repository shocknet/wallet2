import { useCallback } from "react";
import { usePasswordCreationModal } from "@/Components/password/PasswordCreationModal";
import { KeyPair } from "@/Api/helpers";
import { makeIdentityFileBackupPmUsername } from "@/lib/pmParams";
import { useToast } from "@/lib/contexts/useToast";
import { downloadNsecBackup } from "@/lib/file-backup";

export function useDownloadFileBackup(keyPair: KeyPair) {
	const { showToast } = useToast();
	const askCreateFileBackupPassword = usePasswordCreationModal(
		makeIdentityFileBackupPmUsername(keyPair.publicKey),
		"Create a password to encrypt your file backup with. You will need to enter this password when importing the backup file on a different device."
	);

	const handleDownloadFileBackup = useCallback(async () => {
		const result = await askCreateFileBackupPassword();
		if (result.role !== "confirm") {
			showToast({
				color: "warning",
				message: "Please provide a password to encrypt your file backup.",
			});
			return;
		}
		try {
			await downloadNsecBackup(keyPair.privateKey, result.data);
		} catch (err: unknown) {
			showToast({
				color: "warning",
				message: err instanceof Error ? err.message : "An error occured when downloading the file backup",
			});
		}

	}, [keyPair, askCreateFileBackupPassword, showToast]);

	return handleDownloadFileBackup;
}
