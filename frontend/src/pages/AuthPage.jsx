// src/pages/AuthPage.jsx
import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { 
  User, Lock, Mail, Zap, Eye, EyeOff, Sparkles, Shield, Zap as ZapIcon
} from "lucide-react";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    display_name: "",
    username: "",
    password: ""
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [floatingParticles, setFloatingParticles] = useState([]);
  const [glowIntensity, setGlowIntensity] = useState(1);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [hoveredField, setHoveredField] = useState(null);
  const [cardHover, setCardHover] = useState(false);
  const { login, register } = useAuth();

  // Create floating particles for background animation
  useEffect(() => {
    const particles = [];
    for (let i = 0; i < 50; i++) {
      particles.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 8 + 2,
        speed: Math.random() * 5 + 2,
        delay: Math.random() * 8,
        opacity: Math.random() * 0.2 + 0.05,
        color: '#000000'
      });
    }
    setFloatingParticles(particles);

    // Animate glow intensity with smoother sine wave
    const interval = setInterval(() => {
      setGlowIntensity(prev => 0.7 + Math.sin(Date.now() / 800) * 0.3);
    }, 50);

    // Track mouse position for parallax effect
    const handleMouseMove = (e) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth - 0.5) * 10,
        y: (e.clientY / window.innerHeight - 0.5) * 10
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      clearInterval(interval);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isLogin) {
        await login(formData.username, formData.password);
      } else {
        await register(formData.username, formData.password, formData.display_name);
      }
    } catch (err) {
      setError(err.response?.data?.error || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleFieldFocus = (fieldName) => {
    setHoveredField(fieldName);
  };

  const handleFieldBlur = () => {
    setHoveredField(null);
  };

  return (
    <div style={styles.container}>
      {/* Animated background particles with enhanced effects */}
      <div style={styles.particleContainer}>
        {floatingParticles.map((particle) => (
          <div
            key={particle.id}
            style={{
              ...styles.particle,
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              opacity: particle.opacity,
              background: `radial-gradient(circle, ${particle.color} 0%, transparent 70%)`,
              animation: `floatParticle ${particle.speed * 3}s infinite ease-in-out ${particle.delay}s`,
              filter: `blur(${particle.size > 5 ? '1px' : '0.5px'})`,
            }}
          />
        ))}
      </div>

      {/* Animated gradient orbs with mouse following effect */}
      <div style={{
        ...styles.orb,
        ...styles.orb1,
        background: "radial-gradient(circle, rgba(0,0,0,0.05) 0%, transparent 70%)",
        transform: `scale(${glowIntensity}) translate(${mousePosition.x * 0.5}px, ${mousePosition.y * 0.5}px)`,
        transition: 'transform 0.3s ease-out'
      }} />
      <div style={{
        ...styles.orb,
        ...styles.orb2,
        background: "radial-gradient(circle, rgba(0,0,0,0.03) 0%, transparent 70%)",
        transform: `scale(${glowIntensity * 1.2}) translate(${mousePosition.x * -0.3}px, ${mousePosition.y * -0.3}px)`,
        transition: 'transform 0.4s ease-out'
      }} />
      
      {/* Floating dots in background */}
      <div style={styles.dotsPattern} />
      
      <div 
        style={{
          ...styles.card,
          transform: cardHover 
            ? `perspective(1000px) rotateX(${mousePosition.y * 0.02}deg) rotateY(${mousePosition.x * -0.02}deg) scale(1.02)` 
            : `perspective(1000px) rotateX(${mousePosition.y * 0.03}deg) rotateY(${mousePosition.x * -0.03}deg)`,
          transition: 'transform 0.3s ease-out, box-shadow 0.3s ease'
        }}
        onMouseEnter={() => setCardHover(true)}
        onMouseLeave={() => setCardHover(false)}
      >
        <div style={styles.header}>
          <div style={styles.logoWrapper}>
            <div style={{
              ...styles.logo,
              animation: 'logoFloat 3s ease-in-out infinite, glowPulse 2s infinite',
              transform: cardHover ? 'scale(1.1)' : 'scale(1)',
              transition: 'transform 0.3s ease'
            }}>
              <Zap size={40} color="#000000" />
              <div style={styles.logoGlow} />
            </div>
            {/* Ripple effect around logo */}
            <div style={styles.logoRipple1} />
            <div style={styles.logoRipple2} />
          </div>
          
          <h1 style={styles.title}>
            LeadSOC-AI
            <Sparkles size={24} color="#000000" style={styles.sparkle} />
          </h1>
          
          <p style={{
            ...styles.subtitle,
            animation: 'fadeInUp 0.8s ease-out'
          }}>
            {isLogin ? "Welcome back! Please sign in to continue." : "Create your account to start chatting."}
          </p>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          {!isLogin && (
            <div style={{
              ...styles.inputGroup,
              animation: 'slideInFromLeft 0.5s ease-out'
            }}>
              <label style={styles.label}>
                <User size={16} color="#666666" />
                <span>Display Name</span>
              </label>
              <div style={styles.inputWrapper}>
                <input
                  type="text"
                  value={formData.display_name}
                  onChange={(e) => setFormData({...formData, display_name: e.target.value})}
                  onFocus={() => handleFieldFocus('display_name')}
                  onBlur={handleFieldBlur}
                  style={{
                    ...styles.input,
                    borderColor: hoveredField === 'display_name' ? '#000000' : '#e0e0e0',
                    transform: hoveredField === 'display_name' ? 'scale(1.02)' : 'scale(1)',
                    boxShadow: hoveredField === 'display_name' ? '0 0 20px rgba(0,0,0,0.1)' : 'none'
                  }}
                  placeholder="John Doe"
                  required={!isLogin}
                />
                <div style={{
                  ...styles.inputFocusRing,
                  opacity: hoveredField === 'display_name' ? 1 : 0
                }} />
                {hoveredField === 'display_name' && <div style={styles.inputGlow} />}
              </div>
            </div>
          )}

          <div style={{
            ...styles.inputGroup,
            animation: 'slideInFromLeft 0.6s ease-out'
          }}>
            <label style={styles.label}>
              <Mail size={16} color="#666666" />
              <span>Username</span>
            </label>
            <div style={styles.inputWrapper}>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({...formData, username: e.target.value})}
                onFocus={() => handleFieldFocus('username')}
                onBlur={handleFieldBlur}
                style={{
                  ...styles.input,
                  borderColor: hoveredField === 'username' ? '#000000' : '#e0e0e0',
                  transform: hoveredField === 'username' ? 'scale(1.02)' : 'scale(1)',
                  boxShadow: hoveredField === 'username' ? '0 0 20px rgba(0,0,0,0.1)' : 'none'
                }}
                placeholder="johndoe"
                required
              />
              <div style={{
                ...styles.inputFocusRing,
                opacity: hoveredField === 'username' ? 1 : 0
              }} />
              {hoveredField === 'username' && <div style={styles.inputGlow} />}
            </div>
          </div>

          <div style={{
            ...styles.inputGroup,
            animation: 'slideInFromLeft 0.7s ease-out'
          }}>
            <label style={styles.label}>
              <Lock size={16} color="#666666" />
              <span>Password</span>
            </label>
            <div style={styles.inputWrapper}>
              <input
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                onFocus={() => handleFieldFocus('password')}
                onBlur={handleFieldBlur}
                style={{
                  ...styles.input,
                  borderColor: hoveredField === 'password' ? '#000000' : '#e0e0e0',
                  transform: hoveredField === 'password' ? 'scale(1.02)' : 'scale(1)',
                  boxShadow: hoveredField === 'password' ? '0 0 20px rgba(0,0,0,0.1)' : 'none'
                }}
                placeholder="••••••••"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  ...styles.passwordToggle,
                  transform: `translateY(-50%) ${showPassword ? 'rotate(180deg)' : 'rotate(0)'}`,
                  transition: 'transform 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#f0f0f0';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'none';
                }}
              >
                {showPassword ? <EyeOff size={18} color="#666666" /> : <Eye size={18} color="#666666" />}
              </button>
              <div style={{
                ...styles.inputFocusRing,
                opacity: hoveredField === 'password' ? 1 : 0
              }} />
              {hoveredField === 'password' && <div style={styles.inputGlow} />}
            </div>
          </div>

          {error && (
            <div style={{
              ...styles.errorMessage,
              animation: 'shake 0.5s ease-in-out'
            }}>
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.submitButton,
              background: "#000000",
              opacity: loading ? 0.7 : 1,
              cursor: loading ? 'not-allowed' : 'pointer',
              animation: 'pulseButton 2s infinite',
              transform: cardHover ? 'scale(1.02)' : 'scale(1)',
              transition: 'transform 0.3s ease, background 0.3s ease'
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.background = '#333333';
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.currentTarget.style.background = '#000000';
              }
            }}
          >
            {loading ? (
              <div style={styles.loader} />
            ) : (
              <>
                <ZapIcon size={18} style={styles.buttonIcon} />
                <span>{isLogin ? "Sign In" : "Create Account"}</span>
              </>
            )}
            <div style={styles.buttonGlow} />
            <div style={styles.buttonRipple} />
          </button>
        </form>

        <div style={{
          ...styles.toggleContainer,
          animation: 'fadeInUp 0.9s ease-out'
        }}>
          <span style={styles.toggleText}>
            {isLogin ? "Don't have an account?" : "Already have an account?"}
          </span>
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError("");
              setFormData({ display_name: "", username: "", password: "" });
            }}
            style={{
              ...styles.toggleButton,
              animation: 'pulse 2s infinite'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#f0f0f0';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'none';
            }}
          >
            {isLogin ? "Create one" : "Sign in"}
          </button>
        </div>

        <div style={{
          ...styles.features,
          animation: 'fadeInUp 1s ease-out'
        }}>
          <div style={{
            ...styles.feature,
            animation: 'float 3s ease-in-out infinite'
          }}>
            <Shield size={14} color="#000000" />
            <span>Secure</span>
          </div>
          <div style={{
            ...styles.feature,
            animation: 'float 3s ease-in-out infinite 0.2s'
          }}>
            <Zap size={14} color="#000000" />
            <span>Fast</span>
          </div>
          <div style={{
            ...styles.feature,
            animation: 'float 3s ease-in-out infinite 0.4s'
          }}>
            <Sparkles size={14} color="#000000" />
            <span>AI-Powered</span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes floatParticle {
          0%, 100% { 
            transform: translateY(0) translateX(0) rotate(0deg); 
          }
          25% { 
            transform: translateY(-30px) translateX(15px) rotate(90deg); 
          }
          50% { 
            transform: translateY(-40px) translateX(-15px) rotate(180deg); 
          }
          75% { 
            transform: translateY(-20px) translateX(25px) rotate(270deg); 
          }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-5px); }
        }
        
        @keyframes logoFloat {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-5px) rotate(2deg); }
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 0.7; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.05); }
        }
        
        @keyframes pulseButton {
          0%, 100% { box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
          50% { box-shadow: 0 8px 25px rgba(0,0,0,0.2); }
        }
        
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        
        @keyframes glowPulse {
          0%, 100% { box-shadow: 0 0 20px rgba(0,0,0,0.1); }
          50% { box-shadow: 0 0 40px rgba(0,0,0,0.15); }
        }
        
        @keyframes slideInFromLeft {
          from { 
            transform: translateX(-30px); 
            opacity: 0; 
          }
          to { 
            transform: translateX(0); 
            opacity: 1; 
          }
        }
        
        @keyframes fadeInUp {
          from { 
            transform: translateY(20px); 
            opacity: 0; 
          }
          to { 
            transform: translateY(0); 
            opacity: 1; 
          }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        
        @keyframes ripple {
          0% { 
            transform: scale(0.8); 
            opacity: 0.8; 
          }
          100% { 
            transform: scale(2); 
            opacity: 0; 
          }
        }
        
        @keyframes rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @keyframes borderPulse {
          0%, 100% { border-color: rgba(0,0,0,0.1); }
          50% { border-color: rgba(0,0,0,0.2); }
        }
      `}</style>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    background: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    position: "relative",
    overflow: "hidden"
  },
  particleContainer: {
    position: "absolute",
    width: "100%",
    height: "100%",
    pointerEvents: "none"
  },
  particle: {
    position: "absolute",
    borderRadius: "50%",
    pointerEvents: "none",
    transition: 'all 0.3s ease'
  },
  dotsPattern: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(0,0,0,0.02) 1px, transparent 0)',
    backgroundSize: '50px 50px',
    pointerEvents: 'none'
  },
  orb: {
    position: "absolute",
    width: "400px",
    height: "400px",
    borderRadius: "50%",
    filter: "blur(100px)",
    transition: "transform 0.5s ease",
    pointerEvents: "none"
  },
  orb1: {
    top: "-150px",
    right: "-150px",
    animation: "pulse 6s infinite"
  },
  orb2: {
    bottom: "-150px",
    left: "-150px",
    animation: "pulse 8s infinite reverse"
  },
  card: {
    maxWidth: "450px",
    width: "100%",
    background: "#ffffff",
    backdropFilter: "blur(15px)",
    border: "1px solid #e0e0e0",
    borderRadius: "32px",
    padding: "40px",
    position: "relative",
    zIndex: 10,
    boxShadow: "0 20px 40px rgba(0,0,0,0.05), 0 0 0 1px rgba(0,0,0,0.02)",
    animation: "fadeInUp 0.6s ease-out",
    overflow: "hidden"
  },
  header: {
    textAlign: "center",
    marginBottom: "32px"
  },
  logoWrapper: {
    display: "flex",
    justifyContent: "center",
    marginBottom: "20px",
    position: 'relative'
  },
  logo: {
    width: "90px",
    height: "90px",
    background: "#f5f5f5",
    borderRadius: "28px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 10px 30px rgba(0,0,0,0.05)",
    margin: "0 auto",
    position: "relative",
    transition: "transform 0.3s ease",
    animation: "glowPulse 3s infinite"
  },
  logoGlow: {
    position: "absolute",
    top: "-8px",
    left: "-8px",
    right: "-8px",
    bottom: "-8px",
    borderRadius: "32px",
    background: "radial-gradient(circle, rgba(0,0,0,0.05) 0%, transparent 70%)",
    zIndex: -1,
    animation: "pulse 2s infinite"
  },
  logoRipple1: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '100px',
    height: '100px',
    borderRadius: '50%',
    border: '2px solid rgba(0,0,0,0.05)',
    animation: 'ripple 2s infinite'
  },
  logoRipple2: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '120px',
    height: '120px',
    borderRadius: '50%',
    border: '2px solid rgba(0,0,0,0.03)',
    animation: 'ripple 2s infinite 0.5s'
  },
  title: {
    color: "#000000",
    fontSize: "36px",
    fontWeight: "800",
    marginBottom: "10px",
    letterSpacing: "-0.5px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    textShadow: '0 0 20px rgba(0,0,0,0.05)'
  },
  sparkle: {
    animation: "pulse 2s infinite, rotate 10s infinite linear"
  },
  subtitle: {
    color: "#666666",
    fontSize: "14px",
    lineHeight: "1.6",
    maxWidth: "300px",
    margin: "0 auto"
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "20px"
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    animationFillMode: "both"
  },
  label: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    color: "#666666",
    fontSize: "13px",
    fontWeight: "500",
    marginLeft: "4px",
    transition: 'color 0.3s ease'
  },
  inputWrapper: {
    position: "relative",
    width: "100%"
  },
  input: {
    width: "100%",
    padding: "14px 16px",
    background: "#ffffff",
    border: "1px solid #e0e0e0",
    borderRadius: "20px",
    color: "#000000",
    fontSize: "15px",
    outline: "none",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
  },
  inputFocusRing: {
    position: "absolute",
    top: "-2px",
    left: "-2px",
    right: "-2px",
    bottom: "-2px",
    borderRadius: "22px",
    border: "2px solid #000000",
    opacity: 0,
    transition: "opacity 0.3s ease",
    pointerEvents: "none",
    boxShadow: '0 0 15px rgba(0,0,0,0.1)'
  },
  inputGlow: {
    position: 'absolute',
    top: '0',
    left: '0',
    right: '0',
    bottom: '0',
    borderRadius: '20px',
    background: 'radial-gradient(circle at 50% 50%, rgba(0,0,0,0.03), transparent 70%)',
    pointerEvents: 'none',
    animation: 'pulse 2s infinite'
  },
  passwordToggle: {
    position: "absolute",
    right: "12px",
    top: "50%",
    transform: "translateY(-50%)",
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "12px",
    transition: "all 0.3s ease"
  },
  errorMessage: {
    background: "#ffebee",
    border: "1px solid #f44336",
    borderRadius: "16px",
    padding: "12px 16px",
    color: "#f44336",
    fontSize: "13px",
    textAlign: "center"
  },
  submitButton: {
    width: "100%",
    padding: "16px",
    border: "none",
    borderRadius: "24px",
    color: "#ffffff",
    fontSize: "16px",
    fontWeight: "600",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    transition: "all 0.3s ease",
    position: "relative",
    overflow: "hidden",
    cursor: "pointer",
    boxShadow: "0 4px 15px rgba(0,0,0,0.1)"
  },
  buttonIcon: {
    animation: "pulse 2s ease-in-out infinite"
  },
  buttonGlow: {
    position: "absolute",
    top: "0",
    left: "0",
    width: "100%",
    height: "100%",
    background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)",
    transform: "translateX(-100%)",
    animation: "shimmer 2s infinite"
  },
  buttonRipple: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: '5px',
    height: '5px',
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.3)',
    transform: 'translate(-50%, -50%)',
    animation: 'ripple 1s infinite'
  },
  loader: {
    width: "22px",
    height: "22px",
    border: "2px solid rgba(255,255,255,0.3)",
    borderTop: "2px solid #ffffff",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite"
  },
  toggleContainer: {
    marginTop: "24px",
    textAlign: "center",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px"
  },
  toggleText: {
    color: "#666666",
    fontSize: "14px"
  },
  toggleButton: {
    background: "none",
    border: "none",
    color: "#000000",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    padding: "6px 12px",
    borderRadius: "20px",
    transition: "all 0.3s ease",
    position: 'relative'
  },
  features: {
    display: "flex",
    justifyContent: "center",
    gap: "24px",
    marginTop: "28px",
    padding: "16px",
    borderTop: "1px solid #e0e0e0",
    animation: "borderPulse 2s infinite"
  },
  feature: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    color: "#666666",
    fontSize: "12px",
    transition: 'all 0.3s ease',
    ':hover': {
      color: '#000000',
      transform: 'scale(1.1)'
    }
  }
};