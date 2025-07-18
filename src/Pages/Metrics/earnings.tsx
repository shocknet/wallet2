import { useEffect, useState } from "react"
import Dropdown, { Period, periodOptionsArray, getPeriodText } from "../../Components/Dropdowns/LVDropdown"
import { AdminGuard, AdminSource } from "../../Components/AdminGuard"
import { getNostrClient } from "../../Api"
import { toast } from "react-toastify";
import * as Icons from "../../Assets/SvgIconLibrary";
import styles from "./styles/index.module.scss";
import classNames from 'classnames';
import * as Types from '../../Api/pub/autogenerated/ts/types';
import { IonButton, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonContent, IonLabel, IonItem, IonList, IonListHeader, IonIcon, IonItemDivider, IonPage, IonProgressBar, IonSkeletonText } from "@ionic/react";
import { flashOutline, linkOutline, personOutline, radioOutline } from "ionicons/icons";
import PeriodSelector from "@/Components/Dropdowns/PeriodDropdown/PeriodSelector";

export default function Earnings() {
    const [period, setPeriod] = useState<Period>(Period.WEEK)
    const [offset, setOffset] = useState<number>(0)
    const [adminSource, setAdminSource] = useState<AdminSource | null>(null)
    const [metrics, setMetrics] = useState<Types.AppsMetrics>()
    const [showingOps, setShowingOps] = useState("")
    const [loading, setLoading] = useState(true)
    useEffect(() => {
        const params = new URLSearchParams(window.location.search)
        const period = params.get("period")
        const offset = params.get("offset")
        if (period) {
            setPeriod(period as Period)
        }
        if (offset) {
            setOffset(parseInt(offset))
        }
    }, [])
    useEffect(() => {
        fetchMetrics()
    }, [period, offset, adminSource])
    const nextOffset = () => {
        if (period === Period.ALL_TIME || offset >= 0) {
            return
        }
        setOffset(offset + 1)
    }

    const prevOffset = () => {
        if (period === Period.ALL_TIME) {
            return
        }
        setOffset(offset - 1)
    }
    const fetchMetrics = async () => {
        if (!adminSource) {
            return
        }
        setLoading(true)
        const client = await getNostrClient(adminSource.nprofile, adminSource.keys)
        const periodRange = getUnixTimeRange(period, offset);
        const metrics = await client.GetAppsMetrics({ ...periodRange, include_operations: true })
        setLoading(false)
        if (metrics.status !== 'OK') {
            toast.error(metrics.reason)
        } else {
            console.log({ metrics })
            setMetrics(metrics)
        }
    }
    if (!adminSource) {
        return <AdminGuard updateSource={s => { console.log({ adminSource }); setAdminSource(s) }} />
    }

    if (!metrics) {
        return <IonPage className="ion-page-width">
            <IonContent>
                <IonProgressBar type="indeterminate" />
            </IonContent>
        </IonPage>
    }

    return <IonPage className="ion-page-width">
        <IonContent>
            <PeriodSelector period={period} offset={offset} setPeriod={setPeriod} resetOffset={() => setOffset(0)} prevOffset={prevOffset} nextOffset={nextOffset} />
            {metrics?.apps.map((app, i) => <IonCard key={i} style={{ width: '100%', marginTop: 10 }} color="secondary" >
                <IonCardHeader>
                    <IonCardTitle>{app.app.name}</IonCardTitle>
                </IonCardHeader>
                {loading && <IonCardContent>
                    <IonSkeletonText animated style={{ width: '70%' }} />
                    <IonSkeletonText animated style={{ width: '30%' }} />
                </IonCardContent>}
                {!loading && app.operations.length > 0 && <IonCardContent>
                    <div>Moved {app.received + app.spent} sats in {app.operations.length} operations</div>
                    <div>Earned {app.fees} sats</div>
                    {showingOps !== app.app.name && <IonButton onClick={() => setShowingOps(app.app.name)}>Show operations</IonButton>}
                    {showingOps === app.app.name && <IonButton onClick={() => setShowingOps("")}>Hide operations</IonButton>}
                    {showingOps === app.app.name && <IonList>
                        <IonListHeader>
                            <IonLabel>Op type</IonLabel>
                            <IonLabel>Amount</IonLabel>
                            <IonLabel>Service fee</IonLabel>
                        </IonListHeader>
                        {app.operations.map((op, i) => <IonItem key={i}>
                            <IonLabel><IonIcon icon={iconType(op.type)} style={{ color: iconColor(op.type) }} /></IonLabel>
                            <IonLabel>{op.amount}</IonLabel>
                            <IonLabel>{op.service_fee}</IonLabel>
                        </IonItem>)}
                    </IonList>}
                </IonCardContent>}
                {!loading && app.operations.length === 0 && <IonCardContent>
                    <div>No operations</div>
                </IonCardContent>}
            </IonCard>)}
        </IonContent>

    </IonPage>
}

