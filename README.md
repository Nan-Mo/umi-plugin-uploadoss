# umi-plugin-uploadoss

[![NPM version](https://img.shields.io/npm/v/umi-plugin-uploadoss.svg?style=flat)](https://npmjs.org/package/umi-plugin-uploadoss)
[![NPM downloads](http://img.shields.io/npm/dm/umi-plugin-uploadoss.svg?style=flat)](https://npmjs.org/package/umi-plugin-uploadoss)

## Install

```bash
$ yarn add umi-plugin-uploadoss -D
```

## Config

在.umirc.ts 或 config/config.ts中配置插件，包括OSS的访问密钥、Bucket等信息

```js
oss: {
  accessKeyId: 'your-accessKeyId',
  accessKeySecret: 'your-accessKeySecret',
  bucket: 'your-bucket-name',
  region: 'your-region',
  endpoint: 'your-bucket-endpoint',
  targetDirectory: 'your-bucket-target-directory',
  sourceDirectoryList: ['src/assets'],
  deleteOrigin: true,
  minFileSize: 0,
}
```

## API

+ accessKeyId: 这是用于访问OSS的Access Key ID，是一种身份验证凭据，用于标识访问者的身份,
+ accessKeySecret: 这是与Access Key ID相对应的Access Key Secret，也是一种身份验证凭据，用于对请求进行签名以确保安全性,
+ bucket: 桶的名称,
+ region: 存储服务的地域或区域,
+ endpoint: 桶的终端节点，一般是桶的地址,
+ targetDirectory: 上传到的桶的目录,
+ sourceDirectoryList: 原始资源目录列表,
+ deleteOrigin: 可是要在构建后删除原始资源
+ minFileSize: 限制多少大小的资源无需上传,


## LICENSE

MIT
