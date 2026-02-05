import { NotificationsPermission } from "../permission";

export type PushStatus = Exclude<NotificationsPermission, "granted"> | "unsupported" | "registered" | "error";



type PushRegistrationResultSuccess = {
	status: "registered";

	token: string;
	error?: never;
}

type PushRegistrationResultFailure = {
	status: Exclude<PushStatus, "registered">;

	token?: never;
	error?: string;
}

export type PushRegistrationResult = PushRegistrationResultSuccess | PushRegistrationResultFailure;
