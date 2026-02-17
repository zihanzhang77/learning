
import React, { useState, Suspense, lazy } from 'react';
import { HashRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { UserProvider, useUser } from './src/context/UserContext';
import { AiProvider } from './src/context/AiContext';

// Lazy load pages for better initial load performance
const Dashboard = lazy(() => import('./src/pages/Dashboard'));
const Diary = lazy(() => import('./src/pages/Diary'));
const Stats = lazy(() => import('./src/pages/Stats'));
const Profile = lazy(() => import('./src/pages/Profile'));
const Login = lazy(() => import('./src/pages/Login'));

// Loading component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-dashboard">
    <div className="flex flex-col items-center gap-4">
      <div className="w-8 h-8 border-4 border-slate-200 border-t-primary rounded-full animate-spin"></div>
      <p className="text-slate-500 text-sm font-medium">加载中...</p>
    </div>
  </div>
);

// 私有路由组件，用于保护需要登录才能访问的页面
const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useUser();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>加载中...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// 主应用布局组件
const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col max-w-md mx-auto bg-white relative">
      <main className="flex-1 pb-24 overflow-y-auto bg-dashboard">
        {children}
      </main>

      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white/80 backdrop-blur-2xl border-t border-slate-100/60 pb-8 pt-3 px-10 flex justify-between items-center z-50">
        <NavItem to="/" icon="home" label="今日" />
        <NavItem to="/diary" icon="book" label="日记" />
        <NavItem to="/stats" icon="smart_toy" label="大模型" />
        <NavItem to="/profile" icon="person" label="我的" />
      </nav>
    </div>
  );
};

// 主应用组件
const AppContent: React.FC = () => {
  return (
    <HashRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route 
            path="/" 
            element={
              <PrivateRoute>
                <AppLayout>
                  <Dashboard />
                </AppLayout>
              </PrivateRoute>
            }
          />
          <Route 
            path="/diary" 
            element={
              <PrivateRoute>
                <AppLayout>
                  <Diary />
                </AppLayout>
              </PrivateRoute>
            }
          />
          <Route 
            path="/stats" 
            element={
              <PrivateRoute>
                <AppLayout>
                  <Stats />
                </AppLayout>
              </PrivateRoute>
            }
          />
          <Route 
            path="/profile" 
            element={
              <PrivateRoute>
                <AppLayout>
                  <Profile />
                </AppLayout>
              </PrivateRoute>
            }
          />
        </Routes>
      </Suspense>
    </HashRouter>
  );
};

const App: React.FC = () => {
  return (
    <UserProvider>
      <AiProvider>
        <AppContent />
      </AiProvider>
    </UserProvider>
  );
};

interface NavItemProps {
  to: string;
  icon: string;
  label: string;
}

const NavItem: React.FC<NavItemProps> = ({ to, icon, label }) => {
  return (
    <NavLink 
      to={to} 
      className={({ isActive }) => 
        `flex flex-col items-center gap-1 transition-colors ${isActive ? 'text-slate-900' : 'text-slate-300'}`
      }
    >
      {({ isActive }) => (
        <>
          <span className={`material-symbols-outlined text-[26px] ${isActive ? 'fill-1' : ''}`}>
            {icon}
          </span>
          <span className={`text-[10px] font-bold`}>{label}</span>
        </>
      )}
    </NavLink>
  );
};

export default App;
