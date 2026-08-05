import swMarkDark from "@/Assets/Images/wallet-avatar/dark/sw-mark.svg";
import { WALLET_AVATAR_HEIGHT } from "@/Assets/Images/wallet-avatar";

export const logoDataUrl = swMarkDark;

export const Logo = (height: string = WALLET_AVATAR_HEIGHT.nav) => {
	return <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
		<img src={swMarkDark} alt="logo" style={{ height, width: 'auto', display: 'block' }} />
	</div>
}

export const PriceDown = () => {
	const svgCode = '<svg version="1.2" preserveAspectRatio="none" viewBox="0 0 24 24" class="ng-element" data-id="2ff83c025b4246628c834d86d76fdd0f" stroke-linecap="null" stroke-linejoin="null" style="opacity: 1; mix-blend-mode: normal; fill: rgb(186, 41, 41); width: 24px; height: 24px; filter: drop-shadow(rgb(0, 0, 0) 0px 0px 1.16667px);"><g><path xmlns:default="http://www.w3.org/2000/svg" d="M16 18l2.29-2.29-4.88-4.88-4 4L2 7.41 3.41 6l6 6 4-4 6.3 6.29L22 12v6z" style="fill: rgb(186, 41, 41);"></path></g></svg>';
	return (
		<div className="Home_IMG_PriceDown" dangerouslySetInnerHTML={{ __html: svgCode }} />
	)
}

export const PriceUp = () => {
	const svgCode = '<svg version="1.2" preserveAspectRatio="none" viewBox="0 0 24 24" class="ng-element" data-id="00e20f6297a14af58205cf161e210f6c" stroke-linecap="null" stroke-linejoin="null" style="opacity: 1; mix-blend-mode: normal; fill: rgb(67, 185, 96); width: 24px; height: 24px; filter: drop-shadow(rgb(0, 0, 0) 0px 0px 1.16667px);"><g><path xmlns:default="http://www.w3.org/2000/svg" d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z" style="fill: rgb(67, 185, 96);"></path></g></svg>';
	return (
		<div className="Home_IMG_PriceUp" dangerouslySetInnerHTML={{ __html: svgCode }} />
	)
}

export const EditSource = () => {
	const svgCode = '<svg version="1.2" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" overflow="visible" preserveAspectRatio="none" viewBox="0 0 24 24" width="12" height="12"><g><path xmlnsDefault="http://www.w3.org/2000/svg" d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" style="fill: rgb(137, 137, 137);" vector-effect="non-scaling-stroke"/></g></svg>';
	return (
		<div className="Sources_IMG_EditSource" dangerouslySetInnerHTML={{ __html: svgCode }} />
	)
}

export const MenuBack = () => {
	const svgCode = '<svg version="1.2" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" overflow="visible" preserveAspectRatio="none" viewBox="0 0 24 24" width="24" height="24"><g><path xmlnsDefault="http://www.w3.org/2000/svg" d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z" style="fill: rgb(41, 171, 226);" vector-effect="non-scaling-stroke"/></g></svg>';
	return (
		<div className="Header_IMG_MenuBack" dangerouslySetInnerHTML={{ __html: svgCode }} />
	)
}

export const Automation = () => {
	const svgCode = `<svg version="1.2" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" overflow="visible" preserveAspectRatio="none" viewBox="0 -1.495305164319248 49 49" width="24" height="24"><g><g xmlns:default="http://www.w3.org/2000/svg">
	<g>
		<path d="M46,0H3C1.3,0,0,1.3,0,3v40c0,1.7,1.3,3,3,3h43c1.7,0,3-1.3,3-3V3C49,1.3,47.7,0,46,0z M47,43c0,0.6-0.4,1-1,1H3    c-0.6,0-1-0.4-1-1V12h45V43z M47,10H2V3c0-0.6,0.4-1,1-1h43c0.6,0,1,0.4,1,1V10z M23.2,36h-9.3c0-0.5,0.1-1.1,0.4-1.5    c0.3-0.5,0.6-0.9,1.1-1.4c0.5-0.5,1-0.9,1.5-1.3c0.6-0.4,1.2-0.9,1.8-1.4c0.6-0.5,1.2-1,1.8-1.5c0.6-0.5,1.1-1.1,1.5-1.6    c0.5-0.6,0.8-1.2,1.1-1.9c0.3-0.7,0.4-1.4,0.4-2.3c0-1-0.1-1.8-0.4-2.5c-0.3-0.7-0.7-1.3-1.2-1.8c-0.5-0.5-1.1-0.8-1.9-1.1    c-0.7-0.2-1.5-0.4-2.3-0.4c-1.1,0-2,0.2-2.9,0.5c-0.8,0.3-1.6,0.8-2.2,1.3l1.2,1.5c0.3-0.2,0.5-0.4,0.8-0.6    c0.3-0.2,0.6-0.3,0.9-0.4c0.3-0.1,0.6-0.2,1-0.3s0.6-0.1,0.9-0.1c1.4,0,2.3,0.3,3,1c0.6,0.7,0.9,1.7,0.9,3.1    c0,0.7-0.1,1.4-0.4,1.9c-0.3,0.6-0.6,1.1-1.1,1.7c-0.5,0.5-1,1-1.6,1.5c-0.6,0.5-1.2,0.9-1.8,1.4c-0.6,0.5-1.2,0.9-1.8,1.4    c-0.6,0.5-1.1,1-1.6,1.6c-0.5,0.6-0.8,1.2-1.1,1.8c-0.3,0.6-0.4,1.3-0.4,2.1v1.2h11.7V36z M31.7,36.2h-3.6v1.8h9.2v-1.8h-3.4V17.9    h-1.8L28,20l0,2.1l3.8-2V36.2z" style="fill: rgb(84, 187, 232);" vector-effect="non-scaling-stroke"/>
	</g>
</g></g></svg>`;
	return (
		<div className="Header_IMG_Setting" dangerouslySetInnerHTML={{ __html: svgCode }} />
	)
}

export const Contacts = () => {
	const svgCode = `<svg version="1.2" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" overflow="visible" preserveAspectRatio="none" viewBox="-5 0 50 50" width="24" height="24"><g><g xmlns:default="http://www.w3.org/2000/svg">
                            <g>
                                <path d="M9.9,39.9l20.2,0l0.3-0.5c1.1-1.8,1.6-3.9,1.6-6c0-3.8-1.8-7.3-4.7-9.5c0.4-1.1,0.6-2.3,0.6-3.5c0-5.1-3.5-9.3-7.9-9.3    s-7.9,4.2-7.9,9.3c0,5.1,3.5,9.2,7.9,9.2c2.6,0,5-1.5,6.4-3.9c2.3,1.9,3.6,4.7,3.6,7.7c0,1.6-0.4,3.1-1.1,4.5l-17.9,0    C10.4,36.5,10,35,10,33.4c0-2,0.6-4,1.7-5.6l-1.7-1.1C8.7,28.6,8,31,8,33.4c0,2.1,0.6,4.2,1.6,6L9.9,39.9z M20,27.6    c-3.2,0-5.9-3.3-5.9-7.2c0-4,2.6-7.3,5.9-7.3s5.9,3.3,5.9,7.3C25.9,24.3,23.2,27.6,20,27.6z M0,0v50h40V0H0z M38,48H2V2h36V48z" style="fill: rgb(84, 187, 232);" vector-effect="non-scaling-stroke"/>
                            </g>
                        </g></g></svg>`;
	return (
		<div className="Header_IMG_Setting" dangerouslySetInnerHTML={{ __html: svgCode }} />
	)
}

