export type MigrationFunction<T> = (state: any) => T;



export const getStateAndVersion = (json: string): { state: any, version: number } => {
  const parsedData = JSON.parse(json);
  if (!("version" in parsedData)) {
    return { state: parsedData, version: 0 }
  } else {
    const stateKey = Object.keys(parsedData).find(k => k !== "version") as string;
    return { state: parsedData[stateKey], version: parsedData.version }
  }
}



export const applyMigrations = <T>(state: any, stateVersion: number, migrations: Record<number, MigrationFunction<T>>): T => {
  const latestVersion = Math.max(...Object.keys(migrations).map(Number));
  let migratedState: T = state;
  
  for (let version = stateVersion + 1; version <= latestVersion; version++) {
    if (migrations[version]) {
      migratedState = migrations[version](state);
    }
  }
  
  return migratedState
};

const loadInitialState = <T>(storageKey: string, defaultReturn: string, migrations: Record<number, MigrationFunction<T>>, update: (value: T) => void ) => {
  const storedData = localStorage.getItem(storageKey);
  if (!storedData) {
    return JSON.parse(defaultReturn);
  } else {
    const { state, version } = getStateAndVersion(storedData)
    let migrationResult: any = null;
    migrationResult = applyMigrations(state, version, migrations);
    update(migrationResult)
    return migrationResult
  }
}

export default loadInitialState;