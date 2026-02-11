import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../services/api';
import { useUser } from '../context/UserContext';

const Login: React.FC = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [isNewUser, setIsNewUser] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useUser();

  // 检查手机号是否已注册
  useEffect(() => {
    const checkUserExists = async () => {
      if (phoneNumber && /^1[3-9]\d{9}$/.test(phoneNumber)) {
        try {
          // 这里可以添加检查用户是否存在的API调用
          // 暂时注释掉，因为后端可能还没有这个接口
          // const exists = await authApi.checkUserExists(phoneNumber);
          // setIsNewUser(!exists);
        } catch (err) {
          console.error('检查用户是否存在失败:', err);
        }
      }
    };

    // 防抖处理
    const timer = setTimeout(() => {
      checkUserExists();
    }, 500);

    return () => clearTimeout(timer);
  }, [phoneNumber]);

  const handleLogin = async () => {
    if (!phoneNumber) {
      setError('请输入手机号');
      return;
    }

    if (!/^1[3-9]\d{9}$/.test(phoneNumber)) {
      setError('请输入正确的手机号');
      return;
    }

    if (!password) {
      setError('请输入密码');
      return;
    }

    if (isNewUser || isForgotPassword) {
      if (isNewUser && !name) {
        setError('请输入姓名');
        return;
      }
      if (!confirmPassword) {
        setError('请确认密码');
        return;
      }
      if (password !== confirmPassword) {
        setError('两次输入的密码不一致');
        return;
      }
    }

    setError('');
    setLoading(true);

    try {
      let response;
      if (isNewUser) {
        // 新用户注册
        response = await authApi.register(phoneNumber, password, name);
        login(response.user);
        navigate('/');
      } else if (isForgotPassword) {
        // 忘记密码
        response = await authApi.resetPassword(phoneNumber, password);
        if (response.status === 'ok') {
            alert('密码重置成功，请使用新密码登录');
            setIsForgotPassword(false);
            setPassword('');
            setConfirmPassword('');
        } else {
            setError(response.error || '密码重置失败');
        }
      } else {
        // 老用户登录
        response = await authApi.loginWithPassword(phoneNumber, password);
        login(response.user);
        navigate('/');
      }
    } catch (err: any) {
      setError(err.message || '操作失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white px-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">FocusFlow</h1>
          <p className="text-slate-400">专注学习，高效成长</p>
        </div>

        <div className="space-y-6">
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-1">
              手机号
            </label>
            <div className="relative">
              <input
                type="tel"
                id="phone"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="请输入手机号"
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
              {isForgotPassword ? '新密码' : '密码'}
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isForgotPassword ? '请输入新密码' : '请输入密码'}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent"
            />
          </div>

          {(isNewUser || isForgotPassword) && (
            <>
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 mb-1">
                  确认密码
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="请再次输入密码"
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent"
                />
              </div>

              {isNewUser && (
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">
                    姓名
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="请输入姓名"
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent"
                  />
                </div>
              )}
            </>
          )}

          {error && (
            <div className="bg-red-50 text-red-500 px-4 py-2 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handleLogin}
            disabled={loading}
            className={`w-full px-4 py-3 bg-slate-900 text-white rounded-lg font-medium transition-colors ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-800'}`}
          >
            {loading ? '处理中...' : (isForgotPassword ? '重置密码' : (isNewUser ? '注册' : '登录'))}
          </button>

          <div className="text-center flex flex-col gap-2">
            {!isForgotPassword && (
              <button
                onClick={() => {
                  setIsNewUser(!isNewUser);
                  setIsForgotPassword(false);
                  setError('');
                }}
                className="text-secondary text-sm font-medium"
              >
                {isNewUser ? '已有账号？点击这里登录' : '新用户？点击这里注册'}
              </button>
            )}
            
            {!isNewUser && (
              <button
                onClick={() => {
                  setIsForgotPassword(!isForgotPassword);
                  setIsNewUser(false);
                  setError('');
                  setPassword('');
                  setConfirmPassword('');
                }}
                className="text-slate-400 text-sm font-medium hover:text-slate-600"
              >
                {isForgotPassword ? '返回登录' : '忘记密码？'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;