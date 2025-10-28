
const enableLog = import.meta.env.MODE === "development";


const log = (...args: any[]) => {
	if (enableLog) {
		console.log('%cLOG:', 'color: blue;', ...args);
	}
};

const info = (...args: any[]) => {
	if (enableLog) {
		console.info('%cINFO:', 'color: green;', ...args);
	}
};

const warn = (...args: any[]) => {
	if (enableLog) {
		console.warn('%cWARN:', 'color: yellow;', ...args);
	}
};

const error = (...args: any[]) => {
	if (enableLog) {
		console.error('%cERROR:', 'color: red;', ...args);
	}
};

const logger = {
	log,
	info,
	warn,
	error
}

export default logger;
