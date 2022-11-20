import styled from 'styled-components';

export const Wrapper = styled.div`
  width: 70% !important;
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 700;
  outline: 0;
`;

export const Backdrop = styled.div`
  background-color: black;
  opacity: 0.6;
  position: fixed;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  z-index: 500;
`;

export const StyledModal = styled.div`
  padding: 20px;
  text-align: center;
  z-index: 100;
  font-size: 20px;
  background: #202020;
  border-radius: 2rem !important;
  position: relative;
  margin: auto;
  border-radius: 8px;
`;

export const Header = styled.div`
  text-align: center;
  border-radius: 8px 8px 0 0;
  justify-content: space-between;
  padding: 0.3rem;
`;

export const HeaderText = styled.div`
  color: #fff;
  align-self: center;
  color: lightgray;
`;

export const CloseButton = styled.button`
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
  padding: 10px;
  max-height: 30rem;
  overflow-x: hidden;
  overflow-y: auto;
`;