export const Setting = () => {
	const svgCode = `<svg version="1.2" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" overflow="visible" preserveAspectRatio="none" viewBox="-0.5700000000000003 0 57 57" width="24" height="24"><g>
                <g>
                    <path d="M56.5,22.1L55.9,20c-0.6-2.3-2.7-4-5.1-4c-0.5,0-0.9,0.1-1.4,0.2l-2.7,0.7c-0.7-1.2-1.5-2.2-2.5-3.2l1.1-1.9    c0.7-1.2,0.9-2.7,0.5-4.1c-0.4-1.4-1.2-2.5-2.5-3.3l-1.9-1.1c-0.8-0.5-1.7-0.7-2.7-0.7c-1.9,0-3.7,1-4.6,2.7l-1.1,1.9    c-1.3-0.3-2.7-0.5-4-0.5L28.4,4c-0.6-2.3-2.7-4-5.1-4c-0.5,0-0.9,0.1-1.4,0.2l-2.1,0.6c-1.4,0.4-2.5,1.3-3.2,2.5    c-0.7,1.2-0.9,2.7-0.5,4.1l0.7,2.8c-1.1,0.7-2.1,1.5-3,2.4l-1.8-1c-0.8-0.5-1.7-0.7-2.7-0.7c-1.9,0-3.7,1-4.6,2.7l-1.1,1.9    C2.8,16.5,2.7,18,3,19.3c0.4,1.4,1.2,2.5,2.5,3.3l1.8,1.1c-0.3,1.3-0.5,2.6-0.5,3.9L4,28.3c-1.4,0.4-2.5,1.3-3.2,2.5    c-0.7,1.2-0.9,2.7-0.5,4.1L0.7,37c0.6,2.3,2.7,4,5.1,4c0.5,0,0.9-0.1,1.4-0.2l2.9-0.8c0.7,1.1,1.5,2.1,2.4,3.1l-1,1.8    c-0.7,1.2-0.9,2.7-0.5,4.1c0.4,1.4,1.2,2.5,2.5,3.3l1.9,1.1c0.8,0.5,1.7,0.7,2.7,0.7c1.9,0,3.7-1,4.6-2.7l1-1.8    c1.3,0.3,2.5,0.5,3.8,0.5l0.8,2.9c0.6,2.3,2.7,4,5.1,4c0.5,0,0.9-0.1,1.4-0.2l2.1-0.6c2.8-0.8,4.5-3.7,3.8-6.6l-0.8-2.9    c1.1-0.7,2.1-1.5,3.1-2.4l1.8,1.1c0.8,0.5,1.7,0.7,2.7,0.7c1.9,0,3.7-1,4.6-2.7l1.1-1.9c0.7-1.2,0.9-2.7,0.5-4.1    c-0.4-1.4-1.2-2.5-2.5-3.3l-1.8-1c0.3-1.3,0.5-2.5,0.5-3.8l2.8-0.7c1.4-0.4,2.5-1.3,3.2-2.5C56.6,24.9,56.8,23.5,56.5,22.1z     M54.2,25.2c-0.4,0.8-1.2,1.3-2,1.6L48,27.9l0,0.8c0,1.6-0.2,3.2-0.7,4.8l-0.2,0.7l3.1,1.8c0.8,0.4,1.3,1.2,1.6,2    c0.2,0.9,0.1,1.8-0.3,2.5l-1.1,1.9c-0.6,1-1.7,1.7-2.9,1.7c-0.6,0-1.2-0.2-1.7-0.5l-3.1-1.8l-0.5,0.5c-1.2,1.2-2.5,2.2-3.9,3    l-0.7,0.4l1.2,4.4c0.5,1.8-0.6,3.6-2.4,4.1l-2.1,0.6C34,55,33.7,55,33.4,55c-1.5,0-2.8-1-3.2-2.5L29,48.1l-0.8,0    c-1.6,0-3.2-0.2-4.8-0.7l-0.7-0.2l-1.8,3.1c-0.6,1-1.7,1.7-2.9,1.7c-0.6,0-1.2-0.2-1.7-0.4l-1.9-1.1c-0.8-0.5-1.3-1.2-1.6-2    c-0.2-0.9-0.1-1.8,0.3-2.5l1.8-3.1l-0.5-0.5c-1.2-1.2-2.2-2.5-3-3.9l-0.4-0.7l-4.4,1.2C6.5,39,6.2,39,5.9,39c-1.5,0-2.8-1-3.2-2.5    l-0.6-2.1c-0.2-0.9-0.1-1.8,0.3-2.5c0.4-0.8,1.2-1.3,2-1.6l4.3-1.2l0-0.8c0-1.6,0.2-3.3,0.6-4.9l0.2-0.7l-3.1-1.8    c-0.8-0.5-1.3-1.2-1.6-2c-0.2-0.9-0.1-1.8,0.3-2.5l1.1-1.9c0.6-1,1.7-1.7,2.9-1.7c0.6,0,1.2,0.2,1.7,0.5L14,15l0.5-0.5    c1.2-1.2,2.5-2.2,3.8-3L19,11l-1.1-4.2c-0.2-0.9-0.1-1.8,0.3-2.5c0.4-0.8,1.2-1.3,2-1.6l2.1-0.6c1.8-0.5,3.6,0.6,4.1,2.4l0.9,3.4    l0.3,0.7h0.8c1.7,0,3.3,0.2,5,0.7l0.7,0.2l1.8-3.2c0.6-1,1.7-1.7,2.9-1.7c0.6,0,1.2,0.2,1.7,0.5l1.9,1.1c0.8,0.4,1.3,1.2,1.6,2    c0.2,0.9,0.1,1.8-0.3,2.5L41.8,14l0.5,0.5c1.2,1.2,2.2,2.6,3.1,4.1l0.4,0.7l4.1-1.1c1.8-0.5,3.6,0.6,4.1,2.4l0.6,2.1    C54.8,23.5,54.7,24.4,54.2,25.2z M28.3,16.9c-6.3,0-11.5,5.2-11.5,11.6S22,40.1,28.3,40.1s11.5-5.2,11.5-11.6S34.7,16.9,28.3,16.9    z M28.3,38.1c-5.3,0-9.5-4.3-9.5-9.6c0-5.3,4.3-9.6,9.5-9.6s9.5,4.3,9.5,9.6C37.8,33.8,33.6,38.1,28.3,38.1z" style="fill: rgb(84, 187, 232);" vector-effect="non-scaling-stroke"/>
                </g>
            </g><g/></svg>`;
	return (
		<div className="Header_IMG_Setting" dangerouslySetInnerHTML={{ __html: svgCode }} />
	)
}

export const SourceIcon = () => {
	const svgCode = '<svg version="1.2" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" overflow="visible" preserveAspectRatio="none" viewBox="0 0 684 684" width="24" height="24"><g><path xmlns:default="http://www.w3.org/2000/svg" d="M684,0L105.2,236.8l171,171L0,684l578.8-236.8l-171-171L684,0z M531.4,436.7l-420.9,171l184.2-184.2l18.4-18.4l-18.4-18.4  L152.6,244.7l420.9-171L389.4,257.8L371,276.2l18.4,18.4" style="fill: rgb(84, 187, 232);" vector-effect="non-scaling-stroke"/></g></svg>';
	return (
		<div className="Header_IMG_SourceIcon" dangerouslySetInnerHTML={{ __html: svgCode }} />
	)
}

export const BuyCryptoIcon = () => {
	const svgCode = `<svg version="1.2" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" overflow="visible" preserveAspectRatio="none" viewBox="0 0 632 632" width="24" height="24"><g><g xmlns:default="http://www.w3.org/2000/svg">
	<path d="M315.7,0C142.1,0,0,142.1,0,315.7s142.1,315.7,315.7,315.7s315.7-142.1,315.7-315.7S489.3,0,315.7,0z M315.7,605.1   c-160.5,0-289.4-128.9-289.4-289.4S155.2,26.3,315.7,26.3s289.4,128.9,289.4,289.4S476.2,605.1,315.7,605.1z" style="fill: rgb(245, 147, 34);" vector-effect="non-scaling-stroke"/>
	<path d="M247.3,234.2c0-28.9,28.9-55.2,73.7-55.2s78.9,28.9,78.9,28.9l18.4-26.3c0,0-28.9-28.9-84.2-31.6v-44.7h-28.9V150   c-55.2,5.3-92.1,44.7-92.1,86.8c0,100,178.9,81.6,178.9,163.1c0,34.2-31.6,55.2-71,55.2c-55.2,0-92.1-36.8-92.1-36.8l-21,23.7   c0,0,34.2,36.8,100,39.5v44.7h28.9v-42.1c57.9-5.3,92.1-42.1,92.1-86.8C426.2,292,247.3,307.8,247.3,234.2z" style="fill: rgb(245, 147, 34);" vector-effect="non-scaling-stroke"/>
</g></g></svg>`;
	return (
		<div className="Header_IMG_BuyCryptoIcon" dangerouslySetInnerHTML={{ __html: svgCode }} />
	)
}

