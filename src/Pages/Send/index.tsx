import React, { lazy, Suspense, useEffect, useState } from 'react';
import { useSelector, useDispatch, selectEnabledSpends } from '../../State/store';
import {
  IonAvatar,
  IonButton,
  IonCol,
  IonContent,
  IonFooter,
  IonGrid,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonNote,
  IonPage,
  IonPopover,
  IonRow,
  IonSpinner,
  IonText,
  IonToolbar,
  isPlatform,
  useIonModal,
  useIonViewWillEnter
} from '@ionic/react';
import { defaultMempool } from '../../constants';
import "./styles/index.css";
import useDebounce from '../../Hooks/useDebounce';
import { RouteComponentProps, useLocation } from 'react-router';
import {
  logoBitcoin,
  qrCodeOutline,
  flash,
  informationCircle,
  globeOutline,
  checkmarkCircle,
  helpCircleOutline,
  atCircleOutline,
} from 'ionicons/icons';
import { SpendFrom } from '@/globalTypes';
import { CustomSelect } from '@/Components/CustomSelect';
import { InputState } from './types';
import ScanModal from '@/Components/Modals/ScanModal';
import { OverlayEventDetail } from '@ionic/react/dist/types/components/react-component-lib/interfaces';
import { sendPaymentThunk } from '@/State/history/thunks';
import BackHeader from '@/Layout2/BackHeader';
import { useToast } from '@/lib/contexts/useToast';
import { InputClassification } from '@/lib/types/parse';
import { identifyBitcoinInput, parseBitcoinInput } from '@/lib/parse';
import { FeeTier, getFeeTiers } from '@/lib/fees';
import { Satoshi } from '@/lib/types/units';
import { parseUserInputToSats } from '@/lib/units';
import { getIconFromClassification } from '@/lib/icons';
import { useAlert } from '@/lib/contexts/useAlert';

const LnurlCard = lazy(() => import("./LnurlCard"));
const InvoiceCard = lazy(() => import("./InvoiceCard"));
const NofferCard = lazy(() => import("./NofferCard"));
const OnChainCard = lazy(() => import("./OnChainCard"));


