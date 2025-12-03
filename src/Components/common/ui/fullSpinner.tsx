import { IonSpinner } from "@ionic/react"

interface Props {
	message?: string;
}
const FullSpinner = ({ message }: Props) => {
	return (
		<div style={{
			display: 'flex',
			justifyContent: 'center',
			alignItems: 'center',
			height: '100vh', // take full height
			width: '100%',
		}}>
			<IonSpinner name="crescent" />
			{
				message &&
				<h2 className="text-high" style={{ marginTop: "4rem" }}>{message}</h2>
			}

		</div>
	);
}
export default FullSpinner;
