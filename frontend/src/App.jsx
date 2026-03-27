import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import AuthPage from "./pages/AuthPage";
import ChatPage from "./pages/ChatPage";
import Sidebar from "./components/Sidebar";

function AppLayout() {
  const { user, loading } = useAuth();
  const [currentChatId, setCurrentChatId] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (loading) {
    return (
      <div style={{ 
        height: "100vh", 
        background: "#ffffff", 
        display: "flex",
        alignItems: "center", 
        justifyContent: "center" 
      }}>
        <div style={{ 
          width: 40, 
          height: 40, 
          border: "3px solid #e0e0e0",
          borderTop: "3px solid #000000", 
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite" 
        }} />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" />;

  return (
    <div style={{ 
      display: "flex", 
      height: "100vh", 
      overflow: "hidden",
      background: "#ffffff",
      position: "relative"
    }}>
      <div style={{ 
        position: isMobile ? "fixed" : "relative",
        left: isMobile && !isSidebarOpen ? "-300px" : "0",
        transition: "left 0.3s ease",
        zIndex: 100
      }}>
        <Sidebar 
          key={refreshKey}
          currentChatId={currentChatId}
          onSelectChat={setCurrentChatId}
          onNewChat={() => setCurrentChatId(null)}
          onDeleteChat={() => {
            setCurrentChatId(null);
            setRefreshKey(k => k + 1);
          }}
          isOpen={isSidebarOpen}
          onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        />
      </div>

      {isMobile && isSidebarOpen && (
        <div 
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.3)",
            zIndex: 90
          }}
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      
      <ChatPage 
        key={currentChatId || "new"}
        chatId={currentChatId}
        onChatCreated={(id) => {
          setCurrentChatId(id);
          setRefreshKey(k => k + 1);
        }}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
      />
      
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

function AuthLayout() {
  const { user } = useAuth();
  if (user) return <Navigate to="/" />;
  return <AuthPage />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<AppLayout />} />
          <Route path="/auth" element={<AuthLayout />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
