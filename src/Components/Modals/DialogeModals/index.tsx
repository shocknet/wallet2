import { IonButton, IonButtons, IonCol, IonGrid, IonHeader, IonIcon, IonInput, IonRow, IonText, IonTitle, IonToolbar } from "@ionic/react";


import { checkmark, closeOutline, copyOutline } from "ionicons/icons";
import styles from "./styles/index.module.scss";
import classNames from "classnames";
import { useState } from "react";


export const BackupKeysDialog = ({ dismiss }: { dismiss: (data: undefined, role: "cancel" | "file" | "done") => void }) => {
	return (
		<>
			<IonHeader className="ion-no-border">
				<IonToolbar >
					<IonTitle>
						<IonText className="text-medium text-lg text-weight-high">
							Dialog header
						</IonText>
					</IonTitle>
					<IonButtons slot="end">
						<IonButton onClick={() => dismiss(undefined, "cancel")}><IonIcon icon={closeOutline} /></IonButton>
					</IonButtons>
				</IonToolbar>
			</IonHeader>

			<div className={classNames(styles["wrapper"], "ion-padding")}>
				<IonText className="text-low ion-text-wrap">
					Save this key to your preferred password manager, you may use it to log in and sync across devices, or recover your node connections and settings if you get logged out.
				</IonText>
				<IonGrid style={{ margin: 0 }} >
					<IonRow className="ion-margin-top" style={{ alignItems: "baseline" }}>
						<IonCol style={{ flex: 1 }}>
							<IonInput
								fill="outline"
								className={styles["password-input"]}
								type="password"
							></IonInput>
						</IonCol>
						<IonCol style={{ flex: 0 }}>
							<IonButton fill="clear">
								<IonIcon icon={copyOutline} />
							</IonButton>
						</IonCol>
					</IonRow>
					<IonRow className="ion-justify-content-end" style={{ gap: "12px", marginTop: "2rem" }}>
						<IonCol size="auto">
							<IonButton color="dark" onClick={() => dismiss(undefined, "file")}>
								Download as file
							</IonButton>
						</IonCol>
						<IonCol size="auto">
							<IonButton>
								Done
							</IonButton>
						</IonCol>
					</IonRow>
				</IonGrid>
			</div>
		</>
	);
};




export const DownloadFileBackupDialog = ({ dismiss }: { dismiss: (data: undefined, role: "cancel" | "done") => void }) => {
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");


	const match = password.length && password === confirmPassword;

	const handleDownloadBackup = () => {
		/* TODO */
	}


	return (
		<>
			<IonHeader className="ion-no-border">
				<IonToolbar >
					<IonTitle>
						<IonText className="text-medium text-lg text-weight-high">
							Encrypt File
						</IonText>
					</IonTitle>
					<IonButtons slot="end">
						<IonButton onClick={() => dismiss(undefined, "cancel")}><IonIcon icon={closeOutline} /></IonButton>
					</IonButtons>
				</IonToolbar>
			</IonHeader>

			<div className={classNames(styles["wrapper"], "ion-padding")}>
				<IonText className="text-low">
					Add an encryption password to your backup file so that no unauthorized software can read it.
				</IonText>
				<IonGrid style={{ margin: 0 }}>
					<IonRow className="ion-margin-top ion-justify-content-center ion-align-items-center" style={{ gap: "2rem" }}>
						<IonCol size="4">
							<IonInput
								fill="outline"
								className={styles["password-input"]}
								type="password"
								value={password}
								onIonInput={(e) => setPassword(e.detail.value || "")}

							></IonInput>
						</IonCol>
						<IonCol size="4">
							<IonInput
								fill="outline"
								className={styles["password-input"]}
								type="password"
								value={confirmPassword}
								onIonInput={(e) => setConfirmPassword(e.detail.value || "")}
							></IonInput>
						</IonCol>
						<IonCol size="auto">
							<IonIcon icon={checkmark} color="success" size="large" />
						</IonCol>
					</IonRow>
					<IonRow className="ion-justify-content-end" style={{ gap: "12px", marginTop: "2rem" }}>
						<IonCol size="auto">
							<IonButton color="dark">
								Cancel
							</IonButton>
						</IonCol>
						<IonCol size="auto">
							<IonButton disabled={!match} onClick={handleDownloadBackup}>
								Done
							</IonButton>
						</IonCol>
					</IonRow>
				</IonGrid>
			</div >
		</>
	);
};

