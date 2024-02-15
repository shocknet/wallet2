export type MigrationFunction<T> = (state: any) => T;






const applyMigrations = <T>(state: any, stateVersion: number, migrations: Record<number, MigrationFunction<T>>): T => {
  const latestVersion = Math.max(...Object.keys(migrations).map(Number));
  let migratedState: T = state;

  for (let version = stateVersion + 1; version <= latestVersion; version++) {
    if (migrations[version]) {
      migratedState = migrations[version](state);
    }
  }

  return migratedState
};

export default applyMigrations;