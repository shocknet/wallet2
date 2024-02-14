import { OLD_NOSTR_PUB_DESTINATION } from "../../constants";
import { decodeNprofile, encodeNprofile } from "../../custom-nip19";
import { PayTo } from "../../globalTypes";

type MigrationFunction<T> = (state: T) => T;




// payTo migrations
export const PAYTO_VERSION = 1;
export const PayToMigrations: Record<number, MigrationFunction<PayTo[]>> = {
  // the bridge url encoded in nprofile migration
  1: (state: PayTo[]) => {
		console.log("running migration")
    const newState = state.map(source => {
      if (source.pasteField.startsWith("nprofile") && source.label === "Bootstrap Node") {
        const decoded = decodeNprofile(source.pasteField);
        if (!decoded.bridge || decoded.bridge.length === 0) {
          const newNprofile = encodeNprofile({
            pubkey: decoded.pubkey,
            relays: decoded.relays,
            bridge: decoded.pubkey === OLD_NOSTR_PUB_DESTINATION ? ["https://zap.page"] : ["https://shockwallet.app"]
          })
          return {
            ...source,
            pasteField: newNprofile
          }
        } else {
          return source;
        }
      } else {
        return source;
      }
    })
    return newState;
  },

};

const applyMigrations = <T>(state: T, stateVersion: number, migrations: Record<number, MigrationFunction<T>>): T => {
  const latestVersion = Math.max(...Object.keys(migrations).map(Number));
  let migratedState = state;

  for (let version = stateVersion + 1; version <= latestVersion; version++) {
    if (migrations[version]) {
      migratedState = migrations[version](state);
    }
  }

  return migratedState
};

export default applyMigrations;