const fs = require('fs');
const path = require('path');
const util = require('util');
const digestFile = require('file-digest');
const digestDirectory = require('digest-directory');
const readdir = require('recursive-readdir');
const promiseAll = require('promise-all-retry');
const { Storage } = require('@google-cloud/storage');

const fsWriteFile = util.promisify(fs.writeFile);

const MANIFEST_FILE = 'asset-manifest.json';

class GCS {
  constructor(options) {
    const {
      projectId,
      bucketName,
      concurrency = 250,
      hashStrategy = 'none',
      retries = 3,
      subdirectory = '',
      uploadOptions = {}
    } = options;
    // Static asset references and their associated hash
    this.assets = {};
    // Concurrency limit during upload
    this.concurrency = concurrency;
    // Cloud storage bucket name
    this.bucketName = bucketName;
    // Files to be uploaded
    this.files = null;
    // Object versioning strategy - 'none', 'file', 'subdirectory'
    this.hashStrategy = hashStrategy;
    // Metadata around files to be uploaded
    this.metadata = null;
    // Parent directory of uploaded assets
    this.parentDirectory = null;
    // Upload retries per file
    this.retries = retries;
    // Cloud storage sdk
    this.storage = new Storage({ projectId });
    // Subdirectory within cloud storage bucket to write to
    this.subdirectory = subdirectory;
    // Cloud storage upload options per object
    this.uploadOptions = uploadOptions;
  }

  /**
   * Upload file to specified google cloud storage bucket
   * @param {Object} options the upload options
   * @return {AsyncFunction} cloud storage bucket upload
   */
  upload(options) {
    return async () => {
      await this.storage.bucket(this.bucketName).upload(options.source, {
        destination: options.destination,
        ...this.uploadOptions
      });
    };
  }

  /**
   * Upload files and directories within a specified folder
   * @param {String} source directory
   */
  async uploadFiles(source) {
    this.parentDirectory = source;
    try {
      // Get files within directory and maintain path
      this.files = await readdir(source);

      // Format source -> destination
      const formatFiles = this.files.map(this.format.bind(this));
      const formattedFiles = await Promise.all(formatFiles);

      if (this.hashStrategy === 'file') {
        const assetManifest = await this.createAssetManifest();
        formattedFiles.push(assetManifest);
      }

      if (this.hashStrategy === 'subdirectory') {
        const hashedDirectory = await digestDirectory(source);
        this.subdirectory = `${this.subdirectory}/${hashedDirectory}`;
      }

      // Create upload list from source and destination of files
      const uploadList = formattedFiles.map(this.upload.bind(this));
      
      // Upload all files
      await promiseAll(uploadList, { 
        concurrency: this.concurrency, 
        retries: this.retries 
      });
    } catch (err) {
      console.error('error uploading files', err);
      throw err;
    }
    return this.assets;
  }

  /**
   * Hash the specified file based on sha1 algorithm
   * @param {String} filepath the file to hash
   * @return {String} a hex string of the hashed file
   */
  async hash(filepath) {
    const hash = await digestFile(filepath, 'sha1');
    return hash;
  }

  /**
   * Format the source path with given inputs
   * @param {String} source path of file
   * @return {Object} the source and formatted destination path
   */
  async format(source) {
    const base = path.basename(this.parentDirectory) + '/';
    const index = source.lastIndexOf(base);
    const substr = source.substring(index + base.length);

    let hashFileName = substr;
    if (this.hashStrategy === 'file') {
      const hash = await this.hash(source);
      if (substr.includes('.')) {
        const [filename, ext] = substr.split('.');
        hashFileName = `${filename}.${hash}.${ext}`;
      }
    }

    const destination = `${this.subdirectory}/${hashFileName}`;
    this.assets[substr] = destination;

    return { source, destination };
  }

  /**
   * Create asset manifest file
   * @return {Object} asset manifest source / destination
   */
  async createAssetManifest() {
    const assetContent = JSON.stringify(this.assets);

    await fsWriteFile(MANIFEST_FILE, assetContent);

    const assetPath = path.resolve(path.join(process.cwd(), MANIFEST_FILE));
    return {
      source: assetPath,
      destination: `${this.subdirectory}/${MANIFEST_FILE}`
    };
  }
}

module.exports = GCS;