export const HelpAbout = () => {
	const svgCode = `<svg version="1.2" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" overflow="visible" preserveAspectRatio="none" viewBox="0 0 52 52" width="24" height="24"><g><g xmlns:default="http://www.w3.org/2000/svg">
	<g>
		<path d="M26,0C11.7,0,0,11.7,0,26c0,14.3,11.7,26,26,26c14.3,0,26-11.7,26-26C52,11.7,40.3,0,26,0z M26,50C12.8,50,2,39.2,2,26    C2,12.8,12.8,2,26,2c13.2,0,24,10.8,24,24C50,39.2,39.2,50,26,50z M30.8,14.3c-0.7-0.7-1.5-1.2-2.4-1.6c-0.9-0.4-2-0.6-3.1-0.6    c-1.2,0-2.3,0.2-3.3,0.6c-1,0.4-1.9,1-2.6,1.7l1.8,1.9c0.3-0.3,0.6-0.5,0.8-0.7c0.3-0.2,0.6-0.4,0.9-0.6c0.3-0.2,0.6-0.3,1-0.4    c0.4-0.1,0.8-0.1,1.2-0.1c0.7,0,1.4,0.1,2,0.4c0.6,0.2,1.1,0.6,1.6,1c0.4,0.5,0.8,1,1,1.7c0.2,0.7,0.4,1.5,0.4,2.3    c0,0.7-0.1,1.3-0.3,1.9c-0.2,0.5-0.5,1-0.8,1.4c-0.3,0.4-0.7,0.8-1.2,1.1c-0.4,0.3-0.9,0.6-1.3,1c-0.4,0.3-0.9,0.7-1.3,1.1    c-0.4,0.4-0.8,0.8-1.2,1.3c-0.3,0.5-0.6,1.1-0.8,1.8s-0.3,1.5-0.3,2.5v1.2h2.7c0-0.7,0-1.3,0-1.8c0-0.5,0.1-1,0.2-1.4    c0.2-0.7,0.6-1.3,1-1.7c0.4-0.5,0.9-0.9,1.5-1.3c0.5-0.4,1.1-0.8,1.6-1.2c0.5-0.4,1-0.9,1.5-1.5c0.4-0.6,0.8-1.2,1.1-2    c0.3-0.8,0.4-1.8,0.4-3c0-1-0.2-1.9-0.5-2.8C31.9,15.7,31.4,14.9,30.8,14.3z M25.6,36.6c-0.2-0.2-0.4-0.3-0.6-0.5    c-0.2-0.1-0.5-0.2-0.8-0.2c-0.3,0-0.5,0.1-0.8,0.2c-0.2,0.1-0.4,0.3-0.6,0.5c-0.2,0.2-0.3,0.4-0.4,0.6c-0.1,0.2-0.1,0.5-0.1,0.8    c0,0.3,0.1,0.5,0.2,0.8c0.1,0.2,0.2,0.5,0.4,0.6c0.2,0.2,0.4,0.3,0.6,0.4C23.8,40,24,40,24.3,40c0.3,0,0.5-0.1,0.7-0.2    c0.2-0.1,0.4-0.3,0.6-0.5c0.2-0.2,0.3-0.4,0.4-0.6c0.1-0.2,0.1-0.5,0.1-0.8c0-0.2,0-0.5-0.1-0.7C25.9,37,25.8,36.8,25.6,36.6z" style="fill: rgb(0, 255, 30);" vector-effect="non-scaling-stroke"/>
	</g>
</g></g></svg>`;
	return (
		<div className="Header_IMG_HelpAbout" dangerouslySetInnerHTML={{ __html: svgCode }} />
	)
}

export const QR = (inline = false) => {
	const svgCode = '<svg height="30" overflow="visible" viewBox="-1 -1 34 34" width="30" xmlns="http://www.w3.org/2000/svg"><g><defs><path id="path-169764199817443" d="M0 5.000000000000001 C0 2.2385762510000005 2.2385762510000005 0 5.000000000000001 0 C5.000000000000001 0 25.000000000000046 0 25.000000000000046 0 C27.761423749000045 0 30.000000000000046 2.2385762510000005 30.000000000000046 5.000000000000001 C30.000000000000046 5.000000000000001 30.000000000000046 25.000000000000025 30.000000000000046 25.000000000000025 C30.000000000000046 27.761423749000024 27.761423749000045 30.000000000000025 25.000000000000046 30.000000000000025 C25.000000000000046 30.000000000000025 5.000000000000001 30.000000000000025 5.000000000000001 30.000000000000025 C2.2385762510000005 30.000000000000025 0 27.761423749000024 0 25.000000000000025 C0 25.000000000000025 0 5.000000000000001 0 5.000000000000001 Z" vector-effect="non-scaling-stroke"/></defs> <path style="stroke: rgb(41, 171, 226); stroke-width: 2; stroke-linecap: butt; stroke-linejoin: miter; fill: rgb(22, 25, 28);" d="M1 6.000000000000001 C1 3.2385762510000005 3.2385762510000005 1 6.000000000000001 1 C6.000000000000001 1 26.000000000000057 1 26.000000000000057 1 C28.761423749000055 1 31.000000000000057 3.2385762510000005 31.000000000000057 6.000000000000001 C31.000000000000057 6.000000000000001 31.000000000000057 26 31.000000000000057 26 C31.000000000000057 28.761423749 28.761423749000055 31 26.000000000000057 31 C26.000000000000057 31 6.000000000000001 31 6.000000000000001 31 C3.2385762510000005 31 1 28.761423749 1 26 C1 26 1 6.000000000000001 1 6.000000000000001 Z" vector-effect="non-scaling-stroke"/></g><g><defs><path id="path-169764199817441" d="M0 0 C0 0 32 0 32 0 C32 0 32 8 32 8 C32 8 0 8 0 8 C0 8 0 0 0 0 Z" vector-effect="non-scaling-stroke"/></defs> <path style="stroke: rgb(140, 140, 140); stroke-width: 0; stroke-linecap: butt; stroke-linejoin: miter; fill: rgb(22, 25, 28);" d="M0 12 C0 12 32 12 32 12 C32 12 32 20 32 20 C32 20 0 20 0 20 C0 20 0 12 0 12 Z" vector-effect="non-scaling-stroke"/></g><g><defs><path id="path-169764199817339" d="M0 0 C0 0 8 0 8 0 C8 0 8 32 8 32 C8 32 0 32 0 32 C0 32 0 0 0 0 Z" vector-effect="non-scaling-stroke"/></defs> <path style="stroke: rgb(140, 140, 140); stroke-width: 0; stroke-linecap: butt; stroke-linejoin: miter; fill: rgb(22, 25, 28);" d="M12 0 C12 0 20 0 20 0 C20 0 20 32 20 32 C20 32 12 32 12 32 C12 32 12 0 12 0 Z" vector-effect="non-scaling-stroke"/></g><g><defs><path id="path-169764199817237" d="M5 0 C7.7595751224699985 0 10 2.2404248775299997 10 5 C10 7.75957512247 7.7595751224699985 10 5 10 C2.2404248775299997 10 0 7.75957512247 0 5 C0 2.2404248775299997 2.2404248775299997 0 5 0 Z" vector-effect="non-scaling-stroke"/></defs> <path style="stroke: rgb(140, 140, 140); stroke-width: 0; stroke-linecap: butt; stroke-linejoin: miter; fill: rgb(41, 171, 226);" d="M16 11 C18.75957512247001 11 21 13.240424877530018 21 16 C21 18.759575122469982 18.75957512247001 21 16 21 C13.240424877529989 21 11 18.759575122469982 11 16 C11 13.240424877530018 13.240424877529989 11 16 11 Z" vector-effect="non-scaling-stroke"/></g></svg>';
	return (
		<div className={inline ? 'Receive_copy_icon' : 'Footer_IMG_QR'} dangerouslySetInnerHTML={{ __html: svgCode }} />
	)
}

export const Animation = () => {
	const svgCode = '<svg version="1.2" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" overflow="visible" preserveAspectRatio="none" viewBox="0 0 684 684" width="24" height="24"><g><path xmlnsDefault="http://www.w3.org/2000/svg" d="M684,0L105.2,236.8l171,171L0,684l578.8-236.8l-171-171L684,0z M531.4,436.7l-420.9,171l184.2-184.2l18.4-18.4l-18.4-18.4  L152.6,244.7l420.9-171L389.4,257.8L371,276.2l18.4,18.4" style="fill: rgb(42, 171, 225);" vector-effect="non-scaling-stroke"/></g></svg>';
	return (
		<div className="Loader_IMG_Animation" dangerouslySetInnerHTML={{ __html: svgCode }} />
	)
}

