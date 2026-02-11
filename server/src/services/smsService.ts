/**
 * 发送短信验证码
 * @param phoneNumber 手机号
 * @returns 验证码
 */
export const sendSmsVerifyCode = async (phoneNumber: string): Promise<string> => {
  try {
    console.log('开始发送短信验证码到:', phoneNumber);
    console.log('阿里云 AccessKey 配置:', {
      accessKeyId: process.env.ALIYUN_ACCESS_KEY_ID,
      accessKeySecret: process.env.ALIYUN_ACCESS_KEY_SECRET ? '已配置' : '未配置'
    });
    
    // 生成本地验证码用于验证
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    // 动态导入阿里云 SDK，避免初始化问题
    const {
      Config,
    } = await import('@alicloud/openapi-client');
    
    const {
      default: Dysmsapi,
      SendSmsRequest,
    } = await import('@alicloud/dysmsapi20170525');
    
    const {
      RuntimeOptions,
    } = await import('@alicloud/tea-util');
    
    // 配置阿里云客户端
    const config = new Config({
      accessKeyId: process.env.ALIYUN_ACCESS_KEY_ID,
      accessKeySecret: process.env.ALIYUN_ACCESS_KEY_SECRET,
    });
    config.endpoint = 'dysmsapi.aliyuncs.com';
    
    // 创建客户端
    const client = new Dysmsapi(config);
    
    // 构建请求
    const sendSmsRequest = new SendSmsRequest({
      phoneNumbers: phoneNumber,
      signName: '阿里云短信测试', // 使用平台赠送的签名
      templateCode: 'SMS_154950909', // 使用平台赠送的模板
      templateParam: JSON.stringify({ code }),
    });
    
    const runtime = new RuntimeOptions({});
    
    // 发送短信
    const resp = await client.sendSmsWithOptions(sendSmsRequest, runtime);
    console.log('短信发送响应:', resp.body);
    
    if (resp.body.code === 'OK') {
      console.log('短信发送成功，验证码:', code);
      return code;
    } else {
      throw new Error(`短信发送失败: ${resp.body.message}`);
    }
  } catch (error) {
    console.error('短信发送异常:', error);
    // 出错时生成并返回本地验证码（用于测试）
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    console.log('模拟短信发送成功，验证码:', code);
    return code;
  }
};
