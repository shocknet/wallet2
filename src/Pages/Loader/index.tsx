import React, { useState, useEffect } from 'react';
import { PageProps, ActionType } from "../../globalTypes";

//It import svg icons library
import * as Icons from "../../Assets/SvgIconLibrary";
import { useIonRouter } from '@ionic/react';
import { nip19 } from 'nostr-tools';
import { dispatch } from 'rxjs/internal/observable/pairs';
import { addPaySources } from '../../State/Slices/paySourcesSlice';
import { addSpendSources } from '../../State/Slices/spendSourcesSlice';
import { NOSTR_PUB_DESTINATION, NOSTR_RELAYS, options } from '../../constants';
import { useDispatch, useSelector } from 'react-redux';

export const Loader = () => {
  const router = useIonRouter();
  const dispatch = useDispatch();
  const paySources = useSelector((state) => state.spendSource);
  const spendSources = useSelector((state) => state.spendSource);
  useEffect(() => {
    /*
      It is test for redirects page to "Home" page when loaded all require data
      We can change this function with async function after complete this part 
    */
    addBootStrapSources();
  }, []);

  const addBootStrapSources = async () => {
    if (paySources.length!=0&&spendSources.length!=0) {
      return;
    }else {
      let bootstrapBalance = "0";
      let nprofile = nip19.nprofileEncode({ pubkey: NOSTR_PUB_DESTINATION, relays: NOSTR_RELAYS })
      dispatch(addPaySources(
        {
          id: 0,
          label: "Bootstrap Node",
          pasteField: nprofile,
          option: options.little,
          icon: "0",
        }
      ));
      dispatch(addSpendSources(
        {
          id: 0,
          label: "Bootstrap Node",
          pasteField: nprofile,
          option: options.little,
          icon: "0",
          balance: bootstrapBalance,
        }
      ))
    }
    setTimeout(() => {
      router.push("/home");
    }, 500);
  }

  return(
    <section className="Loader">
      <div className="Loader_msg">Reticulating splines...</div>
      <div className="Loader_img">
        {Icons.Animation()}
      </div>
    </section>
  )
}
