import styled from 'styled-components';

export const Wrapper = styled.div`
  font-family: Montserrat;
  width: 70% !important;
  position: fixed;
  top: 0;
  right: 0;
  z-index: 700;
  outline: 0;
`;

export const Backdrop = styled.div`
  font-family: Montserrat;
  background-color: #16191c;
  opacity: 0.8 !important;
  position: fixed;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  z-index: 500;
`;

export const StyledModal = styled.div`
  border: 1.2px solid #29abe2;
  border-right: none;
  font-family: Montserrat;
  padding: 25px 5% 25px 3%;
  text-align: right;
  z-index: 100;
  font-size: 20px;
  background: #16191c;
  position: fixed;
  margin: auto;
  border-radius: 8px;
  top: 0;
  right: -1px;
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