export const getUnixTimeRange = (period: Period, offset: number) => {
    const now = new Date();
    let from_unix: number, to_unix: number;

    switch (period) {
        case Period.WEEK: {
            /*       const thisWeek = new Date(now.setDate(now.getDate() - now.getDay()))
                  thisWeek.setHours(0, 0, 0, 0)
                  console.log({ thisWeek: thisWeek.toISOString() })
                  const thisWeekMs = thisWeek.getTime() */

            const firstDayOfWeek = new Date(new Date().setDate(now.getDate() - now.getDay() + (offset * 7))).setHours(0, 0, 0, 0);
            const lastDayOfWeek = new Date(new Date().setDate(now.getDate() - now.getDay() + 6 + (offset * 7))).setHours(23, 59, 59, 999);
            from_unix = Math.floor(firstDayOfWeek / 1000);
            to_unix = Math.floor(lastDayOfWeek / 1000);
            break;
        }

        case Period.MONTH: {
            const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth() + offset, 1).getTime();
            const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1 + offset, 0).setHours(23, 59, 59, 999);
            from_unix = Math.floor(firstDayOfMonth / 1000);
            to_unix = Math.floor(lastDayOfMonth / 1000);
            break;
        }

        case Period.YEAR: {
            const firstDayOfYear = new Date(now.getFullYear() + offset, 0, 1).getTime();
            const lastDayOfYear = new Date(now.getFullYear() + offset, 11, 31).setHours(23, 59, 59, 999);
            from_unix = Math.floor(firstDayOfYear / 1000);
            to_unix = Math.floor(lastDayOfYear / 1000);
            break;
        }
        case Period.ALL_TIME:
            return undefined
    }
    console.log({ from_unix: new Date(from_unix * 1000).toISOString(), to_unix: new Date(to_unix * 1000).toISOString() })
    return { from_unix, to_unix };
}

const iconType = (t: Types.UserOperationType) => {
    switch (t) {
        case Types.UserOperationType.INCOMING_INVOICE:
        case Types.UserOperationType.OUTGOING_INVOICE:
            return flashOutline
        case Types.UserOperationType.INCOMING_USER_TO_USER:
        case Types.UserOperationType.OUTGOING_USER_TO_USER:
            return personOutline
        case Types.UserOperationType.INCOMING_TX:
        case Types.UserOperationType.OUTGOING_TX:
            return linkOutline
    }
}

const iconColor = (t: Types.UserOperationType) => {
    switch (t) {
        case Types.UserOperationType.INCOMING_INVOICE:
        case Types.UserOperationType.INCOMING_USER_TO_USER:
        case Types.UserOperationType.INCOMING_TX:
            return 'green'
        case Types.UserOperationType.OUTGOING_INVOICE:
        case Types.UserOperationType.OUTGOING_USER_TO_USER:
        case Types.UserOperationType.OUTGOING_TX:
            return 'red'
        default:
            return 'white'
    }
}