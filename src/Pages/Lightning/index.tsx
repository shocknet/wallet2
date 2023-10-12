import React, { useEffect } from "react";
import {  } from "react-router-dom";
import { useIonRouter } from '@ionic/react';
import { useSelector, useDispatch } from 'react-redux';
import { nostr, setNostrPrivateKey } from "../../Api/nostr";
import { NOSTR_PRIVATE_KEY_STORAGE_KEY, NOSTR_PUB_DESTINATION, options } from "../../constants";
import { addPaySources } from "../../State/Slices/paySourcesSlice";
import { addSpendSources } from "../../State/Slices/spendSourcesSlice";

export const Lightning = () => {

  return(
    <div className="NodeUp">
      <div className="NodeUp_title">Lightning</div>
      </div>
  )
}