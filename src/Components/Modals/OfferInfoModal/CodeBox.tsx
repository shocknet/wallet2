const CodeBox = ({ label, value }: { label: string; value: string | JSX.Element[] | null }) => (
	<div className=" ion-padding" style={{ width: '100%' }}>
		{
			label && <div style={{ fontSize: '.75rem' }} className="text-low">{label}</div>
		}
		<pre style={{
			whiteSpace: 'pre-wrap',
			wordBreak: 'break-all',
			background: "var(--ion-color-tertiary)",

			borderRadius: '6px',
			fontFamily: 'monospace',
			padding: '8px',
			margin: 0
		}}>
			{value || '—'}
		</pre>
	</div>
);

export default CodeBox;
