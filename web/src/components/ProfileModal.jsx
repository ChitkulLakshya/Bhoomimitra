import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useSoil } from '../context/SoilContext';
import { useTranslation } from 'react-i18next';
import { X, Phone, User, Sprout, Briefcase, TrendingUp, Truck, ShieldCheck, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ProfileModal = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { allSoilData } = useSoil();
  const { t } = useTranslation();
  const navigate = useNavigate();

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.6)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      justifyContent: 'flex-end',
      zIndex: 1000
    }}>
      {/* Slide-in panel */}
      <div style={{
        width: '100%',
        maxWidth: '420px',
        height: '100%',
        backgroundColor: '#F8FAF6',
        boxShadow: '-10px 0 30px rgba(0,0,0,0.15)',
        display: 'flex',
        flexDirection: 'column',
        animation: 'slideIn 0.3s ease-out'
      }}>
        
        {/* Header */}
        <div style={{
          padding: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid #EAEAEA',
          backgroundColor: '#FFFFFF'
        }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#1C2B14', margin: 0 }}>
            {t('My Profile')}
          </h2>
          <button 
            onClick={onClose}
            style={{
              background: '#F0F5EC',
              border: 'none',
              borderRadius: '50%',
              width: '36px', height: '36px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
              color: '#1C2B14'
            }}
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
          
          {/* User Info Section */}
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '24px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
            marginBottom: '24px',
            border: '1px solid #EBF1E5'
          }}>
            <div style={{
              width: '80px', height: '80px',
              borderRadius: '50%',
              backgroundColor: '#F0F5EC',
              marginBottom: '16px',
              overflow: 'hidden',
              border: '3px solid #5C763A'
            }}>
              <img src="/expert_avatar.png" alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <User size={18} color="#5C763A" />
              <span style={{ fontSize: '1.2rem', fontWeight: '800', color: '#1A1A1A' }}>
                {user?.name || t('Farmer')}
              </span>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#F9FBF7', padding: '6px 12px', borderRadius: '16px' }}>
              <Phone size={16} color="#667757" />
              <span style={{ fontSize: '0.95rem', fontWeight: '600', color: '#667757', letterSpacing: '0.5px' }}>
                +91 {user?.phone || '9876543210'}
              </span>
            </div>
          </div>

          {/* Soil Cards Section */}
          <h3 style={{ fontSize: '1.05rem', fontWeight: '800', color: '#1C2B14', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={20} color="#5C763A" />
            {t('My Soil Cards')}
          </h3>
          
          {allSoilData && allSoilData.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
              {allSoilData.map((card, idx) => (
                <div key={card.id || idx} style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '16px',
                  padding: '16px',
                  border: '1px solid #EBF1E5',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ fontSize: '0.95rem', fontWeight: '700', color: '#1A1A1A', marginBottom: '4px' }}>
                      {t('Soil Test Record')} #{idx + 1}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#667757', fontWeight: '500' }}>
                      pH: {card.ph} | N: {card.nitrogen} | P: {card.phosphorus} | K: {card.potassium}
                    </div>
                  </div>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#F0F5EC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Sprout size={18} color="#5C763A" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              padding: '24px',
              textAlign: 'center',
              border: '1px dashed #C3D4B4',
              marginBottom: '32px'
            }}>
              <p style={{ fontSize: '0.9rem', color: '#667757', fontWeight: '500', marginBottom: '12px' }}>
                {t('No soil cards uploaded yet.')}
              </p>
              <button
                onClick={() => { onClose(); navigate('/scan'); }}
                style={{
                  backgroundColor: '#5C763A', color: 'white', border: 'none', borderRadius: '20px',
                  padding: '8px 16px', fontSize: '0.9rem', fontWeight: '700', cursor: 'pointer'
                }}
              >
                {t('Scan Card Now')}
              </button>
            </div>
          )}

          {/* Business & Future Scope Section */}
          <h3 style={{ fontSize: '1.05rem', fontWeight: '800', color: '#1C2B14', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Briefcase size={20} color="#5C763A" />
            {t('Business & Future Scope')}
          </h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px', paddingBottom: '32px' }}>
            
            {/* Scope 1: B2B Marketplace */}
            <div style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              padding: '16px',
              border: '1px solid #EBF1E5',
              display: 'flex',
              gap: '16px',
              alignItems: 'flex-start'
            }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '12px', backgroundColor: '#F4F9EE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <TrendingUp size={20} color="#5C763A" />
              </div>
              <div>
                <div style={{ fontSize: '0.95rem', fontWeight: '800', color: '#1A1A1A', marginBottom: '4px' }}>
                  B2B Marketplace <span style={{ fontSize: '0.65rem', backgroundColor: '#EBF1E5', color: '#5C763A', padding: '2px 6px', borderRadius: '8px', marginLeft: '6px', verticalAlign: 'middle' }}>COMING SOON</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#667757', lineHeight: '1.4' }}>
                  Connect directly with bulk buyers, distributors, and food processing companies to sell your harvest at premium rates.
                </div>
              </div>
            </div>

            {/* Scope 2: Logistics & Supply Chain */}
            <div style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              padding: '16px',
              border: '1px solid #EBF1E5',
              display: 'flex',
              gap: '16px',
              alignItems: 'flex-start'
            }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '12px', backgroundColor: '#FFFDE6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Truck size={20} color="#D4B200" />
              </div>
              <div>
                <div style={{ fontSize: '0.95rem', fontWeight: '800', color: '#1A1A1A', marginBottom: '4px' }}>
                  Farm-to-Gate Logistics <span style={{ fontSize: '0.65rem', backgroundColor: '#FFFDE6', color: '#D4B200', padding: '2px 6px', borderRadius: '8px', marginLeft: '6px', verticalAlign: 'middle' }}>Q4 2026</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#667757', lineHeight: '1.4' }}>
                  Integrated truck booking and cold-chain supply management right from your farm to the buyer.
                </div>
              </div>
            </div>

            {/* Scope 3: Premium Advisory */}
            <div style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              padding: '16px',
              border: '1px solid #EBF1E5',
              display: 'flex',
              gap: '16px',
              alignItems: 'flex-start'
            }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '12px', backgroundColor: '#F0F5EC', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <ShieldCheck size={20} color="#3B532B" />
              </div>
              <div>
                <div style={{ fontSize: '0.95rem', fontWeight: '800', color: '#1A1A1A', marginBottom: '4px' }}>
                  Premium AI Advisory <span style={{ fontSize: '0.65rem', backgroundColor: '#EBF1E5', color: '#5C763A', padding: '2px 6px', borderRadius: '8px', marginLeft: '6px', verticalAlign: 'middle' }}>ENTERPRISE</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#667757', lineHeight: '1.4' }}>
                  Advanced satellite imagery analysis and dedicated agronomist consultations for large-scale farm operations.
                </div>
              </div>
            </div>

          </div>
          
        </div>
      </div>
      
      {/* Global CSS for animation */}
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
};

export default ProfileModal;