export const questionMark = () => {
	const svgCode = '<svg version="1.2" preserveAspectRatio="none" viewBox="0 0 24 24" class="ng-element interactive" data-id="85c5ca9ce2814e0090336f34b8f76de8" stroke-linecap="null" stroke-linejoin="null" style="opacity: 1; mix-blend-mode: normal; fill: rgb(255, 255, 255); width: 14px; height: 14px; filter: drop-shadow(rgb(0, 0, 0) 0px 0px 1.16667px);"><g><path xmlns:default="http://www.w3.org/2000/svg" id="question-circle" d="M13.24,17.24c-0.06,0.06-0.15,0.09-0.24,0.09h-2c-0.18,0.01-0.32-0.13-0.33-0.31c0-0.01,0-0.01,0-0.02  v-2c-0.01-0.18,0.13-0.32,0.31-0.33c0.01,0,0.01,0,0.02,0h2c0.18-0.01,0.32,0.13,0.33,0.31c0,0.01,0,0.01,0,0.02v2  C13.33,17.09,13.3,17.18,13.24,17.24z M16,10c0,0.29-0.04,0.57-0.13,0.84c-0.07,0.22-0.17,0.43-0.29,0.63  c-0.13,0.19-0.28,0.36-0.46,0.5c-0.15,0.13-0.31,0.25-0.48,0.36l-0.51,0.3c-0.23,0.13-0.42,0.31-0.57,0.52  c-0.12,0.15-0.2,0.33-0.22,0.52c0.01,0.18-0.13,0.32-0.31,0.33c-0.01,0-0.02,0-0.03,0h-2c-0.18,0.01-0.32-0.13-0.33-0.31  c0-0.01,0-0.01,0-0.02v-0.38c0.01-0.48,0.21-0.94,0.54-1.29c0.33-0.38,0.74-0.69,1.2-0.9c0.27-0.11,0.51-0.27,0.71-0.47  c0.15-0.18,0.22-0.4,0.21-0.63c-0.02-0.26-0.17-0.49-0.39-0.61c-0.55-0.35-1.24-0.35-1.79,0c-0.34,0.29-0.64,0.63-0.9,1  c-0.06,0.08-0.16,0.12-0.26,0.12c-0.07,0.01-0.14-0.02-0.2-0.06l-1.37-1c-0.14-0.09-0.19-0.27-0.1-0.41  c0.01-0.01,0.01-0.02,0.02-0.03C9.11,7.6,10.6,6.74,12.2,6.79c1.25-0.02,2.44,0.54,3.22,1.51C15.8,8.79,16,9.38,16,10L16,10z   M18.93,8c-0.7-1.21-1.71-2.22-2.93-2.92C14.79,4.37,13.41,3.99,12,4c-1.41-0.01-2.79,0.37-4,1.08C6.79,5.78,5.78,6.79,5.08,8  C4.37,9.21,3.99,10.59,4,12c-0.01,1.41,0.36,2.79,1.07,4c0.7,1.21,1.71,2.22,2.93,2.92c1.21,0.71,2.59,1.09,4,1.08  c1.41,0.01,2.79-0.36,4-1.07c1.21-0.7,2.22-1.71,2.92-2.93c0.71-1.21,1.09-2.59,1.08-4c0.01-1.41-0.37-2.79-1.08-4H18.93z" style="fill: rgb(255, 255, 255);"></path></g></svg>';
	return (
		<span dangerouslySetInnerHTML={{ __html: svgCode }}></span>
	)
}

export const mynode = () => {
	const svgCode = `<svg version="1.2" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" class="ng-element" data-id="e32536c924714fcda0ee8c743c7c05a7" style="overflow: visible;width: 33px;height: 33px;opacity: 1;mix-blend-mode: normal><defs><path id="path-169271476228410641" d="M16.5 0 C25.60659790415099 0 33 7.393402095849002 33 16.5 C33 25.60659790415101 25.60659790415099 33 16.5 33 C7.393402095848997 33 0 25.60659790415101 0 16.5 C0 7.393402095849002 7.393402095848997 0 16.5 0 Z"></path><pattern id="pattern-169271476234011279" height="100%" patternUnits="objectBoundingBox" width="100.08818342151675%" x="-0.08818342151675274%" y="0%"><image xlink:href="https://s3.amazonaws.com/upload.uxpin/files/1118248/1080825/home_avatar-a625d3a7f5a8c8d61c6bd89984c99332-75943f.webp" height="567" transform="scale(0.0582010582010582, 0.0582010582010582)" width="568"></image></pattern></defs><g transform="translate(0, 0)"><path d="M16.5 0 C25.60659790415099 0 33 7.393402095849002 33 16.5 C33 25.60659790415101 25.60659790415099 33 16.5 33 C7.393402095848997 33 0 25.60659790415101 0 16.5 C0 7.393402095849002 7.393402095848997 0 16.5 0 Z" style="stroke: rgb(140, 140, 140); stroke-width: 0; stroke-linecap: butt; stroke-linejoin: miter; fill: url(&quot;#pattern-169271476234011279&quot;);"></path></g></svg>`;
	return (
		<div className="Sources_svgIcon" dangerouslySetInnerHTML={{ __html: svgCode }} />
	)
}

export const uncle = () => {
	const svgCode = `<svg version="1.2" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" class="ng-element" data-id="16852934e1c94511963ef56e90e9d3b7" style="overflow: visible; width: 33px; height: 33px; opacity: 1; mix-blend-mode: normal;><defs><path id="path-169271476228210634" d="M16.5 0 C25.606597904150995 0 33 7.393402095849003 33 16.5 C33 25.606597904151013 25.606597904150995 33 16.5 33 C7.393402095848998 33 0 25.606597904151013 0 16.5 C0 7.393402095849003 7.393402095848998 0 16.5 0 Z"></path><pattern id="pattern-169271476234111368" height="100%" patternUnits="objectBoundingBox" width="100%" x="0%" y="0%"><image xlink:href="https://s3.amazonaws.com/upload.uxpin/files/1118248/1080825/uncle_jim-d639cb531fb4c5a2929595b6b85bbf5c-bbe8c4.webp" height="512" transform="scale(0.064453125, 0.064453125)" width="512"></image></pattern></defs><g transform="translate(0, 0)"><path d="M16.5 0 C25.606597904150995 0 33 7.393402095849003 33 16.5 C33 25.606597904151013 25.606597904150995 33 16.5 33 C7.393402095848998 33 0 25.606597904151013 0 16.5 C0 7.393402095849003 7.393402095848998 0 16.5 0 Z" style="stroke: rgb(140, 140, 140); stroke-width: 0; stroke-linecap: butt; stroke-linejoin: miter; fill: url(&quot;#pattern-169271476234111368&quot;);"></path></g></svg>`;
	return (
		<div className="Sources_svgIcon" dangerouslySetInnerHTML={{ __html: svgCode }} />
	)
}

export const lightning = () => {
	const svgCode = `<svg version="1.2" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" class="ng-element" data-id="6160a9a18b444d919b1ebc1d1abd6b01" style="overflow: visible; width: 33px; height: 33px; opacity: 1; mix-blend-mode: normal;><defs><path id="path-169271476227910626" d="M16.5 0 C25.606597904150995 0 33 7.393402095849003 33 16.5 C33 25.606597904151013 25.606597904150995 33 16.5 33 C7.393402095848998 33 0 25.606597904151013 0 16.5 C0 7.393402095849003 7.393402095848998 0 16.5 0 Z"></path><pattern id="pattern-169271476234311457" height="100%" patternUnits="objectBoundingBox" width="114.60055096418733%" x="-14.600550964187335%" y="0%"><image xlink:href="https://s3.amazonaws.com/upload.uxpin/files/1118248/1080825/LV_Signal_Logo_16191c_margins-675168630b49fe34278c03f3c0b9c4f7-92845b.png" height="363" transform="scale(0.09090909090909091, 0.09090909090909091)" width="469"></image></pattern></defs><g transform="translate(0, 0)"><path d="M16.5 0 C25.606597904150995 0 33 7.393402095849003 33 16.5 C33 25.606597904151013 25.606597904150995 33 16.5 33 C7.393402095848998 33 0 25.606597904151013 0 16.5 C0 7.393402095849003 7.393402095848998 0 16.5 0 Z" style="stroke: rgb(140, 140, 140); stroke-width: 0; stroke-linecap: butt; stroke-linejoin: miter; fill: url(&quot;#pattern-169271476234311457&quot;);"></path></g></svg>`;
	return (
		<div className="Sources_svgIcon" dangerouslySetInnerHTML={{ __html: svgCode }} />
	)
}

