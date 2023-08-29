import { join, basename, parse } from 'path';
import { readdirSync, statSync, createReadStream } from 'fs';
import OSS from 'ali-oss';
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
  sourceDirectory: string
}

type MergeOptions = ConfigOptions & DefaultOptions

const defaultOptions: DefaultOptions = {
  minFileSize: 0,
  sourceDirectory: 'src/assets'
};

function uploadToOSS(config: ConfigOptions, filePath: string): Promise<OSS.PutObjectResult> {
  const client = new OSS({
    accessKeyId: config.accessKeyId,
    accessKeySecret: config.accessKeySecret,
    region: config.region,
    bucket: config.bucket,
    endpoint: config.endpoint,
  });

  return client.put(`${config.targetDirectory}/${basename(filePath)}`, createReadStream(filePath));
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
  api.chainWebpack((config) => {
    const isProduction = process.env.NODE_ENV === 'production';
    if (isProduction) {
      const { region, bucket, targetDirectory } = api.userConfig.oss;
      if (!region || !bucket) {
        api.logger.log('请配置有效的 OSS 参数\n');
        return;
      }
      if (!targetDirectory) {
        api.logger.log('请配置放置资源的桶目录\n');
        return;
      }
      config.module
        .rule('images')
        .test(/\.(png|jpe?g|gif|webp)$/)
        .use('url-loader')
        .loader('url-loader')
        .options({
          limit: false, // 限制图片大小，小于该大小的图片将被转为 base64
          fallback: {
            loader: 'file-loader',
            options: {
              name: '[name].[hash:8].[ext]', // 输出文件名格式
              publicPath:
                `https://${bucket}.${region}.aliyuncs.com/${targetDirectory}/`, // 替换为你的 OSS 存储桶 URL
            },
          },
        });
    }
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
      sourceDirectory,
      endpoint,
      targetDirectory,
    } = options;

    if (!accessKeyId || !accessKeySecret || !region || !bucket) {
      api.logger.log('请配置有效的 OSS 参数\n');
      return;
    }

    if (!targetDirectory) {
      api.logger.log('请配置放置资源的桶目录\n');
      return;
    }

    const assetsDir = join(api.cwd, sourceDirectory);
    const files = readdirSync(assetsDir);
    files.forEach(file => {
      const filePath = join(assetsDir, file);
      const { ext } = parse(file);
      // 获取文件大小
      const fileSize = statSync(filePath).size;
      if (typeof minFileSize === 'number' && minFileSize <= fileSize) {
        if (ext === '.jpg' || ext === '.png' || ext === '.gif' || ext === '.jpeg') {
          uploadToOSS({ accessKeyId, accessKeySecret, region, bucket, endpoint, targetDirectory }, filePath)
            .then(() => {
              api.logger.log(`图片 ${file} 上传至 OSS 成功`);
            })
            .catch((error) => {
              api.logger.log(`图片 ${file} 上传至 OSS 失败: ${error}`);
            });
        }
      }
    })
  });
};