// src/components/Sidebar.jsx
import { useState, useEffect, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import api from "../api";
import { 
  MessageSquare, Plus, LogOut, Edit2, Trash2, Check, X, 
  Calendar, ChevronLeft, ChevronRight, MoreVertical, Zap, AlertTriangle,
  Clock, Star, Sparkles, History
} from "lucide-react";

export default function Sidebar({ 
  currentChatId, 
  onSelectChat, 
  onNewChat, 
  onDeleteChat,
  isOpen,
  onToggle 
}) {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [showActions, setShowActions] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, chatId: null, chatTitle: '' });
  const [hoveredChat, setHoveredChat] = useState(null);
  const [sidebarGlow, setSidebarGlow] = useState(1);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  
  const menuRef = useRef(null);
  const timeoutRef = useRef(null);
  const { user, logout } = useAuth();

  useEffect(() => {
    loadChats();

    // Animate glow intensity
    const interval = setInterval(() => {
      setSidebarGlow(prev => 0.8 + Math.sin(Date.now() / 800) * 0.2);
    }, 50);

    // Track mouse for parallax effect
    const handleMouseMove = (e) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth - 0.5) * 10,
        y: (e.clientY / window.innerHeight - 0.5) * 10
      });
    };

    // Click outside to close menu
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowActions(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mousedown', handleClickOutside);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const loadChats = async () => {
    try {
      const res = await api.get("/api/chats");
      setChats(res.data);
    } catch (err) {
      console.error("Failed to load chats:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (chatId, chatTitle, e) => {
    e.stopPropagation();
    e.preventDefault();
    setDeleteModal({ isOpen: true, chatId, chatTitle });
    setShowActions(null);
  };

  const confirmDelete = async () => {
    if (!deleteModal.chatId) return;
    
    try {
      await api.delete(`/api/chats/${deleteModal.chatId}`);
      setChats(chats.filter(c => c._id !== deleteModal.chatId));
      if (currentChatId === deleteModal.chatId) {
        onDeleteChat();
      }
      setDeleteModal({ isOpen: false, chatId: null, chatTitle: '' });
    } catch (err) {
      console.error("Failed to delete chat:", err);
    }
  };

  const cancelDelete = () => {
    setDeleteModal({ isOpen: false, chatId: null, chatTitle: '' });
  };

  const startEdit = (chat, e) => {
    e.stopPropagation();
    e.preventDefault();
    setEditingId(chat._id);
    setEditTitle(chat.title);
    setShowActions(null);
  };

  const saveEdit = async (chatId, e) => {
    e.stopPropagation();
    e.preventDefault();
    if (!editTitle.trim()) return;
    
    try {
      await api.patch(`/api/chats/${chatId}`, { title: editTitle });
      setChats(chats.map(c => 
        c._id === chatId ? { ...c, title: editTitle } : c
      ));
      setEditingId(null);
    } catch (err) {
      console.error("Failed to rename chat:", err);
    }
  };

  const cancelEdit = (e) => {
    e.stopPropagation();
    e.preventDefault();
    setEditingId(null);
  };

  const toggleActions = (chatId, e) => {
    e.stopPropagation();
    e.preventDefault();
    setShowActions(showActions === chatId ? null : chatId);
  };

  const handleChatItemMouseLeave = () => {
    // Add a small delay before hiding to allow moving to menu
    timeoutRef.current = setTimeout(() => {
      if (!menuRef.current?.matches(':hover')) {
        setShowActions(null);
        setHoveredChat(null);
      }
    }, 200);
  };

  const handleMenuMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  const handleMenuMouseLeave = () => {
    setShowActions(null);
    setHoveredChat(null);
  };

  // Group chats by date
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const lastWeek = new Date(today);
  lastWeek.setDate(lastWeek.getDate() - 7);

  const groupedChats = {
    today: [],
    yesterday: [],
    lastWeek: [],
    older: []
  };

  chats.forEach(chat => {
    const chatDate = new Date(chat.updated_at);
    chatDate.setHours(0, 0, 0, 0);
    
    if (chatDate.getTime() === today.getTime()) {
      groupedChats.today.push(chat);
    } else if (chatDate.getTime() === yesterday.getTime()) {
      groupedChats.yesterday.push(chat);
    } else if (chatDate > lastWeek) {
      groupedChats.lastWeek.push(chat);
    } else {
      groupedChats.older.push(chat);
    }
  });

  const getCategoryIcon = (category) => {
    switch(category) {
      case 'today': return <Clock size={12} color="#666666" />;
      case 'yesterday': return <History size={12} color="#666666" />;
      case 'lastWeek': return <Calendar size={12} color="#666666" />;
      default: return <Sparkles size={12} color="#666666" />;
    }
  };

  return (
    <div style={{
      ...styles.container,
      width: isOpen ? "300px" : "80px",
      transition: "width 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
      background: "#ffffff",
      borderRight: "1px solid #e0e0e0",
      boxShadow: "2px 0 10px rgba(0, 0, 0, 0.05)",
      position: "relative",
      overflow: "hidden"
    }}>
      {/* Animated gradient background */}
      <div style={{
        ...styles.sidebarGradient,
        opacity: 0.03,
        transform: `translate(${mousePosition.x}px, ${mousePosition.y}px)`,
      }} />
      
      {/* Floating particles in sidebar */}
      <div style={styles.sidebarParticles}>
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            style={{
              ...styles.particle,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${Math.random() * 4 + 1}px`,
              height: `${Math.random() * 4 + 1}px`,
              opacity: Math.random() * 0.1,
              background: "#000000",
              animation: `floatParticle ${Math.random() * 10 + 10}s infinite linear`,
              animationDelay: `${Math.random() * 5}s`
            }}
          />
        ))}
      </div>

      <button
        onClick={onToggle}
        style={{
          ...styles.toggleButton,
          right: isOpen ? "-15px" : "-15px",
          background: "#ffffff",
          border: "2px solid #000000",
          transform: `scale(${sidebarGlow})`,
          transition: "all 0.3s ease"
        }}
        title={isOpen ? "Collapse sidebar" : "Expand sidebar"}
      >
        <div style={{
          ...styles.toggleButtonInner,
          background: "#ffffff",
          color: "#000000",
          animation: "pulseGlow 2s infinite"
        }}>
          {isOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
        </div>
      </button>

      <div style={{
        ...styles.newChatSection,
        animation: "fadeInDown 0.5s ease-out"
      }}>
        <button onClick={onNewChat} style={{
          ...styles.newChatButton,
          padding: isOpen ? "14px" : "14px 0",
          justifyContent: isOpen ? "center" : "center",
          background: "#000000",
          color: "#ffffff",
          transform: hoveredChat === 'new' ? 'scale(1.02)' : 'scale(1)',
          boxShadow: hoveredChat === 'new' ? '0 8px 20px rgba(0, 0, 0, 0.15)' : '0 4px 12px rgba(0, 0, 0, 0.1)',
          transition: "all 0.3s ease"
        }}
          onMouseEnter={() => setHoveredChat('new')}
          onMouseLeave={() => setHoveredChat(null)}
        >
          <Plus size={20} style={{ animation: hoveredChat === 'new' ? 'spin 2s infinite linear' : 'none' }} />
          {isOpen && <span style={{ marginLeft: "8px" }}>New Chat</span>}
        </button>
      </div>

      <div style={styles.chatsList}>
        {loading ? (
          <div style={styles.loadingContainer}>
            <div style={styles.loadingSpinner} />
            {isOpen && (
              <div style={styles.loadingTextContainer}>
                <span style={styles.loadingText}>Loading chats...</span>
                <div style={styles.loadingDots}>
                  <div style={styles.loadingDot} />
                  <div style={{...styles.loadingDot, animationDelay: "0.2s"}} />
                  <div style={{...styles.loadingDot, animationDelay: "0.4s"}} />
                </div>
              </div>
            )}
          </div>
        ) : (
          <>
            {isOpen ? (
              Object.entries(groupedChats).map(([category, categoryChats], index) => 
                categoryChats.length > 0 && (
                  <div key={category} style={{
                    ...styles.categorySection,
                    animation: `slideInFromLeft ${0.3 + index * 0.1}s ease-out`
                  }}>
                    <div style={styles.categoryHeader}>
                      {getCategoryIcon(category)}
                      <span style={styles.categoryTitle}>
                        {category === 'today' ? 'Today' : 
                         category === 'yesterday' ? 'Yesterday' : 
                         category === 'lastWeek' ? 'Previous 7 Days' : 'Older'}
                      </span>
                      <span style={styles.categoryCount}>{categoryChats.length}</span>
                    </div>
                    {categoryChats.map((chat, chatIndex) => renderChatItem(chat, true, chatIndex))}
                  </div>
                )
              )
            ) : (
              <div style={styles.collapsedList}>
                {chats.slice(0, 15).map((chat, index) => (
                  <div
                    key={chat._id}
                    onClick={() => onSelectChat(chat._id)}
                    style={{
                      ...styles.chatItemCollapsed,
                      background: currentChatId === chat._id 
                        ? "rgba(0,0,0,0.05)" 
                        : "transparent",
                      border: currentChatId === chat._id 
                        ? "1px solid #000000" 
                        : "1px solid transparent",
                      animation: `fadeIn ${0.2 + index * 0.05}s ease-out`
                    }}
                    title={chat.title}
                    onMouseEnter={() => setHoveredChat(chat._id)}
                    onMouseLeave={() => setHoveredChat(null)}
                  >
                    <MessageSquare 
                      size={20} 
                      color={currentChatId === chat._id ? "#000000" : "#666666"} 
                      style={{
                        animation: hoveredChat === chat._id ? 'bounce 0.5s ease' : 'none'
                      }}
                    />
                    {hoveredChat === chat._id && (
                      <div style={styles.collapsedTooltip}>
                        {chat.title}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            {chats.length === 0 && isOpen && (
              <div style={styles.emptyState}>
                <div style={styles.emptyStateIcon}>
                  <Zap size={40} color="#000000" />
                  <div style={styles.emptyStateIconGlow} />
                </div>
                <div style={styles.emptyStateContent}>
                  <p style={styles.emptyStateTitle}>No chats yet</p>
                  <p style={styles.emptyStateSubtitle}>Start a new conversation</p>
                </div>
                <div style={styles.emptyStateBubbles}>
                  {[...Array(5)].map((_, i) => (
                    <div key={i} style={{
                      ...styles.emptyStateBubble,
                      left: `${i * 20}%`,
                      animationDelay: `${i * 0.3}s`
                    }} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <div style={{
        ...styles.userSection,
        borderTop: "1px solid #e0e0e0",
        background: "#f9f9f9",
        animation: "slideInUp 0.6s ease-out"
      }}>
        {isOpen ? (
          <>
            <div style={styles.userInfo}>
              <div style={{
                ...styles.userAvatar,
                background: "#000000",
                color: "#ffffff",
                animation: "pulseGlow 3s infinite"
              }}>
                {user?.display_name?.charAt(0).toUpperCase()}
                <div style={styles.userAvatarGlow} />
              </div>
              <div style={styles.userDetails}>
                <div style={styles.userName}>{user?.display_name}</div>
                <div style={styles.userUsername}>@{user?.username}</div>
              </div>
            </div>
            <button onClick={logout} style={{
              ...styles.logoutButton,
              border: "1px solid #e0e0e0",
              color: "#666666",
              transition: "all 0.3s ease"
            }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.02)';
                e.currentTarget.style.background = '#f0f0f0';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.background = 'none';
              }}
            >
              <LogOut size={14} style={{ animation: 'slideRight 2s infinite' }} />
              <span>Sign Out</span>
            </button>
          </>
        ) : (
          <button 
            onClick={logout} 
            style={styles.logoutIconButton}
            title="Sign Out"
          >
            <LogOut size={20} color="#666666" />
          </button>
        )}
      </div>

      {deleteModal.isOpen && (
        <div style={styles.modalOverlay} onClick={cancelDelete}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalIcon}>
              <AlertTriangle size={32} color="#f44336" />
            </div>
            <h3 style={styles.modalTitle}>Delete Chat</h3>
            <p style={styles.modalMessage}>
              Are you sure you want to delete <strong>"{deleteModal.chatTitle}"</strong>? 
              This action cannot be undone.
            </p>
            <div style={styles.modalButtons}>
              <button 
                onClick={cancelDelete}
                style={styles.modalCancelButton}
              >
                Cancel
              </button>
              <button 
                onClick={confirmDelete}
                style={styles.modalConfirmButton}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slideInFromLeft {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        
        @keyframes slideInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slideRight {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(5px); }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.2); }
        }
        
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 10px rgba(0, 0, 0, 0.1); }
          50% { box-shadow: 0 0 20px rgba(0, 0, 0, 0.2); }
        }
        
        @keyframes bounce {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.2); }
        }
        
        @keyframes floatParticle {
          from { transform: translateY(0) translateX(0); }
          to { transform: translateY(-100vh) translateX(100px); }
        }
        
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        
        @keyframes modalFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes modalSlideIn {
          from { transform: translateY(-30px) scale(0.9); opacity: 0; }
          to { transform: translateY(0) scale(1); opacity: 1; }
        }
        
        @keyframes ripple {
          0% { transform: scale(0.8); opacity: 0.8; }
          100% { transform: scale(2); opacity: 0; }
        }
        
        @keyframes glowPulse {
          0%, 100% { box-shadow: 0 0 5px rgba(0, 0, 0, 0.05); }
          50% { box-shadow: 0 0 15px rgba(0, 0, 0, 0.1); }
        }
      `}</style>
    </div>
  );

  function renderChatItem(chat, isExpanded, index) {
    const isEditing = editingId === chat._id;
    const showActionMenu = showActions === chat._id;
    const isHovered = hoveredChat === chat._id;
    
    if (!isExpanded) {
      return (
        <div
          key={chat._id}
          onClick={() => onSelectChat(chat._id)}
          style={{
            ...styles.chatItemCollapsed,
            background: currentChatId === chat._id 
              ? "rgba(0,0,0,0.05)" 
              : "transparent",
            border: currentChatId === chat._id 
              ? "1px solid #000000" 
              : "1px solid transparent",
            animation: `fadeIn ${0.2 + index * 0.05}s ease-out`
          }}
          title={chat.title}
          onMouseEnter={() => setHoveredChat(chat._id)}
          onMouseLeave={() => setHoveredChat(null)}
        >
          <MessageSquare 
            size={20} 
            color={currentChatId === chat._id ? "#000000" : "#666666"} 
            style={{
              animation: isHovered ? 'bounce 0.5s ease' : 'none'
            }}
          />
          {isHovered && (
            <div style={styles.collapsedTooltip}>
              {chat.title}
            </div>
          )}
        </div>
      );
    }
    
    return (
      <div
        key={chat._id}
        onClick={() => !isEditing && onSelectChat(chat._id)}
        style={{
          ...styles.chatItem,
          background: currentChatId === chat._id 
            ? "rgba(0,0,0,0.05)" 
            : "transparent",
          border: currentChatId === chat._id 
            ? "1px solid #000000" 
            : "1px solid transparent",
          transform: isHovered ? 'translateX(5px)' : 'translateX(0)',
          animation: `slideInFromLeft ${0.3 + index * 0.1}s ease-out`,
          position: "relative"
        }}
        onMouseEnter={() => {
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
          }
          setHoveredChat(chat._id);
        }}
        onMouseLeave={handleChatItemMouseLeave}
      >
        <MessageSquare 
          size={16} 
          color={currentChatId === chat._id ? "#000000" : "#666666"} 
          style={{
            animation: isHovered ? 'pulse 2s infinite' : 'none'
          }}
        />
        
        {isEditing ? (
          <div style={styles.editContainer}>
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") saveEdit(chat._id, e);
                if (e.key === "Escape") cancelEdit(e);
              }}
              style={styles.editInput}
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={(e) => saveEdit(chat._id, e)}
              style={styles.saveButton}
            >
              <Check size={14} />
            </button>
            <button
              onClick={cancelEdit}
              style={styles.cancelButton}
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <>
            <div style={{
              ...styles.chatTitle,
              color: currentChatId === chat._id ? "#000000" : "#666666",
              fontWeight: currentChatId === chat._id ? "600" : "400"
            }}>
              {chat.title}
            </div>
            
            <button
              onClick={(e) => toggleActions(chat._id, e)}
              onMouseEnter={() => {
                if (timeoutRef.current) {
                  clearTimeout(timeoutRef.current);
                }
              }}
              style={{
                ...styles.moreButton,
                opacity: isHovered ? 1 : 0,
                transform: isHovered ? 'scale(1)' : 'scale(0.8)',
                transition: 'all 0.2s ease',
                zIndex: 5
              }}
            >
              <MoreVertical size={14} color="#666666" />
            </button>
            
            {showActionMenu && (
              <div 
                ref={menuRef}
                style={{
                  position: 'fixed',
                  left: isOpen ? '260px' : '70px',
                  top: hoveredChat ? `${hoveredChat * 50 + 100}px` : 'auto',
                  background: "#ffffff",
                  border: "1px solid #e0e0e0",
                  borderRadius: "8px",
                  boxShadow: "0 8px 20px rgba(0,0,0,0.1)",
                  zIndex: 9999,
                  minWidth: "120px",
                  overflow: "hidden",
                  animation: "fadeIn 0.2s ease-out"
                }}
                onMouseEnter={handleMenuMouseEnter}
                onMouseLeave={handleMenuMouseLeave}
              >
                <button
                  onClick={(e) => startEdit(chat, e)}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    background: "none",
                    border: "none",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    fontSize: "13px",
                    color: "#000000",
                    cursor: "pointer",
                    transition: "all 0.2s"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#f0f0f0';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'none';
                  }}
                >
                  <Edit2 size={12} />
                  <span>Rename</span>
                </button>
                <button
                  onClick={(e) => handleDelete(chat._id, chat.title, e)}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    background: "none",
                    border: "none",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    fontSize: "13px",
                    color: "#f44336",
                    cursor: "pointer",
                    transition: "all 0.2s"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#ffebee';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'none';
                  }}
                >
                  <Trash2 size={12} />
                  <span>Delete</span>
                </button>
              </div>
            )}
          </>
        )}
        
        {currentChatId === chat._id && (
          <div style={styles.activeChatGlow} />
        )}
      </div>
    );
  }
}

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    position: "relative",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    overflow: "hidden",
    zIndex: 20
  },
  sidebarGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "radial-gradient(circle at 50% 50%, rgba(0, 0, 0, 0.03) 0%, transparent 50%)",
    pointerEvents: "none",
    transition: "transform 0.2s ease-out"
  },
  sidebarParticles: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: "none",
    overflow: "hidden"
  },
  particle: {
    position: "absolute",
    background: "radial-gradient(circle, #000000, transparent)",
    borderRadius: "50%",
    pointerEvents: "none"
  },
  toggleButton: {
    position: "absolute",
    top: "24px",
    width: "32px",
    height: "32px",
    background: "#ffffff",
    border: "2px solid #000000",
    borderRadius: "16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    zIndex: 30,
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
    transition: "all 0.2s ease",
    padding: 0,
    outline: "none"
  },
  toggleButtonInner: {
    width: "28px",
    height: "28px",
    borderRadius: "14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#000000"
  },
  newChatSection: {
    padding: "24px 16px 16px 16px"
  },
  newChatButton: {
    width: "100%",
    border: "none",
    borderRadius: "12px",
    fontSize: "15px",
    fontWeight: "600",
    display: "flex",
    alignItems: "center",
    cursor: "pointer",
    position: "relative",
    overflow: "hidden"
  },
  chatsList: {
    flex: 1,
    overflowY: "auto",
    padding: "0 12px",
    scrollbarWidth: "thin",
    scrollbarColor: "#000000 #f0f0f0"
  },
  collapsedList: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "4px",
    padding: "8px 0"
  },
  collapsedTooltip: {
    position: "absolute",
    left: "70px",
    background: "#000000",
    color: "#ffffff",
    padding: "6px 12px",
    borderRadius: "8px",
    fontSize: "12px",
    whiteSpace: "nowrap",
    zIndex: 100,
    animation: "fadeIn 0.2s ease-out"
  },
  loadingContainer: {
    textAlign: "center",
    padding: "40px 20px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "12px"
  },
  loadingSpinner: {
    width: 40,
    height: 40,
    border: "3px solid rgba(0,0,0,0.1)",
    borderTop: "3px solid #000000",
    borderRadius: "50%",
    animation: "spin 1s linear infinite"
  },
  loadingTextContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "8px"
  },
  loadingText: {
    color: "#666666",
    fontSize: "13px"
  },
  loadingDots: {
    display: "flex",
    gap: "4px"
  },
  loadingDot: {
    width: "6px",
    height: "6px",
    background: "#000000",
    borderRadius: "50%",
    animation: "bounce 1.4s infinite"
  },
  categorySection: {
    marginBottom: "20px"
  },
  categoryHeader: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "8px 8px 4px",
    marginBottom: "4px"
  },
  categoryTitle: {
    color: "#666666",
    fontSize: "11px",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    fontWeight: "600",
    flex: 1
  },
  categoryCount: {
    color: "#000000",
    fontSize: "10px",
    background: "rgba(0,0,0,0.05)",
    padding: "2px 6px",
    borderRadius: "10px"
  },
  chatItem: {
    padding: "12px 10px",
    margin: "2px 0",
    borderRadius: "10px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    position: "relative"
  },
  chatItemCollapsed: {
    padding: "12px",
    margin: "2px 0",
    borderRadius: "10px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.3s ease",
    width: "100%",
    position: "relative"
  },
  chatTitle: {
    flex: 1,
    fontSize: "13px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap"
  },
  moreButton: {
    background: "none",
    border: "none",
    padding: "4px",
    cursor: "pointer",
    borderRadius: "4px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  editContainer: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    gap: "4px"
  },
  editInput: {
    flex: 1,
    background: "#ffffff",
    border: "1px solid #000000",
    borderRadius: "6px",
    padding: "6px 8px",
    color: "#000000",
    fontSize: "13px",
    outline: "none"
  },
  saveButton: {
    background: "none",
    border: "none",
    color: "#4CAF50",
    cursor: "pointer",
    padding: "4px",
    display: "flex",
    alignItems: "center"
  },
  cancelButton: {
    background: "none",
    border: "none",
    color: "#f44336",
    cursor: "pointer",
    padding: "4px",
    display: "flex",
    alignItems: "center"
  },
  activeChatGlow: {
    position: "absolute",
    left: 0,
    top: "10%",
    width: "3px",
    height: "80%",
    background: "#000000",
    borderRadius: "3px",
    animation: "glowPulse 2s infinite"
  },
  emptyState: {
    textAlign: "center",
    padding: "40px 20px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "16px",
    position: "relative",
    overflow: "hidden"
  },
  emptyStateIcon: {
    width: "80px",
    height: "80px",
    borderRadius: "40px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(0,0,0,0.05)",
    position: "relative"
  },
  emptyStateIconGlow: {
    position: "absolute",
    top: "-10px",
    left: "-10px",
    right: "-10px",
    bottom: "-10px",
    borderRadius: "50px",
    background: "radial-gradient(circle, rgba(0,0,0,0.1) 0%, transparent 70%)",
    animation: "pulse 3s infinite"
  },
  emptyStateContent: {
    position: "relative",
    zIndex: 2
  },
  emptyStateTitle: {
    color: "#000000",
    fontSize: "16px",
    fontWeight: "600",
    marginBottom: "4px"
  },
  emptyStateSubtitle: {
    color: "#666666",
    fontSize: "13px"
  },
  emptyStateBubbles: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "100px",
    pointerEvents: "none"
  },
  emptyStateBubble: {
    position: "absolute",
    bottom: 0,
    width: "20px",
    height: "20px",
    background: "rgba(0,0,0,0.03)",
    borderRadius: "50%",
    animation: "floatParticle 3s infinite"
  },
  userSection: {
    padding: "20px",
    position: "relative"
  },
  userInfo: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "16px"
  },
  userAvatar: {
    width: "40px",
    height: "40px",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "600",
    fontSize: "16px",
    position: "relative"
  },
  userAvatarGlow: {
    position: "absolute",
    top: "-5px",
    left: "-5px",
    right: "-5px",
    bottom: "-5px",
    borderRadius: "14px",
    background: "radial-gradient(circle, rgba(0,0,0,0.1) 0%, transparent 70%)",
    zIndex: -1,
    animation: "pulse 2s infinite"
  },
  userDetails: {
    flex: 1
  },
  userName: {
    color: "#000000",
    fontSize: "14px",
    fontWeight: "600",
    marginBottom: "2px"
  },
  userUsername: {
    color: "#666666",
    fontSize: "12px"
  },
  logoutButton: {
    width: "100%",
    padding: "10px",
    background: "none",
    borderRadius: "10px",
    fontSize: "13px",
    fontWeight: "500",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    cursor: "pointer",
    position: "relative",
    overflow: "hidden"
  },
  logoutIconButton: {
    width: "44px",
    height: "44px",
    background: "none",
    border: "1px solid #e0e0e0",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    transition: "all 0.2s",
    margin: "0 auto"
  },
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0, 0, 0, 0.5)",
    backdropFilter: "blur(5px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    animation: "modalFadeIn 0.2s ease-out"
  },
  modalContent: {
    background: "#ffffff",
    border: "1px solid #e0e0e0",
    borderRadius: "20px",
    padding: "32px",
    maxWidth: "400px",
    width: "90%",
    textAlign: "center",
    boxShadow: "0 20px 40px rgba(0, 0, 0, 0.1)",
    animation: "modalSlideIn 0.3s ease-out"
  },
  modalIcon: {
    marginBottom: "20px",
    display: "flex",
    justifyContent: "center",
    animation: "pulse 2s infinite"
  },
  modalTitle: {
    color: "#000000",
    fontSize: "24px",
    fontWeight: "600",
    marginBottom: "12px"
  },
  modalMessage: {
    color: "#666666",
    fontSize: "14px",
    lineHeight: "1.6",
    marginBottom: "24px"
  },
  modalButtons: {
    display: "flex",
    gap: "12px",
    justifyContent: "center"
  },
  modalCancelButton: {
    background: "none",
    border: "1px solid #e0e0e0",
    borderRadius: "30px",
    padding: "12px 24px",
    color: "#666666",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
    transition: "all 0.2s",
    flex: 1
  },
  modalConfirmButton: {
    background: "#f44336",
    border: "none",
    borderRadius: "30px",
    padding: "12px 24px",
    color: "#ffffff",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s",
    flex: 1,
    boxShadow: "0 4px 12px rgba(244, 67, 54, 0.3)"
  }
};