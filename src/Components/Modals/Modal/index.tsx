import React, { FunctionComponent } from 'react';
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
  variant = "default",
}) => {
  const modal = (
    <React.Fragment>
      <Backdrop id="backdrop-background" onClick={hide} onTouchEnd={hide} />
      <Wrapper>
        <StyledModal
          $variant={variant}
          data-product={variant === "lnpub" ? "lnpub" : undefined}
          data-theme={variant === "lnpub" ? "dark" : undefined}
        >
          <Content>{modalContent}</Content>
        </StyledModal>
      </Wrapper>
    </React.Fragment>
  );

  return isShown ? ReactDOM.createPortal(modal, document.body) : null;
};