const Send: React.FC<RouteComponentProps> = ({ history }) => {
  const location = useLocation<{ input: string }>();
  const dispatch = useDispatch();
  const enabledSpendSources = useSelector(selectEnabledSpends);
  const mempoolUrl = useSelector(({ prefs }) => prefs.mempoolUrl) || defaultMempool;

  const { showAlert } = useAlert();
  const { showToast } = useToast();

  const [selectedSource, setSelectedSource] = useState(enabledSpendSources[0]);
  const isPubSource = !!selectedSource.pubSource;

  // To show which scanner to use
  const [isMobile, setIsMobile] = useState(false);


  // Check whether we have at least one spend source THAT also has enough balance (maxWithdrawable > 0)
  // Show alert if not
  useIonViewWillEnter(() => {
    setIsMobile(isPlatform("hybrid"));

    setAmountInSats(null);
    setDisplayValue("");
    if (location.state.input) {
      setRecipient(location.state.input);
    }
    if (enabledSpendSources.length === 0) {
      showAlert({
        header: "No Spend Sources",
        message: "You need to add a spend source before sending payments.",
        buttons: [
          {
            text: "Cancel",
            role: "cancel",
            handler: () => {
              history.replace("/");
            }
          },
          {
            text: "Add Source",
            handler: () => {
              history.replace("/sources");
            }
          },

        ]
      })
    }
    if (selectedSource && (Number(selectedSource.maxWithdrawable) === 0 || Number(selectedSource.balance) === 0)) {
      const foundOneWithBalance = enabledSpendSources.find(s => Number(s.maxWithdrawable) > 0);
      if (foundOneWithBalance) {
        setSelectedSource(foundOneWithBalance)
      } else {
        showAlert({
          header: "No Spend Source With Enough Balance",
          message: "You need to receive enough sats to send payments.",
          buttons: [
            {
              text: "Cancel",
              role: "cancel",
            },
            {
              text: "Receive",
              handler: () => {
                history.replace("/receive");
              }
            }
          ]
        })
      }
    }
  }, [enabledSpendSources])


  // Fee tiers for on chain transactions
  const [feeTiers, setFeeTiers] = useState<FeeTier[]>([]);
  const [selectedFeeTier, setSelectedFeeTier] = useState(1);  // Default to avergae fee rate

  const fetchFeeTiers = async () => {
    try {
      const tiers = await getFeeTiers(mempoolUrl);

      setFeeTiers(tiers);
    } catch (err) {
      console.error("Failed to fetch fees", mempoolUrl, err);
    }
  };

  useEffect(() => {
    fetchFeeTiers();

    const interval = setInterval(fetchFeeTiers, 120000); // Refresh every 2 minutes
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);



  // Recipient
  const [recipient, setRecipient] = useState("");
  const debouncedRecepient = useDebounce(recipient, 800);
  const [inputState, setInputState] = useState<InputState>({
    status: "idle",
    inputValue: ""
  });
  const [isTouched, setIsTouched] = useState(false);
  const onRecipientChange = (e: CustomEvent) => {
    setRecipient(e.detail.value || "");
  }

  useEffect(() => {
    if (!debouncedRecepient.trim()) {
      setInputState({ status: "idle", inputValue: "" });
      return;
    }
    const classification = identifyBitcoinInput(
      debouncedRecepient,
      !selectedSource.pubSource ?
        { disallowed: [InputClassification.BITCOIN_ADDRESS, InputClassification.NOFFER] }
        :
        undefined
    );

    if (classification === InputClassification.UNKNOWN) {
      setInputState({ status: "error", inputValue: debouncedRecepient, classification, error: "Unidentified recipient" });
      return;
    }
    setInputState({
      status: "loading",
      inputValue: debouncedRecepient,
      classification
    });

    parseBitcoinInput(debouncedRecepient, classification, selectedSource.keys)
      .then(parsed => {
        if (parsed.type === InputClassification.LNURL_WITHDRAW) {
          setInputState({
            error: "Lnurl cannot be a lnurl-withdraw",
            status: "error",
            inputValue: debouncedRecepient,
            classification: parsed.type
          });
          return;
        }

        if (parsed.type === InputClassification.LN_INVOICE && !parsed.amount) {
          setInputState({
            error: "Zero value invoices not supported",
            status: "error",
            inputValue: debouncedRecepient,
            classification: parsed.type
          });
          return;
        }

        if (parsed.type === InputClassification.LN_INVOICE) {
          setAmountInSats(parsed.amount!);
        }
        setInputState({
          status: "parsedOk",
          inputValue: debouncedRecepient,
          parsedData: parsed
        });
      })
      .catch((err: any) => {
        setInputState({
          status: "error",
          inputValue: debouncedRecepient,
          error: err.message,
          classification
        });
      })
  }, [debouncedRecepient, selectedSource]);

  // Scanner for getting recipient
  const [presentScanner, dismissScanner] = useIonModal(
    <ScanModal
      onError={(error) => {
        dismissScanner();
        showToast({
          message: error,
          color: "danger",
        })
      }}
      dismiss={() => dismissScanner()}
      onScanned={(input) => {
        setRecipient(input);
        dismissScanner();
      }}
      instructions="Scan a QR code to send a payment some very long text"
      isMobile={isMobile}
    />
  );

  const openScanModal = () => {
    presentScanner({
      onWillDismiss: (event: CustomEvent<OverlayEventDetail>) => {
        if (event.detail.role === "confirm") {
          console.log({ dataFromScan: event.detail.data })
        }
      },
      cssClass: !isMobile ? "desktop-scanner-modal" : undefined
    });
  }




  // Amount input states
  const [amountInSats, setAmountInSats] = useState<Satoshi | null>(null);
  const [unit, setUnit] = useState<"BTC" | "sats">("sats");
  const [displayValue, setDisplayValue] = useState("");
  const [note, setNote] = useState("");



  const handlePayment = async () => {
    if (inputState.status !== "parsedOk") {

      return;
    }
    if (amountInSats === null) {

      return;
    }
    if (amountInSats > parseUserInputToSats(selectedSource.maxWithdrawable || "0", "sats")) {
      return;
    }

    try {
      await dispatch(sendPaymentThunk({
        sourceId: selectedSource.id,
        parsedInput: inputState.parsedData,
        amount: amountInSats,
        note,
        satsPerVByte: /* feeTiers[selectedFeeTier].rate */ 4,
        showToast
      }));
      history.push("/home");
    } catch (err: any) {
      alert(err?.message)
      showToast({ message: err?.message || "Payment failed", color: "danger" });
    }

  };





  return (
    <IonPage className="ion-page-width">
      <BackHeader />
      <IonContent className="ion-padding">
        <IonGrid>
          <IonRow>
            <IonCol size="12">
              <IonInput
                label="Recipient"
                labelPlacement="stacked"
                fill="solid"
                className={`
                custom-1
                ${inputState.status === "error" && 'ion-invalid'} 
                ${isTouched && 'ion-touched'}
              `}
                color="primary"
                onIonBlur={() => setIsTouched(true)}
                placeholder={
                  isPubSource ? "Paste invoice, Noffer string LNURL, Bitcoin address, or Lightning address" : "Paste invoice, LNURL, or Lightning address"
                }
                errorText={inputState.status === "error" ? inputState.error : undefined}
                value={recipient}
                onIonInput={onRecipientChange}

              >
                <IonButton fill="clear" slot="end" aria-label="scan" onClick={openScanModal}>
                  <IonIcon slot="icon-only" icon={qrCodeOutline} />
                </IonButton>
                <IonButton fill="clear" slot="end" aria-label="info" id="show-popover">
                  <IonIcon slot="icon-only" icon={informationCircle} />
                </IonButton>
              </IonInput>
            </IonCol>
          </IonRow>

          <IonRow>
            <IonCol size="12">
              <RecipentInputHelperText inputState={inputState} />
            </IonCol>
          </IonRow>


          {/* Different input types cards */}
          {
            inputState.status === "parsedOk" && inputState.parsedData.type === InputClassification.BITCOIN_ADDRESS && (
              <IonRow>
                <IonCol size="12">
                  <Suspense fallback={<IonSpinner />}>
                    <OnChainCard
                      amountInSats={amountInSats}
                      setAmountInSats={setAmountInSats}
                      displayValue={displayValue}
                      setDisplayValue={setDisplayValue}
                      unit={unit}
                      setUnit={setUnit}
                      selectedFeeTier={selectedFeeTier}
                      setSelectedFeeTier={setSelectedFeeTier}
                      feeTiers={feeTiers}
                      selectedSource={selectedSource}
                    />
                  </Suspense>
                </IonCol>
              </IonRow>
            )
          }
          {
            inputState.status === "parsedOk" && inputState.parsedData.type === InputClassification.LN_INVOICE && (
              <IonRow>
                <IonCol size="12">
                  <Suspense fallback={<IonSpinner />}>
                    <InvoiceCard invoiceData={inputState.parsedData} note={note} setNote={setNote} />
                  </Suspense>
                </IonCol>
              </IonRow>

            )
          }
          {
            (
              inputState.status === "parsedOk"
              &&
              (
                inputState.parsedData.type === InputClassification.LNURL_PAY ||
                inputState.parsedData.type === InputClassification.LN_ADDRESS
              )
              &&
              (
                <IonRow>
                  <IonCol size="12">
                    {
                      <Suspense fallback={<IonSpinner />}>
                        <LnurlCard
                          lnurlData={inputState.parsedData}
                          amountInSats={amountInSats}
                          setAmountInSats={setAmountInSats}
                          displayValue={displayValue}
                          setDisplayValue={setDisplayValue}
                          unit={unit}
                          setUnit={setUnit}
                          setNote={setNote}
                          note={note}
                          selectedSource={selectedSource}
                        />
                      </Suspense>
                    }
                  </IonCol>
                </IonRow>
              )
            )
          }

          {
            (
              inputState.status === "parsedOk"
              &&
              (
                inputState.parsedData.type === InputClassification.NOFFER
              )
              &&
              (
                <IonRow>
                  <IonCol size="12">
                    <Suspense fallback={<IonSpinner />}>
                      <NofferCard
                        nofferData={inputState.parsedData}
                        amountInSats={amountInSats}
                        setAmountInSats={setAmountInSats}
                        displayValue={displayValue}
                        setDisplayValue={setDisplayValue}
                        unit={unit}
                        setUnit={setUnit}
                        setNote={setNote}
                        note={note}
                        selectedSource={selectedSource}
                      />
                    </Suspense>
                  </IonCol>
                </IonRow>
              )
            )
          }
          <IonRow className="ion-margin-top">
            <IonCol size="6">
              <IonText style={{ display: "block", marginBottom: "9px" }}>Spend From</IonText>
              <CustomSelect<SpendFrom>
                items={enabledSpendSources}
                selectedItem={selectedSource}
                onSelect={setSelectedSource}
                getIndex={(source) => source.id}
                title="Select Spend Source"
                subTitle="Select the source you want to spend from"
                renderItem={(source) => {
                  return (
                    <>
                      <IonAvatar slot="start">
                        <img src={`https://robohash.org/${selectedSource.label}.png?bgset=bg1`} alt='Avatar' />
                      </IonAvatar>
                      <IonLabel style={{ width: "100%" }}>
                        <h2>{source.label}</h2>
                        <IonNote color="medium" className="ion-text-no-wrap" style={{ display: "block" }}>
                          {source.pubSource
                            ? "Lightning.Pub Source"
                            : "LNURL Withdraw Source"}
                        </IonNote>
                      </IonLabel>
                      <IonText slot="end" color="primary">
                        {+(source.balance).toLocaleString()} sats
                      </IonText>
                    </>
                  )
                }}
                renderSelected={(source) => (
                  <IonText>
                    {source?.label || ''}
                    <IonNote color="medium" style={{ display: 'block' }}>
                      {(+source?.balance).toLocaleString()} sats
                    </IonNote>
                  </IonText>
                )}
              >
              </CustomSelect>

            </IonCol>
          </IonRow>
          <IonRow className="ion-align-items-center ion-margin-top">
            <IonCol size="auto" >
              <IonText style={{ fontSize: "0.8rem" }} color="primary">
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                  Note: {(+selectedSource.balance - +(selectedSource.maxWithdrawable || "0")).toLocaleString()} sats of your balance is held in reserve for network fees.
                  <IonButton
                    fill="clear"
                    shape="round"
                    id="reserve-info"
                  >
                    <IonIcon icon={helpCircleOutline} slot="icon-only" />
                  </IonButton>
                </span>
              </IonText>
            </IonCol>
            <IonPopover mode="ios" alignment="center" trigger="reserve-info" triggerAction="click" reference="trigger">
              <IonContent className="ion-padding">
                <IonText>What is this?</IonText>
                <IonText>
                  Lightning fees are based on the amount of sats you are
                  sending, and so you must have more sats than you send.
                  To ensure high success rates and low overall fees, the node
                  has defined a fee budget to hold as a fee reserve for sends.
                </IonText>
              </IonContent>
            </IonPopover>


          </IonRow>
        </IonGrid>

        <IonPopover reference="trigger" side="start" alignment="end" size="auto" trigger="show-popover" triggerAction="click">
          <IonContent color="secondary">
            <IonList inset className="secondary">
              <IonListHeader>
                <IonLabel>What Can You Enter?</IonLabel>
              </IonListHeader>
              <IonItem>
                <IonIcon style={{ color: "orange" }} icon={flash} slot="start"></IonIcon>
                <IonLabel>
                  <strong>Lightning Invoice</strong>
                  <IonNote>lnbc20m1pvjluezpp5qqqsyq...</IonNote>
                </IonLabel>
              </IonItem>
              <IonItem>
                <IonIcon style={{ color: "orange" }} icon={globeOutline} slot="start"></IonIcon>
                <IonLabel>
                  <strong>LNURL</strong>
                  <IonNote>LNURL1dp68gurn8ghj7em9w...</IonNote>
                </IonLabel>
              </IonItem>
              <IonItem>
                <IonIcon style={{ color: "orange" }} icon={atCircleOutline} slot="start"></IonIcon>
                <IonLabel>
                  <strong>Lightning Address</strong>
                  <IonNote>someone@somesite.com</IonNote>
                </IonLabel>
              </IonItem>
              {
                isPubSource && (
                  <>
                    <IonItem>
                      <IonIcon style={{ color: "orange" }} icon={logoBitcoin} slot="start"></IonIcon>
                      <IonLabel>
                        <strong>Bitcoin address</strong>
                        <IonNote>bc1qar0srrr7xfkvy5l643...</IonNote>
                      </IonLabel>
                    </IonItem>
                    <IonItem>
                      <IonIcon style={{ color: "orange" }} icon="nostr" slot="start"></IonIcon>
                      <IonLabel>
                        <strong>Noffer string</strong>
                        <IonNote>noffer1qvqsyqjqvgunwc3j...</IonNote>
                      </IonLabel>
                    </IonItem>
                  </>
                )
              }
            </IonList>
          </IonContent>

        </IonPopover>
      </IonContent>
      <IonFooter>
        <IonToolbar>
          <IonButton expand="block" disabled={inputState.status !== "parsedOk" || amountInSats === null || amountInSats === 0} onClick={handlePayment}>
            Pay
          </IonButton>
        </IonToolbar>
      </IonFooter>
    </IonPage >
  )
}

// Helper component to show helper text about parsed recipient
const RecipentInputHelperText = ({ inputState }: { inputState: InputState }) => {
  switch (inputState.status) {
    case "idle":
      return <div></div>;
    case "loading": {
      const { icon, color } = getIconFromClassification(inputState.classification);
      return (
        <IonText color="primary">
          <p style={{ fontSize: "14px", marginTop: "4px", display: "flex", alignItems: "center" }}>
            <IonIcon icon={icon} color={color} style={{ marginRight: "8px" }} />
            {inputState.classification === InputClassification.LNURL_PAY || inputState.classification === InputClassification.LN_ADDRESS
              ? `${inputState.classification} detected. Fetching info.`
              : `${inputState.classification} detected. Parsing...`}
          </p>
        </IonText>
      );
    }
    case "parsedOk": {
      return (
        <IonText color="primary">
          <p style={{ fontSize: "14px", marginTop: "4px", display: "flex", alignItems: "center" }}>
            {inputState.parsedData.type}
            <IonIcon icon={checkmarkCircle} color="success" style={{ marginLeft: 8 }} />
          </p>

        </IonText>
      );
    }
  }
}

export default Send;