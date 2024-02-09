import React, { FunctionComponent } from 'react';
import ReactDOM from 'react-dom';

import {
  Wrapper,
  StyledModal,
  Content,
  Backdrop,
} from './MenuList';
import { ModalProps } from '../../../globalTypes';

export const MenuList: FunctionComponent<ModalProps> = ({
  isShown,
  hide,
  modalContent,
}) => {
  const modal = (
    <React.Fragment>
      <Backdrop onClick={hide} />
      <Wrapper>
        <StyledModal>
          <Content>{modalContent}</Content>
        </StyledModal>
      </Wrapper>
    </React.Fragment>
  );

  return isShown ? ReactDOM.createPortal(modal, document.body) : null;
};
