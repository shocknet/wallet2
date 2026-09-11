import { useCallback } from "react";
import { usePasswordCreationModal } from "@/Components/password/PasswordCreationModal";
import { passwordDeriveAndEcrypt } from "@/lib/aesGcm";
import { LOCAL_PRIVKEY_AAD } from "@/State/identitiesRegistry/helpers/platformSecretStorage";
import { useToast } from "@/lib/contexts/useToast";



export function useEncryptWithPassword(value: string, username?: string, description?: string) {
	const { showToast } = useToast();
	const askCreatePassword = usePasswordCreationModal(username, description);

	const encrypt = useCallback(async () => {
		const result = await askCreatePassword();
		if (result.role !== "confirm") {
			showToast({
				message: "No password provided",
				color: "error",
			});
			return;
		}

		try {
			const envelope = await passwordDeriveAndEcrypt({
				plaintext: value,
				aad: LOCAL_PRIVKEY_AAD,
				password: result.data,
			});

			return envelope;
		} catch {
			showToast({
				message: "Failed to encrypt value",
				color: "error",
			});
			return;
		}
	}, [askCreatePassword, value, showToast]);

	return encrypt;
}
