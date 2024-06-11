import fs from "fs";
import path from "path";

export function noop() {}

export function deferred<T>() {
  let resolve: (value: T | PromiseLike<T>) => void = noop;
  let reject: (reason?: any) => void = noop;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return {
    promise,
    resolve,
    reject,
  };
}

export function createDirIfNotExists(dirname: string) {
  function mkdirsSync(dirname: string) {
    if (fs.existsSync(dirname)) {
      return true;
    } else {
      if (mkdirsSync(path.dirname(dirname))) {
        fs.mkdirSync(dirname);
        return true;
      }
    }
  }
  mkdirsSync(dirname);
  return dirname;
}

export function writeJsonFile(filepath: string, json: object) {
  fs.writeFileSync(filepath, JSON.stringify(json, null, 2));
}
