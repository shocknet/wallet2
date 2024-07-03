import { useCallback, useEffect, useRef, useState } from "react";
import { SandClock, SanctumSetting, SanctumChecked } from "./icons";
import newSocket, { Creds } from "./socket";
import { Browser } from '@capacitor/browser';
import { formatTime, getClientKey } from "./helpers";
import styles from "./styles/index.module.scss";
import SANCTUM_LOGO from "./santum_huge.png"
import { useDispatch } from "../../State/store";
import { updateBackupData } from "../../State/Slices/backupState";
import { AnimatePresence, motion } from "framer-motion";
import classNames from "classnames";
import { removeSanctumAccessToken } from "../../Api/sanctum";
import { toast } from "react-toastify";
import Toast from "../Toast";



type LoginStatus = null | "loading" | "awaiting" | "confirmed";
const OTP_VALIDITY_PERIOD = 15 * 60; // 15 minutes in seconds



interface Props {
	loggedIn: boolean;
	successCallback: (creds: Creds) => void;
	errorCallback: (message: string) => void;
	sanctumUrl: string
}



const SanctumBox = ({ loggedIn, successCallback, errorCallback, sanctumUrl }: Props) => {
	const dispatch = useDispatch();

	const [loginStatus, setLoginStatus] = useState<LoginStatus>(null);
	const [reOpenSocket, setReopenSocket] = useState(false);
	const [seconds, setSeconds] = useState(0);
	const [clientKey, setClientKey] = useState("");
	const timeout: NodeJS.Timeout = setTimeout(() => null, 500);
	const timeoutRef = useRef<NodeJS.Timeout>(timeout);
	const [isLogin, setIsLogin] = useState(false);
	const [promptConfirmLogout, setPromptConfirmLogout] = useState(false);



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

	const handleSanctumLogout = () => {
		dispatch(updateBackupData({ subbedToBackUp: false, usingExtension: false, usingSanctum: false }));
		removeSanctumAccessToken();
		setLoginStatus(null);
		toast.success(<Toast title="Logout successful" message="" />)
	}


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
					loginStatus === "confirmed"
					&&
					<>
						{
							promptConfirmLogout
							?
							<motion.div
								key="logout-prompt"
								variants={{
									initial: { opacity: 0, width: 0, height: 0, x: -40, y: 40   },
									animate: { opacity: 1, width: "auto", height: "auto", x: 0, y: 0 },
								}}
								initial="initial"
								animate="animate"
								exit="exit"
								style={{ overflow: "hidden" }}
								transition={{ duration: 0.2 }}
								className={classNames(styles["alt-view-container"], styles["confirmed"], styles["logout-prompt"])}

							>
								<span className={styles["title"]}>Log Out?</span>
								<div className={classNames(styles["sanctum-button-group"], styles["logout-buttons"])}>
									<motion.button
										className={styles["sanctum-login-button"]}
										onClick={() => {
											setPromptConfirmLogout(false);
											handleSanctumLogout()
										}}
									>Yes</motion.button>
									<motion.button
										className={styles["sanctum-login-button"]}
										onClick={() => setPromptConfirmLogout(false)}
										initial={{ x: -40 }}
										animate={{  x: 0 }}
										transition={{ duration: 0.1 }}
									>No</motion.button>
								</div>
							</motion.div>
							:
							<motion.div
								initial={{ opacity: 0, x: "-12rem" }}
								animate={{ opacity: 1, x: "0rem"  }}
								className={classNames(styles["alt-view-container"], styles["confirmed"])}
								transition={{ ease: "linear" }}
							>
								<div className={styles["logout-cross"]} onClick={() => setPromptConfirmLogout(!promptConfirmLogout)}>
									<img src="/X-icon.svg" width={20} height={20} alt="X" />
								</div>
								<SanctumChecked />
								<p>{`client_id-${clientKey}`}</p>
							</motion.div>
						}
					</>
				}
				{
					loginStatus === null
					&&
					<div className={classNames(styles["alt-view-container"],  styles["sanctum-button-group"])}>
						<button className={styles["sanctum-login-button"]} onClick={() => handleSanctumRequest(false)} >Sign Up</button>
						<button className={styles["sanctum-login-button"]} onClick={() => handleSanctumRequest(true)} >Sign In</button>
					</div>
				}
			</AnimatePresence>
			<div className={styles["sanctum-logo"]}>
				{ (loginStatus !== "awaiting" && loginStatus !== "confirmed") && <span>Powered by</span> }
				<div>
					<img src={SANCTUM_LOGO} alt='Sanctum Logo' />
				</div>
			</div>
		</div>
	)
}

export default SanctumBox