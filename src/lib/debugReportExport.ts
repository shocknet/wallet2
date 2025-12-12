import dLogger from '@/Api/helpers/debugLog';
import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';

export async function exportDebugReport() {
	const json = await dLogger.buildDebugReport();
	const filename = makeFilename();

	if (Capacitor.isNativePlatform()) {
		await exportNative(json, filename);
	} else {
		exportWeb(json, filename);
	}
}

function makeFilename() {
	// ISO has `:` which is illegal in Windows filenames, so sanitize
	const iso = new Date().toISOString().replace(/[:]/g, '-');
	return `shockwallet-debug-${iso}.json`;
}

async function exportNative(json: string, filename: string) {
	const { uri } = await Filesystem.writeFile({
		path: `debug/${filename}`,
		data: json,
		directory: Directory.Documents,
		encoding: Encoding.UTF8,
		recursive: true
	});


	await Share.share({
		title: 'Shockwallet debug report',
		text: 'Attach this file when contacting support.',
		url: uri,
		dialogTitle: 'Share debug report',
	});
}

function exportWeb(json: string, filename: string) {
	const blob = new Blob([json], { type: 'application/json' });
	const url = URL.createObjectURL(blob);

	const a = document.createElement('a');
	a.href = url;
	a.download = filename;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	URL.revokeObjectURL(url);
}
