import styled from 'styled-components';

export const Wrapper = styled.div`
  font-family: Montserrat;
  width: 100% !important;
  position: fixed;
  text-align: center;
  height: 0;
  transform: translate(-50%, 0);
  margin-left: 50%;
  overflow: show;
  top: 20vh;
  left: auto;
  z-index: 700;
  outline: 0;
  visibility: visible;
`;

export const Backdrop = styled.div`
  font-family: Montserrat;
  background-color: #000000cc;
  opacity: 0.8 !important;
  position: fixed;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  z-index: 500;
`;

export const StyledModal = styled.div<{ $variant?: "default" | "lnpub" }>`
  width: 90%;
  max-width: 600px;
  font-family: Montserrat;
  padding: 25px 20px 25px 20px;
  text-align: center;
  z-index: 100;
  font-size: 20px;
  margin: auto;
  border-radius: 5px;
  position: relative;

  ${(p) =>
		p.$variant === "lnpub"
			? `
    --lp-a: #ff8a00;
    --lp-b: #f040f5;
    --prod-gradient: linear-gradient(90deg, var(--lp-a), var(--lp-b));
    border-radius: 12px;
    padding: 22px 18px;
    font-size: 16px;
    color: var(--ion-text-color, #fcfcfc);
    background: linear-gradient(var(--ion-background-color, #16191c), var(--ion-background-color, #16191c))
        padding-box,
      var(--prod-gradient) border-box;
    border: 2px solid transparent;
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.35);
  `
			: `
    border: 1px solid #29abe2;
    background-color: var(--ion-color-light);
  `}
`;

export const Header = styled.div`
  font-family: Montserrat;
  text-align: right;
  border-radius: 8px 8px 0 0;
  justify-content: space-between;
`;

export const HeaderText = styled.div`
  font-family: Montserrat;
`;

export const CloseButton = styled.button`
  font-family: Montserrat;
  font-size: 0.8rem;
  border: none;
  border-radius: 3px;
  margin-left: 0.5rem;
  background: none;
  :hover {
    cursor: pointer;
  }
`;

export const Content = styled.div`
  font-family: Montserrat;
  max-height: 30rem;
`;
