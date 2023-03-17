import SnapsWebpackPlugin from '@metamask/snaps-webpack-plugin';

const options = {
  /**
   * Whether to strip all comments from the bundle.
   */
  stripComments: true,

  /**
   * Whether to evaluate the bundle with SES, to ensure SES compatibility.
   */
  eval: true,

  /**
   * The path to the Snap manifest file. If set, it will be checked and automatically updated with
   * the bundle's hash, if `writeManifest` is enabled. Defaults to `snap/manifest.json` in the
   * current working directory.
   */
  manifestPath: './snap.manifest.json',

  /**
   * Whether to write the updated Snap manifest file to disk. If `manifestPath` is not set, this
   * option has no effect. If this is disabled, an error will be thrown if the manifest file is
   * invalid.
   */
  writeManifest: true,
};

export default {
  plugins: [new SnapsWebpackPlugin(options)],
};
