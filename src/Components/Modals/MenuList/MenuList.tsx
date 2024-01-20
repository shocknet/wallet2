import styled from 'styled-components';

export const Wrapper = styled.div`
  font-family: Montserrat;
  width: 100% !important;
  max-width: 1200px;
  top: 0;
  left: 50%;
  transform: translate(-50%, -50%);
  position: fixed;
  z-index: 700;
  outline: 0;
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
  width: 250px;
<<<<<<< HEAD
  top: 70px;
  right: 0;
=======
  top: 10vh;
  right: 3px;
>>>>>>> 24401f6d2edd19a588162aa3edd9e5eb67e9c7a1
  border: 1px solid #29abe2;
  font-family: Montserrat;
  padding: 25px 10px 0px 10px;
  text-align: right;
  z-index: 100;
  font-size: 20px;
  background: #16191c;
  position: fixed;
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
