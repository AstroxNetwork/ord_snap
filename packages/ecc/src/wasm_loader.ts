import fs from 'brfs';
import { path } from './wasm_path';
import * as rand from './rand';
import * as validate_error from './validate_error';
const binary = fs.readFileSync(path('./secp256k1.wasm'));
const imports = {
  './rand.js': rand,
  './validate_error.js': validate_error,
};
const mod = new WebAssembly.Module(binary);
const instance = new WebAssembly.Instance(mod, imports);
export default instance.exports;