export const zbd = () => {
	const svgCode = `<svg version="1.2" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" class="ng-element" data-id="cc67d5628c354c5fba6a7060a3cea36d" style="overflow: visible; width: 33px; height: 33px; opacity: 1; mix-blend-mode: normal;><defs><path id="path-169271476231310712" d="M16.5 0 C25.606597904150995 0 33 7.393402095849003 33 16.5 C33 25.606597904151013 25.606597904150995 33 16.5 33 C7.393402095848998 33 0 25.606597904151013 0 16.5 C0 7.393402095849003 7.393402095848998 0 16.5 0 Z"></path><pattern id="pattern-169271476234511635" height="100%" patternUnits="objectBoundingBox" width="100%" x="0%" y="0%"><image xlink:href="https://s3.amazonaws.com/upload.uxpin/files/1118248/1080825/zbd-e3dd55ce5dc369b5a5ca2f89f20dc8b9-46ce09.webp" height="512" transform="scale(0.064453125, 0.064453125)" width="512"></image></pattern></defs><g transform="translate(0, 0)"><path d="M16.5 0 C25.606597904150995 0 33 7.393402095849003 33 16.5 C33 25.606597904151013 25.606597904150995 33 16.5 33 C7.393402095848998 33 0 25.606597904151013 0 16.5 C0 7.393402095849003 7.393402095848998 0 16.5 0 Z" style="stroke: rgb(140, 140, 140); stroke-width: 0; stroke-linecap: butt; stroke-linejoin: miter; fill: url(&quot;#pattern-169271476234511635&quot;);"></path></g></svg>`;
	return (
		<div className="Sources_svgIcon" dangerouslySetInnerHTML={{ __html: svgCode }} />
	)
}

export const stacker = () => {
	const svgCode = `<svg version="1.2" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" class="ng-element" data-id="8ed9c386e6ab4260ad871611baa5b9ac" style="overflow: visible; width: 33px; height: 33px; opacity: 1; mix-blend-mode: normal;><defs><path id="path-169271476227610617" d="M16.5 0 C25.606597904150995 0 33 7.3934020958490025 33 16.5 C33 25.606597904151013 25.606597904150995 33 16.5 33 C7.393402095848998 33 0 25.606597904151013 0 16.5 C0 7.3934020958490025 7.393402095848998 0 16.5 0 Z"></path><pattern id="pattern-169271476234411546" height="100%" patternUnits="objectBoundingBox" width="100%" x="0%" y="0%"><image xlink:href="https://s3.amazonaws.com/upload.uxpin/files/1118248/1080825/sn-56c133cd5b4448f8dc4bdbcb3b6fc748-08dca8.webp" height="225" transform="scale(0.14666666666666667, 0.14666666666666667)" width="225"></image></pattern></defs><g transform="translate(0, 0)"><path d="M16.5 0 C25.606597904150995 0 33 7.3934020958490025 33 16.5 C33 25.606597904151013 25.606597904150995 33 16.5 33 C7.393402095848998 33 0 25.606597904151013 0 16.5 C0 7.3934020958490025 7.393402095848998 0 16.5 0 Z" style="stroke: rgb(140, 140, 140); stroke-width: 0; stroke-linecap: butt; stroke-linejoin: miter; fill: url(&quot;#pattern-169271476234411546&quot;);"></path></g></svg>`;
	return (
		<div className="Sources_svgIcon" dangerouslySetInnerHTML={{ __html: svgCode }} />
	)
}

export const mynodeSmall = () => {
	const svgCode = `<svg version="1.2" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" class="ng-element" data-id="36a39baaac0c4f38a8ad45662046484e" style="overflow: visible; width: 24px; height: 24px; opacity: 1; mix-blend-mode: normal;"><defs><path id="path-169279700542933255" d="M12 0 C18.62298029392798 0 24 5.377019706072 24 12.000000000000005 C24 18.62298029392801 18.62298029392798 24.00000000000001 12 24.00000000000001 C5.377019706071995 24.00000000000001 0 18.62298029392801 0 12.000000000000005 C0 5.377019706072 5.377019706071995 0 12 0 Z"></path><pattern id="pattern-169279700549733532" height="100%" patternUnits="objectBoundingBox" width="100.08818342151675%" x="-0.08818342151675207%" y="0%"><image xlink:href="https://s3.amazonaws.com/upload.uxpin/files/1118248/1080825/home_avatar-a625d3a7f5a8c8d61c6bd89984c99332-75943f.webp" height="567" transform="scale(0.042328042328042326, 0.042328042328042326)" width="568"></image></pattern></defs><g transform="translate(0, 0)"><path d="M12 0 C18.62298029392798 0 24 5.377019706072 24 12.000000000000005 C24 18.62298029392801 18.62298029392798 24.00000000000001 12 24.00000000000001 C5.377019706071995 24.00000000000001 0 18.62298029392801 0 12.000000000000005 C0 5.377019706072 5.377019706071995 0 12 0 Z" style="stroke: rgb(140, 140, 140); stroke-width: 0; stroke-linecap: butt; stroke-linejoin: miter; fill: url(&quot;#pattern-169279700549733532&quot;);"></path></g></svg>`;
	return (
		<div className="" dangerouslySetInnerHTML={{ __html: svgCode }} />
	)
}

export const uncleSmall = () => {
	const svgCode = `<svg version="1.2" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" class="ng-element" data-id="a3f7ed4a2c16436dafd02870fdbb1ce2" style="overflow: visible; width: 24px; height: 24px; opacity: 1; mix-blend-mode: normal; "><defs><path id="path-169279700543333263" d="M12 0 C18.622980293927984 0 24 5.377019706071994 24 12.000000000000007 C24 18.622980293928013 18.622980293927984 24.000000000000014 12 24.000000000000014 C5.377019706071998 24.000000000000014 0 18.622980293928013 0 12.000000000000007 C0 5.377019706071994 5.377019706071998 0 12 0 Z"></path><pattern id="pattern-169279700549333441" height="100%" patternUnits="objectBoundingBox" width="100%" x="0%" y="0%"><image xlink:href="https://s3.amazonaws.com/upload.uxpin/files/1118248/1080825/uncle_jim-d639cb531fb4c5a2929595b6b85bbf5c-bbe8c4.webp" height="512" transform="scale(0.046875, 0.046875)" width="512"></image></pattern></defs><g transform="translate(0, 0)"><path d="M12 0 C18.622980293927984 0 24 5.377019706071994 24 12.000000000000007 C24 18.622980293928013 18.622980293927984 24.000000000000014 12 24.000000000000014 C5.377019706071998 24.000000000000014 0 18.622980293928013 0 12.000000000000007 C0 5.377019706071994 5.377019706071998 0 12 0 Z" style="stroke: rgb(140, 140, 140); stroke-width: 0; stroke-linecap: butt; stroke-linejoin: miter; fill: url(&quot;#pattern-169279700549333441&quot;);"></path></g></svg>`;
	return (
		<div className="" dangerouslySetInnerHTML={{ __html: svgCode }} />
	)
}

export const lightningSmall = () => {
	const svgCode = `<svg version="1.2" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" class="ng-element" data-id="67429c53a39f4d2390fe3f78603e796b" style="overflow: visible; width: 24px; height: 24px; opacity: 1; mix-blend-mode: normal;"><defs><path id="path-169279700542533248" d="M12 0 C18.622980293927984 0 24 5.377019706071994 24 12.000000000000009 C24 18.62298029392801 18.622980293927984 24.000000000000018 12 24.000000000000018 C5.377019706071999 24.000000000000018 0 18.62298029392801 0 12.000000000000009 C0 5.377019706071994 5.377019706071999 0 12 0 Z"></path><pattern id="pattern-169279700549933621" height="100%" patternUnits="objectBoundingBox" width="114.60055096418733%" x="-14.600550964187331%" y="0%"><image xlink:href="https://s3.amazonaws.com/upload.uxpin/files/1118248/1080825/LV_Signal_Logo_16191c_margins-675168630b49fe34278c03f3c0b9c4f7-92845b.png" height="363" transform="scale(0.06611570247933884, 0.06611570247933884)" width="469"></image></pattern></defs><g transform="translate(0, 0)"><path d="M12 0 C18.622980293927984 0 24 5.377019706071994 24 12.000000000000009 C24 18.62298029392801 18.622980293927984 24.000000000000018 12 24.000000000000018 C5.377019706071999 24.000000000000018 0 18.62298029392801 0 12.000000000000009 C0 5.377019706071994 5.377019706071999 0 12 0 Z" style="stroke: rgb(140, 140, 140); stroke-width: 0; stroke-linecap: butt; stroke-linejoin: miter; fill: url(&quot;#pattern-169279700549933621&quot;);"></path></g></svg>`;
	return (
		<div className="" dangerouslySetInnerHTML={{ __html: svgCode }} />
	)
}

