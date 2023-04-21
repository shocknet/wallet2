export const PriceDown = () => {
    const svgCode = '<svg version="1.2" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" overflow="visible" preserveAspectRatio="none" viewBox="0 0 24 24" width="24" height="24"><g><path xmlnsDefault="http://www.w3.org/2000/svg" d="M16 18l2.29-2.29-4.88-4.88-4 4L2 7.41 3.41 6l6 6 4-4 6.3 6.29L22 12v6z" style="fill: rgb(186, 41, 41);" vector-effect="non-scaling-stroke"/></g></svg>';
    return (
        <div dangerouslySetInnerHTML={{__html: svgCode}} />
    )
}

export const SourceItemMenu = () => {
    const svgCode = '<svg version="1.2" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" overflow="visible" preserveAspectRatio="none" viewBox="0 0 24 24" width="20" height="20"><g><defs xmlnsDefault="http://www.w3.org/2000/svg"><path d="M0 0h24v24H0V0z" id="a" style="fill: rgb(42, 171, 225);" vector-effect="non-scaling-stroke"/></defs><clipPath xmlnsDefault="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" id="b" vector-effect="non-scaling-stroke"><use xlink:href="#a" vector-effect="non-scaling-stroke"/></clipPath><path xmlnsDefault="http://www.w3.org/2000/svg" clip-path="url(#b)" d="M20 9H4v2h16V9zM4 15h16v-2H4v2z" style="fill: rgb(42, 171, 225);" vector-effect="non-scaling-stroke"/></g></svg>';
    return (
        <div className="Sources_IMG_SourceItemMenu" dangerouslySetInnerHTML={{__html: svgCode}} />
    )
}

export const EditSource = () => {
    const svgCode = '<svg version="1.2" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" overflow="visible" preserveAspectRatio="none" viewBox="0 0 24 24" width="12" height="12"><g><path xmlnsDefault="http://www.w3.org/2000/svg" d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" style="fill: rgb(137, 137, 137);" vector-effect="non-scaling-stroke"/></g></svg>';
    return (
        <div className="Sources_IMG_EditSource" dangerouslySetInnerHTML={{__html: svgCode}} />
    )
}
