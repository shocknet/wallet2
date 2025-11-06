import { useCallback, useEffect, useRef, useState } from "react";
import { SandClock, SanctumSetting } from "./icons";
import newSocket, { Creds } from "./socket";
import { Browser } from '@capacitor/browser';
import { formatTime, getClientKey } from "./helpers";
import styles from "./styles/index.module.scss";
import SANCTUM_LOGO from "./santum_huge.png"

import { AnimatePresence, motion } from "framer-motion";
import classNames from "classnames";




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
	const [isLogin, setIsLogin] = useState(false);




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


	const handleSanctumRequest = useCallback((login: boolean) => {
		setLoginStatus("loading");
		setIsLogin(login);

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
				await Browser.open({ url: `${sanctumUrl}/authenticate?requestToken=${receivedRequestToken}&authType=${login ? "Log In" : "Sign Up"}` });
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
			handleSanctumRequest(isLogin);
		}
	}, [reOpenSocket, handleSanctumRequest, isLogin]);


	return (
		<div className={classNames({
			[styles["sanctum-container"]]: true,
			[styles["when-confirmed"]]: loginStatus === "confirmed"
		})}>
			<AnimatePresence>

				{loginStatus === "loading"
					&&
					<motion.div
						className={classNames(styles["alt-view-container"], styles["sanctum-loading"])}
						key="sanctum-loading"
						initial={{ opacity: 0, x: 15, y: 15 }}
						animate={{ opacity: 1, x: 0, y: 0 }}
					>
						<SanctumSetting />
					</motion.div>}
				{
					loginStatus === "awaiting"
					&&
					<motion.div
						className={styles["alt-view-container"]}
						key="sanctum-awaiting"
						variants={{
							initial: {
								opacity: 0
							},
							animate: {
								opacity: 1,
								transition: {
									staggerChildren: 0.5,
									when: "afterChildren"
								}
							}
						}}
						initial="initial"
						animate="animate"
						transition={{ duration: 0.3 }}
					>
						<div className={styles["sanctum-timer-description"]}>Awaiting User Confirmation</div>
						<div className={styles["sanctum-timer"]}>
							<SandClock />
							<div className={styles['timer-num']}>{formatTime(seconds)}</div>
						</div>
						<p>
							<motion.span
								style={{ display: "inline-block" }}
								key="client_id"
								initial={{ scale: 1.5, x: 20, y: 20 }}
								animate={{ scale: 1, x: 0, y: 0 }}

								transition={{ duration: 0.3 }}
							>client_id-</motion.span>
							{clientKey}
						</p>
					</motion.div>
				}
				{
					loginStatus === null
					&&
					<div className={classNames(styles["alt-view-container"], styles["sanctum-button-group"])}>
						<button className={styles["sanctum-login-button"]} onClick={() => handleSanctumRequest(false)} >Sign Up</button>
						<button className={styles["sanctum-login-button"]} onClick={() => handleSanctumRequest(true)} >Sign In</button>
					</div>
				}
			</AnimatePresence>
			<div className={styles["sanctum-logo"]}>
				{(loginStatus !== "awaiting" && loginStatus !== "confirmed") && <span>Powered by</span>}
				<div>
					<img src={SANCTUM_LOGO} alt='Sanctum Logo' />
				</div>
			</div>
		</div>
	)
}

export default SanctumBox