export const zbdSmall = () => {
	const svgCode = `<svg version="1.2" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" class="ng-element" data-id="17ed649f123b481886f798247dabf982" style="overflow: visible;width: 24px;height: 24px;opacity: 1;mix-blend-mode: normal;"><defs><path id="path-169279700542233243" d="M12 0 C18.622980293927984 0 24 5.3770197060719935 24 12.000000000000005 C24 18.622980293928013 18.622980293927984 24.00000000000001 12 24.00000000000001 C5.377019706071999 24.00000000000001 0 18.622980293928013 0 12.000000000000005 C0 5.3770197060719935 5.377019706071999 0 12 0 Z"></path><pattern id="pattern-169279700550133710" height="100%" patternUnits="objectBoundingBox" width="100%" x="0%" y="0%"><image xlink:href="https://s3.amazonaws.com/upload.uxpin/files/1118248/1080825/zbd-e3dd55ce5dc369b5a5ca2f89f20dc8b9-46ce09.webp" height="512" transform="scale(0.046875, 0.046875)" width="512"></image></pattern></defs><g transform="translate(0, 0)"><path d="M12 0 C18.622980293927984 0 24 5.3770197060719935 24 12.000000000000005 C24 18.622980293928013 18.622980293927984 24.00000000000001 12 24.00000000000001 C5.377019706071999 24.00000000000001 0 18.622980293928013 0 12.000000000000005 C0 5.3770197060719935 5.377019706071999 0 12 0 Z" style="stroke: rgb(140, 140, 140); stroke-width: 0; stroke-linecap: butt; stroke-linejoin: miter; fill: url(&quot;#pattern-169279700550133710&quot;);"></path></g></svg>`;
	return (
		<div className="" dangerouslySetInnerHTML={{ __html: svgCode }} />
	)
}

export const stackerSmall = () => {
	const svgCode = `<svg version="1.2" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" class="ng-element" data-id="61a1daf435584c6a88670d1afcc8990e" style="overflow: visible; width: 24px; height: 24px; opacity: 1; mix-blend-mode: normal;"><defs><path id="path-169279700541733235" d="M12 0 C18.62298029392798 0 24 5.377019706072 24 12.000000000000004 C24 18.62298029392801 18.62298029392798 24.000000000000007 12 24.000000000000007 C5.377019706071999 24.000000000000007 0 18.62298029392801 0 12.000000000000004 C0 5.377019706072 5.377019706071999 0 12 0 Z"></path><pattern id="pattern-169279700550333799" height="100%" patternUnits="objectBoundingBox" width="100%" x="0%" y="0%"><image xlink:href="https://s3.amazonaws.com/upload.uxpin/files/1118248/1080825/sn-56c133cd5b4448f8dc4bdbcb3b6fc748-08dca8.webp" height="225" transform="scale(0.10666666666666667, 0.10666666666666667)" width="225"></image></pattern></defs><g transform="translate(0, 0)"><path d="M12 0 C18.62298029392798 0 24 5.377019706072 24 12.000000000000004 C24 18.62298029392801 18.62298029392798 24.000000000000007 12 24.000000000000007 C5.377019706071999 24.000000000000007 0 18.62298029392801 0 12.000000000000004 C0 5.377019706072 5.377019706071999 0 12 0 Z" style="stroke: rgb(140, 140, 140); stroke-width: 0; stroke-linecap: butt; stroke-linejoin: miter; fill: url(&quot;#pattern-169279700550333799&quot;);"></path></g></svg>`;
	return (
		<div className="" dangerouslySetInnerHTML={{ __html: svgCode }} />
	)
}

export const closeIcon = () => {
	const svgCode = `<svg version="1.2" preserveAspectRatio="none" class="ng-element fixed-position interactive" data-id="684b564284db4e8888fa11eebb3dc8b8" style="overflow: visible; opacity: 1; mix-blend-mode: normal; width: 28px; height: 28px"><g transform=""><use xlink:href="#path-16927291915041424" filter="url(#filter-16927291915101427)"></use><path d="M20.63768,24c-0.46377,0 -0.92754,-0.17381 -1.21739,-0.52142l-7.42029,-7.41581l-7.36232,7.41581c-0.63768,0.6373 -1.7971,0.6373 -2.43478,0l-1.62319,-1.62221c-0.69565,-0.69523 -0.69565,-1.79602 0,-2.49125l7.36232,-7.41581l-7.42029,-7.41581c-0.34783,-0.28968 -0.52174,-0.75317 -0.52174,-1.21666c0,-0.46349 0.17391,-0.92698 0.52174,-1.21666l1.62319,-1.62221c0.63768,-0.6373 1.7971,-0.6373 2.43478,0l7.36232,7.41581l7.47826,-7.41581c0.63768,-0.6373 1.7971,-0.6373 2.43478,0l1.62319,1.62221c0.34783,0.34762 0.52174,0.75317 0.52174,1.21666c0,0.46349 -0.17391,0.92698 -0.52174,1.21666l-7.36232,7.41581l7.36232,7.41581c0.69565,0.69523 0.69565,1.79602 0,2.49125l-1.62319,1.62221c-0.34783,0.28968 -0.75362,0.52142 -1.21739,0.52142zM12,14.44056l8.23188,8.22692c0.23188,0.23174 0.57971,0.23174 0.81159,0l1.62319,-1.62221c0.23188,-0.23174 0.23188,-0.57936 0,-0.8111l-8.17391,-8.28485l8.17391,-8.22692c0.11594,-0.11587 0.17391,-0.23174 0.17391,-0.40555c0,-0.17381 -0.05797,-0.28968 -0.17391,-0.40555l-1.62319,-1.62221c-0.23188,-0.23174 -0.57971,-0.23174 -0.81159,0l-8.23188,8.22692l-8.23188,-8.22692c-0.23188,-0.23174 -0.57971,-0.23174 -0.81159,0l-1.62319,1.62221c-0.11594,0.11587 -0.17391,0.28968 -0.17391,0.40555c0,0.11587 0.05797,0.28968 0.17391,0.40555l8.23188,8.22692l-8.23188,8.22692c-0.23188,0.23174 -0.23188,0.57936 0,0.8111l1.62319,1.62221c0.23188,0.23174 0.57971,0.23174 0.81159,0z" style="stroke-width: 0; stroke-linecap: butt; stroke-linejoin: miter; fill: rgb(41, 171, 226);"></path></g><defs><path id="path-16927291915041424" d="M20.63768,24c-0.46377,0 -0.92754,-0.17381 -1.21739,-0.52142l-7.42029,-7.41581l-7.36232,7.41581c-0.63768,0.6373 -1.7971,0.6373 -2.43478,0l-1.62319,-1.62221c-0.69565,-0.69523 -0.69565,-1.79602 0,-2.49125l7.36232,-7.41581l-7.42029,-7.41581c-0.34783,-0.28968 -0.52174,-0.75317 -0.52174,-1.21666c0,-0.46349 0.17391,-0.92698 0.52174,-1.21666l1.62319,-1.62221c0.63768,-0.6373 1.7971,-0.6373 2.43478,0l7.36232,7.41581l7.47826,-7.41581c0.63768,-0.6373 1.7971,-0.6373 2.43478,0l1.62319,1.62221c0.34783,0.34762 0.52174,0.75317 0.52174,1.21666c0,0.46349 -0.17391,0.92698 -0.52174,1.21666l-7.36232,7.41581l7.36232,7.41581c0.69565,0.69523 0.69565,1.79602 0,2.49125l-1.62319,1.62221c-0.34783,0.28968 -0.75362,0.52142 -1.21739,0.52142zM12,14.44056l8.23188,8.22692c0.23188,0.23174 0.57971,0.23174 0.81159,0l1.62319,-1.62221c0.23188,-0.23174 0.23188,-0.57936 0,-0.8111l-8.17391,-8.28485l8.17391,-8.22692c0.11594,-0.11587 0.17391,-0.23174 0.17391,-0.40555c0,-0.17381 -0.05797,-0.28968 -0.17391,-0.40555l-1.62319,-1.62221c-0.23188,-0.23174 -0.57971,-0.23174 -0.81159,0l-8.23188,8.22692l-8.23188,-8.22692c-0.23188,-0.23174 -0.57971,-0.23174 -0.81159,0l-1.62319,1.62221c-0.11594,0.11587 -0.17391,0.28968 -0.17391,0.40555c0,0.11587 0.05797,0.28968 0.17391,0.40555l8.23188,8.22692l-8.23188,8.22692c-0.23188,0.23174 -0.23188,0.57936 0,0.8111l1.62319,1.62221c0.23188,0.23174 0.57971,0.23174 0.81159,0z"></path><filter height="116.66666319444516%" id="filter-16927291915101427" width="116.66666666666667%" x="-8.333333333333332%" y="-8.333331597222585%"><feFlood flood-opacity="0" result="backgroundFix"></feFlood><feColorMatrix in="SourceAlpha" result="hardAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"></feColorMatrix><feOffset dx="0" dy="0"></feOffset><feGaussianBlur stdDeviation="1.1666666666666665"></feGaussianBlur><feColorMatrix in="" result="" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0"></feColorMatrix><feBlend in2="backgroundFix" mode="normal" result="shadowOuter_1"></feBlend></filter></defs></svg>`;
	return (
		<div dangerouslySetInnerHTML={{ __html: svgCode }} />
	)
}

