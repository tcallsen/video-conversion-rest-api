// TODO: add jsdoc comments for functions
export type PrepareSourceFileFunction = (key: string, localPath: string) => Promise<void>;
export type PlaceTargetFileFunction = (localPath: string, targetPath: string) => Promise<void>;
