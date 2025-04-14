import { IonSpinner } from "@ionic/react"

const FullSpinner = () => {
	return (
		<div style={{
			display: 'flex',
			justifyContent: 'center',
			alignItems: 'center',
			height: '100vh', // take full height
			width: '100%',
		}}>
			<IonSpinner name="crescent" />
		</div>
	);
}
export default FullSpinner;