export const arrowLeft = () => {
	const svgCode = `<svg version="1.2" preserveAspectRatio="none" viewBox="0 0 24 24" class="ng-element" data-id="8c04bbe7ff1c40c99338e907c691102d" stroke-linecap="null" stroke-linejoin="null" style="opacity: 1; mix-blend-mode: normal; fill: rgb(176, 176, 176); width: 24px; height: 24px; "><g><path xmlns:default="http://www.w3.org/2000/svg" d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" style="fill: rgb(176, 176, 176);"></path></g></svg>`;
	return (
		<div className="Receive_arrow" dangerouslySetInnerHTML={{ __html: svgCode }} />
	)
}

export const arrowRight = (inline = false) => {
	const svgCode = `<svg version="1.2" preserveAspectRatio="none" viewBox="0 0 24 24" class="ng-element" data-id="c1a1bae0abe4453f83674d3da4669950" stroke-linecap="null" stroke-linejoin="null" style="opacity: 1; mix-blend-mode: normal; fill: rgb(176, 176, 176); width: 24px; height: 24px; "><g><path xmlns:default="http://www.w3.org/2000/svg" d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z" style="fill: rgb(176, 176, 176);"></path></g></svg>`;
	return (
		<div className={inline ? 'Receive_copy_icon Receive_arrow' : 'Receive_arrow'} dangerouslySetInnerHTML={{ __html: svgCode }} />
	)
}

export const arrow = () => {
	const svgCode = `<svg version="1.2" preserveAspectRatio="none" viewBox="0 0 24 24" class="ng-element interactive" data-id="146af6c51fef43f0ab5ae4021b59035e" stroke-linecap="null" stroke-linejoin="null" style=""><g><path xmlns:default="http://www.w3.org/2000/svg" id="chevron-right" d="M17.4,11.99c0-0.18-0.07-0.35-0.2-0.47L9.48,3.8C9.23,3.55,8.82,3.54,8.56,3.78  C8.55,3.79,8.54,3.8,8.54,3.8L6.81,5.53C6.55,5.77,6.54,6.18,6.78,6.44C6.79,6.45,6.8,6.46,6.81,6.47l5.53,5.53l-5.53,5.53  c-0.26,0.25-0.27,0.66-0.02,0.92c0.01,0.01,0.01,0.01,0.02,0.02l1.73,1.73c0.25,0.26,0.66,0.27,0.92,0.02  c0.01-0.01,0.01-0.01,0.02-0.02l7.73-7.73C17.33,12.34,17.4,12.17,17.4,11.99z" style="fill: rgb(255, 255, 255);"></path></g></svg>`;
	return (
		<div className="Send_IMG_Close" dangerouslySetInnerHTML={{ __html: svgCode }} />
	)
}

export const notification = () => {
	const svgCode = '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.2" overflow="visible" preserveAspectRatio="none" viewBox="-13.160000000000025 0 658 658" width="24" height="24"><g><path xmlns:default="http://www.w3.org/2000/svg" d="M552.5,389.4V236.8C552.5,105.2,447.3,0,315.7,0S78.9,105.2,78.9,236.8v152.6L0,578.8h78.9h157.9  c0,44.7,34.2,78.9,78.9,78.9c44.7,0,78.9-34.2,78.9-78.9h157.9h78.9L552.5,389.4z M315.7,26.3c115.8,0,210.5,94.7,210.5,210.5v131.5  H105.2V236.8C105.2,121,199.9,26.3,315.7,26.3z M315.7,631.4c-28.9,0-52.6-23.7-52.6-52.6h105.2  C368.3,607.7,344.6,631.4,315.7,631.4z M78.9,552.5H39.5l63.1-152.6l2.6-5.3h420.9l2.6,5.3L592,552.5h-39.5H78.9z" style="fill: rgb(41, 171, 226);" vector-effect="non-scaling-stroke"/></g></svg>';
	return (
		<div className="" dangerouslySetInnerHTML={{ __html: svgCode }} />
	)
}

export const oval = () => {
	const svgCode = '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.2" overflow="visible" preserveAspectRatio="none" viewBox="0 0 8 8" width="8" height="8"><g transform="translate(0, 0)"><defs><path id="path-16987583019702256" d="M4 0 C6.2076600979759995 0 8 1.7923399020239992 8 3.9999999999999987 C8 6.207660097975998 6.2076600979759995 7.999999999999997 4 7.999999999999997 C1.7923399020239996 7.999999999999997 0 6.207660097975998 0 3.9999999999999987 C0 1.7923399020239992 1.7923399020239996 0 4 0 Z" vector-effect="non-scaling-stroke"/></defs><g transform="translate(0, 0)"><path d="M4 0 C6.2076600979759995 0 8 1.7923399020239992 8 3.9999999999999987 C8 6.207660097975998 6.2076600979759995 7.999999999999997 4 7.999999999999997 C1.7923399020239996 7.999999999999997 0 6.207660097975998 0 3.9999999999999987 C0 1.7923399020239992 1.7923399020239996 0 4 0 Z" style="stroke: rgb(140, 140, 140); stroke-width: 0; stroke-linecap: butt; stroke-linejoin: miter; fill: rgb(255, 119, 0);" vector-effect="non-scaling-stroke"/></g></g></svg>';
	return (
		<div className="Header_oval" dangerouslySetInnerHTML={{ __html: svgCode }} />
	)
}

export const deleteNotify = () => {
	const svgCode = '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.2" overflow="visible" preserveAspectRatio="none" viewBox="0 0 24 24" width="16" height="16"><g><path xmlns:default="http://www.w3.org/2000/svg" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" style="fill: rgb(140, 140, 140);" vector-effect="non-scaling-stroke"/></g></svg>';
	return (
		<div dangerouslySetInnerHTML={{ __html: svgCode }} />
	)
}

export const check = (inline = false) => {
	const svgCode = '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.2" overflow="visible" preserveAspectRatio="none" viewBox="0 0 24 24" width="14" height="14"><g><defs> </defs> <rect display="none" fill="#FFA400" width="24" height="24" style="fill: rgb(41, 171, 226);" vector-effect="non-scaling-stroke"/> <rect id="_x3C_Slice_x3E__109_" display="none" fill="none" width="24" height="24" style="fill: rgb(41, 171, 226);" vector-effect="non-scaling-stroke"/> <polygon fill-rule="evenodd" clip-rule="evenodd" points="20.5,2 9.5,16.5 3,10 0,13 10,23 24,5 " style="fill: rgb(41, 171, 226);" vector-effect="non-scaling-stroke"/> </g></svg>';
	return (
		<div className={inline ? 'Receive_copy_icon' : ''} dangerouslySetInnerHTML={{ __html: svgCode }} />
	)
}

export const verticalLine = () => {
	const svgCode = '<svg version="1.2" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" overflow="visible" preserveAspectRatio="none" viewBox="0 0 3 25" width="3" height="25"><g transform="translate(1, 1)"><defs><path id="path-171146783412715052" d="M145 -117.55555555555557 C145 -117.55555555555557 145 -94.55555555555553 145 -94.55555555555553" vector-effect="non-scaling-stroke"/><filter height="117.3913043478261%" id="filter-171146783422816345" width="500%" x="-200%" y="-8.695652173913043%" vector-effect="non-scaling-stroke"><feFlood flood-opacity="0" result="backgroundFix" vector-effect="non-scaling-stroke"/><feColorMatrix in="SourceAlpha" result="hardAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" vector-effect="non-scaling-stroke"/><feOffset dx="0" dy="0" vector-effect="non-scaling-stroke"/><feGaussianBlur stdDeviation="1.1666666666666665" vector-effect="non-scaling-stroke"/><feColorMatrix in="" result="" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" vector-effect="non-scaling-stroke"/><feBlend in2="backgroundFix" mode="normal" result="shadowOuter_1" vector-effect="non-scaling-stroke"/></filter></defs><g transform="translate(-145, 117.55555555555557)"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#path-171146783412715052" filter="url(#filter-171146783422816345)" vector-effect="non-scaling-stroke"/><path d="M145 -117.55555555555557 C145 -117.55555555555557 145 -94.55555555555553 145 -94.55555555555553" style="stroke: rgb(140, 140, 140); stroke-width: 1; stroke-linecap: butt; stroke-linejoin: miter; fill: none;" vector-effect="non-scaling-stroke"/></g></g></svg>';
	return (
		<div dangerouslySetInnerHTML={{ __html: svgCode }} />
	)
}

