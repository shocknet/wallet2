export const DeeplinkService = (link: string) => {
    let ua = link.toLowerCase();
    let isAndroid = ua.indexOf("android") > -1; // android check
    let isIphone = ua.indexOf("iphone") > -1; // ios check
    if (isIphone) {
        const app = { 
            launchApp: () => {
                setTimeout(() => {
                    window.location.href = "https://itunes.apple.com/us/app/shockwallet/app.shockwallet";
                }, 25);
                window.location.href = "bundlename://linkname"; //which page to open(now from mobile, check its authorization)
            },
            openWebApp: () => {
                window.location.href = "https://itunes.apple.com/us/app/shockwallet/app.shockwallet";
            }
        };
        app.launchApp();
    } else if (isAndroid) {
        // const app = { 
        //     launchApp: () => {
        //         window.location.replace("app.shockwallet://open"); //which page to open(now from mobile, check its authorization)
        //         setTimeout(app.openWebApp, 500);
        //     },
        //     openWebApp: () => {
        //         window.location.href =  "https://play.google.com/store/apps/details?id=app.shockwallet";
        //     }
        // };
        // app.launchApp();
    } else{
        //navigate to website url
    }
}