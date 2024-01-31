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

export const StyledModal = styled.div`
  width: 90%;
  max-width: 600px;
  border: 1px solid #29abe2;
  font-family: Montserrat;
  padding: 25px 20px 0px 20px;
  text-align: center;
  z-index: 100;
  font-size: 20px;
  background: linear-gradient(135deg, #16191c, #151d24);
  margin: auto;
  border-radius: 5px;
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
  overflow-x: hidden;
  overflow-y: auto;
`;