export const pubNavMenu = () => {
	const svgCode = '<svg version="1.2" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" overflow="visible" preserveAspectRatio="none" viewBox="0 0 24 24" width="27" height="23"><g><path xmlns:default="http://www.w3.org/2000/svg" d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" style="fill: rgb(160, 18, 199);" vector-effect="non-scaling-stroke"/></g></svg>';
	return (
		<div dangerouslySetInnerHTML={{ __html: svgCode }} />
	)
}

export const copyWhite = () => {
	const svgCode = '<svg version="1.2" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" overflow="visible" preserveAspectRatio="none" viewBox="0 0 24 24" width="24" height="24"><g><path xmlns:default="http://www.w3.org/2000/svg" d="M16,1H4C2.9,1,2,1.9,2,3v14h2V3h12V1z M19,5H8C6.9,5,6,5.9,6,7v14c0,1.1,0.9,2,2,2h11c1.1,0,2-0.9,2-2V7 C21,5.9,20.1,5,19,5z M19,21H8V7h11V21z" style="fill: rgb(255, 255, 255);" vector-effect="non-scaling-stroke"/></g></svg>';
	return (
		<div dangerouslySetInnerHTML={{ __html: svgCode }} />
	)
}

export const closeQuestion = () => {
	const svgCode = '<svg version="1.2" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" overflow="visible" preserveAspectRatio="none" viewBox="0 0 41 41" width="16" height="16"><g><path xmlns:default="http://www.w3.org/2000/svg" d="M35.6,41.5c-0.8,0-1.6-0.3-2.1-0.9L20.7,27.8L8,40.6c-1.1,1.1-3.1,1.1-4.2,0l-2.8-2.8c-1.2-1.2-1.2-3.1,0-4.3l12.7-12.8  L0.9,7.9C0.3,7.4,0,6.6,0,5.8s0.3-1.6,0.9-2.1l2.8-2.8c1.1-1.1,3.1-1.1,4.2,0l12.7,12.8L33.5,0.9c1.1-1.1,3.1-1.1,4.2,0l2.8,2.8  c0.6,0.6,0.9,1.3,0.9,2.1s-0.3,1.6-0.9,2.1L27.8,20.7l12.7,12.8c1.2,1.2,1.2,3.1,0,4.3l-2.8,2.8C37.1,41.1,36.4,41.5,35.6,41.5z   M20.7,25l14.2,14.2c0.4,0.4,1,0.4,1.4,0l2.8-2.8c0.4-0.4,0.4-1,0-1.4L25,20.7L39.1,6.5c0.2-0.2,0.3-0.4,0.3-0.7s-0.1-0.5-0.3-0.7  l-2.8-2.8c-0.4-0.4-1-0.4-1.4,0L20.7,16.5L6.5,2.3c-0.4-0.4-1-0.4-1.4,0L2.3,5.1C2.1,5.3,2,5.6,2,5.8s0.1,0.5,0.3,0.7l14.2,14.2  L2.3,34.9c-0.4,0.4-0.4,1,0,1.4l2.8,2.8c0.4,0.4,1,0.4,1.4,0L20.7,25z" style="fill: rgb(196, 52, 224);" vector-effect="non-scaling-stroke"/></g></svg>';
	return (
		<div dangerouslySetInnerHTML={{ __html: svgCode }} />
	)
}

export const YellowState = () => {
	const svgCode =
		'<svg version="1.2" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" overflow="visible" preserveAspectRatio="none" viewBox="0 0 15 15" width="15" height="15"><g transform="translate(0, 0)"><defs><path id="path-172386722092776505" d="M7.5 0 C11.639362683705 0 15 3.360637316295001 15 7.5 C15 11.639362683705006 11.639362683705 15 7.5 15 C3.3606373162949987 15 0 11.639362683705006 0 7.5 C0 3.360637316295001 3.3606373162949987 0 7.5 0 Z" vector-effect="non-scaling-stroke"/><filter height="126.66666666666666%" id="filter-172386722095877789" width="126.66666666666666%" x="-13.333333333333334%" y="-13.333333333333334%" vector-effect="non-scaling-stroke"><feFlood flood-opacity="0" result="backgroundFix" vector-effect="non-scaling-stroke"/><feColorMatrix in="SourceAlpha" result="hardAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" vector-effect="non-scaling-stroke"/><feOffset dx="0" dy="0" vector-effect="non-scaling-stroke"/><feGaussianBlur stdDeviation="1.1666666666666665" vector-effect="non-scaling-stroke"/><feColorMatrix in="" result="" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" vector-effect="non-scaling-stroke"/><feBlend in2="backgroundFix" mode="normal" result="shadowOuter_1" vector-effect="non-scaling-stroke"/></filter></defs><g transform="translate(0, 0)"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#path-172386722092776505" filter="url(#filter-172386722095877789)" vector-effect="non-scaling-stroke"/><path d="M7.5 0 C11.639362683705 0 15 3.360637316295001 15 7.5 C15 11.639362683705006 11.639362683705 15 7.5 15 C3.3606373162949987 15 0 11.639362683705006 0 7.5 C0 3.360637316295001 3.3606373162949987 0 7.5 0 Z" style="stroke: rgb(140, 140, 140); stroke-width: 0; stroke-linecap: butt; stroke-linejoin: miter; fill: rgb(204, 199, 49);" vector-effect="non-scaling-stroke"/></g></g></svg>';
	return (
		<div dangerouslySetInnerHTML={{ __html: svgCode }}></div>
	)
}

export const GreenState = () => {
	const svgCode =
		'<svg version="1.2" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" overflow="visible" preserveAspectRatio="none" viewBox="0 0 15 15" width="15" height="15"><g transform="translate(0, 0)"><defs><path id="path-172386722092776501" d="M7.5 0 C11.639362683705 0 15 3.3606373162950014 15 7.5000000000000036 C15 11.639362683705007 11.639362683705 15.000000000000007 7.5 15.000000000000007 C3.3606373162949987 15.000000000000007 0 11.639362683705007 0 7.5000000000000036 C0 3.3606373162950014 3.3606373162949987 0 7.5 0 Z" vector-effect="non-scaling-stroke"/><filter height="126.66666666666666%" id="filter-172386722095977790" width="126.66666666666666%" x="-13.333333333333334%" y="-13.333333333333334%" vector-effect="non-scaling-stroke"><feFlood flood-opacity="0" result="backgroundFix" vector-effect="non-scaling-stroke"/><feColorMatrix in="SourceAlpha" result="hardAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" vector-effect="non-scaling-stroke"/><feOffset dx="0" dy="0" vector-effect="non-scaling-stroke"/><feGaussianBlur stdDeviation="1.1666666666666665" vector-effect="non-scaling-stroke"/><feColorMatrix in="" result="" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" vector-effect="non-scaling-stroke"/><feBlend in2="backgroundFix" mode="normal" result="shadowOuter_1" vector-effect="non-scaling-stroke"/></filter></defs><g transform="translate(0, 0)"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#path-172386722092776501" filter="url(#filter-172386722095977790)" vector-effect="non-scaling-stroke"/><path d="M7.5 0 C11.639362683705 0 15 3.3606373162950014 15 7.5000000000000036 C15 11.639362683705007 11.639362683705 15.000000000000007 7.5 15.000000000000007 C3.3606373162949987 15.000000000000007 0 11.639362683705007 0 7.5000000000000036 C0 3.3606373162950014 3.3606373162949987 0 7.5 0 Z" style="stroke: rgb(140, 140, 140); stroke-width: 0; stroke-linecap: butt; stroke-linejoin: miter; fill: rgb(50, 168, 82);" vector-effect="non-scaling-stroke"/></g></g></svg>';
	return <div dangerouslySetInnerHTML={{ __html: svgCode }}></div>;
};

