import React, { useCallback, useEffect, useRef, useState } from "react";
import { SandClock, SanctumSetting, SanctumChecked } from "./icons";
import newSocket, { Creds } from "./socket";
import { Browser } from '@capacitor/browser';
import { formatTime, getClientKey } from "./helpers";
import styles from "./styles/index.module.scss";
import SANCTUM_LOGO from "./santum_huge.png"
import { keylinkAppId } from "../../constants";


type LoginStatus = null | "loading" | "awaiting" | "confirmed";
const OTP_VALIDITY_PERIOD = 15 * 60; // 15 minutes in seconds



interface Props {
	loggedIn: boolean;
	successCallback: (creds: Creds) => void;
	errorCallback: (message: string) => void;
	sanctumUrl: string
}

const SanctumBox = ({ loggedIn, successCallback, errorCallback, sanctumUrl }: Props) => {
	const [loginStatus, setLoginStatus] = useState<LoginStatus>(null);
	const [reOpenSocket, setReopenSocket] = useState(false);
	const [seconds, setSeconds] = useState(0);
	const [clientKey, setClientKey] = useState("");
	const timeout: NodeJS.Timeout = setTimeout(() => null, 500);
	const timeoutRef = useRef<NodeJS.Timeout>(timeout);

	useEffect(() => {
		if (loggedIn) setLoginStatus("confirmed")
			setClientKey(getClientKey());
	}, [loggedIn])


	useEffect(() => {
		if (loginStatus !== "awaiting") return;
		clearInterval(timeoutRef.current);
		const now = Date.now();
		const then = now + OTP_VALIDITY_PERIOD * 1000;
		setSeconds(OTP_VALIDITY_PERIOD);

		timeoutRef.current = setInterval(() => {
			const secondsLeft = Math.round((then - Date.now()) / 1000);
			if (secondsLeft < 0) {
				clearInterval(timeoutRef.current);
				return;
			}
			setSeconds(secondsLeft)
		}, 1000);

		return () => clearInterval(timeoutRef.current)
	}, [loginStatus])


	const handleSanctumRequest = useCallback(() => {
		setLoginStatus("loading");

		newSocket({
			sendOnOpen: {},
			onError: (reason) => {
				errorCallback(reason)
				setLoginStatus(null);
			},
			onSuccess: (data) => {
				successCallback(data)
				setLoginStatus("confirmed");
			},
			onToStartSanctum: async (receivedRequestToken) => {
				await Browser.open({ url: `${sanctumUrl}/?token=${receivedRequestToken}&app=${keylinkAppId}` });
				setLoginStatus("awaiting");
			},
			onUnexpectedClosure: () => {
				setReopenSocket(true);
			},
			sanctumUrl
		});
	}, [])


	useEffect(() => {
		if (reOpenSocket) {
			setReopenSocket(false);
			handleSanctumRequest();
		}
	}, [reOpenSocket, handleSanctumRequest]);


	return (
		<div className={styles["sanctum-container"]}>
			{loginStatus === "loading" && <div className={styles["sanctum-loading"]}><SanctumSetting /></div>}
			{
				loginStatus === "awaiting"
				&&
				<React.Fragment>
					<div className={styles["sanctum-timer-description"]}>Awaiting User Confirmation</div>
					<div className={styles["sanctum-timer"]}>
						<SandClock />
						<div className={styles['timer-num']}>{formatTime(seconds)}</div>
					</div>
					<p>{`client_id-${clientKey}`}</p>
				</React.Fragment>
			}
			{
				loginStatus === "confirmed"
				&&
				<div className={styles["confirmed"]}>
					<SanctumChecked />
					<p>{`client_id-${clientKey}`}</p>
				</div>
			}
			{
				loginStatus === null
				&&
				<div className={styles["sanctum-button-group"]}>
					<button className={styles["sanctum-login-button"]} onClick={handleSanctumRequest} >EMail</button>
					<button className={styles["sanctum-login-button"]} onClick={() => { console.log("Nostr?") }} >Nostr</button>
				</div>
			}
			<div className={styles["sanctum-logo"]}>
				<p>Powered by</p>
				<div>
					<img src={SANCTUM_LOGO} alt='Sanctum Logo' />
				</div>
			</div>
		</div>
	)
}

export default SanctumBox