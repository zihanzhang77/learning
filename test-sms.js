import axios from 'axios';

async function testSendCode() {
  try {
    const response = await axios.post('http://localhost:3001/api/auth/send-code', {
      phone_number: '18969789887'
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('响应:', response.data);
    console.log('验证码发送请求成功');
  } catch (error) {
    console.error('错误:', error.response ? error.response.data : error.message);
  }
}

testSendCode();