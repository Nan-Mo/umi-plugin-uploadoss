import * as path from 'path';
import * as fs from 'fs';
import * as OSS from 'ali-oss';
import { IApi } from 'umi';

interface ConfigOptions {
  accessKeyId: string;
  accessKeySecret: string;
  region: string;
  bucket: string;
  endpoint?: string;
  targetDirectory: string;
}

interface DefaultOptions {
  deleteOrigin?: boolean;
  minFileSize?: number;
  sourceDirectoryList: string[]
}

type MergeOptions = ConfigOptions & DefaultOptions 

const defaultOptions: DefaultOptions = {
  deleteOrigin: false,
  minFileSize: 0,
  sourceDirectoryList: ['src/assets']
};

function uploadToOSS(config: ConfigOptions, filePath: string): Promise<OSS.PutObjectResult> {
  const client = new OSS({
    accessKeyId: config.accessKeyId,
    accessKeySecret: config.accessKeySecret,
    region: config.region,
    bucket: config.bucket,
    endpoint: config.endpoint,
  });

  return client.put(`${config.targetDirectory}/${path.basename(filePath)}`, fs.createReadStream(filePath));
}

function removeFile(filePath: string): void {
  fs.unlinkSync(filePath);
}

export default (api: IApi) => {
  api.describe({
    key: 'oss',
    config: {
      default: defaultOptions,
      schema(joi: any): any {
        return joi.object();
      },
    },
  });
  api.onBuildComplete(({ err }) => {
    if (err) {
      return;
    }
    const options: MergeOptions = {
      ...defaultOptions,
      ...api.userConfig.oss,
    };

    const { 
      accessKeyId, 
      accessKeySecret, 
      region, 
      bucket, 
      minFileSize = 0, 
      sourceDirectoryList, 
      deleteOrigin,  
      endpoint,
      targetDirectory,
    } = options;

    if (!accessKeyId || !accessKeySecret || !region || !bucket) {
      console.log('请配置有效的 OSS 参数');
      return;
    }

    sourceDirectoryList?.forEach((directory: string): void => {
      const assetsDir = path.join(api.cwd, directory);
      const files = fs.readdirSync(assetsDir);
      files.forEach(file => {
        const filePath = path.join(assetsDir, file);
        const { ext } = path.parse(file);
        // 获取文件大小
        const fileSize = fs.statSync(filePath).size;
        if (typeof minFileSize === 'number' && minFileSize <= fileSize) {
          if (ext !== '.js' && ext !== '.svg') {
            removeFile(filePath);
            uploadToOSS({ accessKeyId, accessKeySecret, region, bucket, endpoint, targetDirectory }, filePath)
              .then(() => {
                console.log(`图片 ${file} 上传至 OSS 成功`);
                if (deleteOrigin) {
                  removeFile(filePath);
                }
              })
              .catch((error) => {
                console.error(`图片 ${file} 上传至 OSS 失败: ${error}`);
              });
          }
        }
      })
    });
  });
};