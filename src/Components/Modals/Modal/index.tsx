import React, { FunctionComponent, useEffect } from 'react';
import ReactDOM from 'react-dom';

import {
  Wrapper,
  StyledModal,
  Content,
  Backdrop,
} from './Modal.style';
import { ModalProps } from '../../../globalTypes';


export const Modal: FunctionComponent<ModalProps> = ({
  isShown,
  hide,
  modalContent,
}) => {
  const modal = (
    <React.Fragment>
      <Backdrop id="backdrop-background" onClick={hide} onTouchEnd={hide} />
      <Wrapper>
        <StyledModal>
          <Content>{modalContent}</Content>
        </StyledModal>
      </Wrapper>
    </React.Fragment>
  );

  return isShown ? ReactDOM.createPortal(modal, document.body) : null;
};
