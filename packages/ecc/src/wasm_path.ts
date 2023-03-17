import { URL, fileURLToPath } from 'url';
export function path(wasmFilename) {
  const url = new URL(wasmFilename);
  return fileURLToPath(url);
}
