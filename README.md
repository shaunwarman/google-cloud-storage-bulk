# google-cloud-storage-bulk

[![build status](https://img.shields.io/travis/shaunwarman/google-cloud-storage-batch.svg)](https://travis-ci.com/shaunwarman/google-cloud-storage-batch)
[![code coverage](https://img.shields.io/codecov/c/github/shaunwarman/google-cloud-storage-batch.svg)](https://codecov.io/gh/shaunwarman/google-cloud-storage-batch)
[![code style](https://img.shields.io/badge/code_style-XO-5ed9c7.svg)](https://github.com/sindresorhus/xo)
[![styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg)](https://github.com/prettier/prettier)
[![made with lass](https://img.shields.io/badge/made_with-lass-95CC28.svg)](https://lass.js.org)
[![license](https://img.shields.io/github/license/shaunwarman/google-cloud-storage-batch.svg)](LICENSE)
[![npm downloads](https://img.shields.io/npm/dt/google-cloud-storage-batch.svg)](https://npm.im/google-cloud-storage-batch)

> google cloud storage bulk upload


## Table of Contents

* [Install](#install)
* [Usage](#usage)
* [Options](#options)
* [Contributors](#contributors)
* [License](#license)


## Install

[npm][]:

```sh
npm install google-cloud-storage-bulk
```

[yarn][]:

```sh
yarn add google-cloud-storage-bulk
```


## Usage

```js
const GCS = require('google-cloud-storage-bulk');

const gcs = new GCS({
  projectId,
  bucketName: 'my-bucket',
  concurrency: 100,
  hashStrategy: 'file',
  retries: 3,
  subdirectory: 'application-name',
  uploadOptions = {}
});

// ... in async function
await gcs.uploadFiles(someDirectory);
```


## Options

* `projectId` - (`required`) - google cloud project id (see [project reference](https://cloud.google.com/storage/docs/projects) for more details)
* `bucketName` - (`required`) - cloud storage bucket name
* `concurrency` - (`optional` - default: `250`) - upload concurrency limits
* `retries` - (`optional` - default: `3`) - upload retry attempts
* `hashStrategy` - (`required` - options: `none`, `file`, `subdirectory`) - [described in detail below](#hashStrategy)
* `subdirectory` - (`optional`) - subdirectory within cloud storage bucket to push content into
* `uploadOptions` - (`optional`) - extends [`@google/cloud-storage` upload options](https://cloud.google.com/nodejs/docs/reference/storage/2.0.x/Bucket#upload)

#### `hashStrategy`

* `none` - No hashing to file structure, just push content as is. Google cloud does [handle metageneration](https://cloud.google.com/storage/docs/object-versioning#details) that you can take advantage of for versioning.
```
Before:
|_directory_to_upload
  |_a.js
  |_b.js
  |_c.css
  
After:
|_subdirectory
  |_a.js
  |_b.js
  |_c.css
```

* `file` - Hash per file currently using `sha1` algorithm.
```
Before:
|_directory_to_upload
  |_a.js
  |_b.js
  |_c.css
  
After:
|_subdirectory
  |_a.a9993e364706816aba3e25717850c26c9cd0d89d.js
  |_b.924f61661a3472da74307a35f2c8d22e07e84a4d.js
  |_c.bcb8c41b803b91661b5e6ee45362f47df368a731.css
  |_asset-manifest.json <-- references initial file to their new hash complement
```

* `subdirectory` - Hash content of the directory being uploaded and use this directory hash as the bucket subdirectory.
```
Before:
|_directory_to_upload
  |_a.js
  |_b.js
  |_c.css
  
After:
|_subdirectory
  |_924f61661a3472da74307a35f2c8d22e07e84a4d
    |_a.js
    |_b.js
    |_c.css
```


## Contributors

| Name             | Website                   |
| ---------------- | ------------------------- |
| **Shaun Warman** | <https://shaunwarman.com> |


## License

[MIT](LICENSE) © [Shaun Warman](https://shaunwarman.com)


## 

[npm]: https://www.npmjs.com/

[yarn]: https://yarnpkg.com/
