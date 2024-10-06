import styles from "./styles/index.module.scss";
export default function Spinner() {
    return <div className={styles.ldsRing}><div></div><div></div><div></div><div></div></div>;
}