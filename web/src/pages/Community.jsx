import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, Sprout, Bell, Droplet, Plus, QrCode, MessageSquare, CheckCircle2 } from 'lucide-react';
import LanguageToggle from '../components/LanguageToggle';

export default function Community() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div style={{ backgroundColor: 'var(--bg-base)', minHeight: '100vh', paddingBottom: '40px' }}>
      
      {/* Header */}
      <div style={{ padding: '48px 24px 24px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
          <ChevronLeft size={28} />
        </button>
        <LanguageToggle />
      </div>

      <div style={{ padding: '0 24px' }}>
        
        {/* Growth Tracker Shield */}
        <div style={{ backgroundColor: 'var(--bg-surface)', borderRadius: '24px', padding: '20px', marginBottom: '24px', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <img src="/burlap_sacks.png" alt="Ragi" style={{ width: '24px', height: '24px', objectFit: 'contain' }} />
            <h3 style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--text-inverse)', margin: 0 }}>Ragi Fields</h3>
            <Droplet size={16} color="var(--success)" style={{ marginLeft: 'auto' }} />
          </div>

          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            {/* Progress Dial */}
            <div style={{ position: 'relative', width: '80px', height: '40px', overflow: 'hidden' }}>
              <div style={{
                position: 'absolute', top: 0, left: 0, width: '80px', height: '80px',
                borderRadius: '50%',
                background: 'conic-gradient(from 180deg at 50% 50%, var(--brand-primary) 0deg, var(--brand-primary) 80deg, rgba(26,35,28,0.1) 80deg, rgba(26,35,28,0.1) 180deg)',
              }}></div>
              <div style={{ position: 'absolute', top: '12px', left: '12px', width: '56px', height: '56px', backgroundColor: 'var(--bg-surface)', borderRadius: '50%' }}></div>
            </div>
            
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-inverse)', fontWeight: '700', marginBottom: '4px' }}>Growth Cycle: Day 45</p>
              <p style={{ fontSize: '0.75rem', color: 'rgba(26,35,28,0.7)', fontWeight: '600', lineHeight: '1.3' }}>
                Ragi crop. Hand-weeding complete (Day 40)
              </p>
              <div style={{ display: 'flex', gap: '4px', marginTop: '8px' }}>
                <Sprout size={14} color="var(--success)" />
                <Sprout size={16} color="var(--success)" />
                <Sprout size={18} color="var(--success)" />
                <Sprout size={20} color="rgba(26,35,28,0.3)" />
              </div>
            </div>
          </div>
        </div>

        {/* Reminders & Alarms System */}
        <h3 style={{ fontSize: '1rem', fontWeight: '800', color: 'white', marginBottom: '16px' }}>Reminders & Alarms</h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
          <div style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Bell size={18} color="var(--brand-primary)" />
            <span style={{ fontSize: '0.85rem', color: 'white', fontWeight: '600' }}>Day 48: Fertilize (Trad.) - 7:00 AM</span>
            <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: 'var(--brand-primary)', fontWeight: '700' }}>(Bell Active)</span>
          </div>

          <div style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px', opacity: 0.7 }}>
            <Bell size={18} color="var(--text-muted)" />
            <span style={{ fontSize: '0.85rem', color: 'white', fontWeight: '500' }}>Day 50: Pest Check (Hybrid) - 8:30 AM</span>
            <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '600' }}>(Bell Inactive)</span>
          </div>

          <div style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Bell size={18} color="var(--brand-primary)" />
            <span style={{ fontSize: '0.85rem', color: 'white', fontWeight: '600' }}>Day 55: Weeding - 9:00 AM</span>
            <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: 'var(--brand-primary)', fontWeight: '700' }}>(Bell Active)</span>
          </div>
        </div>

        {/* History Logger */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
          <CheckCircle2 size={16} color="var(--success)" />
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600' }}>History Logged: Day 40 Weeding</span>
        </div>

        {/* Soil Moisture Radial */}
        <div style={{ backgroundColor: 'var(--bg-surface)', borderRadius: '24px', padding: '20px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '16px', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ position: 'relative', width: '50px', height: '50px', borderRadius: '50%', background: 'conic-gradient(var(--info) 0% 78%, rgba(26,35,28,0.1) 78% 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: '40px', height: '40px', backgroundColor: 'var(--bg-surface)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Droplet size={16} color="var(--info)" />
            </div>
          </div>
          <div>
            <h4 style={{ fontSize: '0.95rem', fontWeight: '800', color: 'var(--text-inverse)', margin: 0 }}>Soil Moisture</h4>
            <p style={{ fontSize: '0.8rem', color: 'rgba(26,35,28,0.7)', margin: 0, fontWeight: '600' }}>78% Optimal Levels</p>
          </div>
        </div>

        {/* Bottom Primary Buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '32px' }}>
          <button className="btn btn-primary" style={{ backgroundColor: 'rgba(255,241,84,0.2)', color: 'var(--brand-primary)', border: '1px solid var(--brand-primary)', borderRadius: '16px', padding: '12px' }}>
            <Plus size={18} /> Log Activity
          </button>
          <button onClick={() => navigate('/scan')} className="btn btn-primary" style={{ color: '#1A1A1A', borderRadius: '16px', padding: '12px' }}>
            <QrCode size={18} /> Scan Field Tag
          </button>
        </div>

        {/* Expert Advice Forum Segment */}
        <div style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', borderRadius: '24px', padding: '24px', position: 'relative', overflow: 'hidden' }}>
          
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
            <div style={{ position: 'relative' }}>
              <div style={{ width: '80px', height: '80px', borderRadius: '50%', overflow: 'hidden', border: '3px solid var(--brand-primary)', backgroundColor: 'var(--bg-surface)' }}>
                <img src="/expert_avatar.png" alt="Expert" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div style={{ position: 'absolute', top: '-10px', left: '-20px', backgroundColor: 'var(--brand-primary)', color: '#1A1A1A', padding: '4px 12px', borderRadius: '16px', fontSize: '1.2rem', fontWeight: '800' }}>?</div>
              <div style={{ position: 'absolute', top: '10px', right: '-30px', backgroundColor: 'var(--bg-surface)', padding: '6px', borderRadius: '50%' }}><MessageSquare size={16} color="var(--text-inverse)" /></div>
            </div>
          </div>
          
          <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'white', textAlign: 'center', marginBottom: '24px' }}>Expert Advice Forum</h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
            <div style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: '16px', padding: '16px', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <MessageSquare size={18} color="var(--success)" style={{ marginTop: '2px' }} />
              <div>
                <p style={{ fontSize: '0.85rem', color: 'white', fontWeight: '600', margin: '0 0 4px 0' }}>Best composting techniques?</p>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: 0 }}>15 replies</p>
              </div>
            </div>
            
            <div style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: '16px', padding: '16px', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <MessageSquare size={18} color="var(--success)" style={{ marginTop: '2px' }} />
              <div>
                <p style={{ fontSize: '0.85rem', color: 'white', fontWeight: '600', margin: '0 0 4px 0' }}>Ragi disease symptoms?</p>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: 0 }}>10 replies</p>
              </div>
            </div>
          </div>

          <button className="btn btn-primary" style={{ width: '100%', color: '#1A1A1A', borderRadius: '16px' }}>
            Ask an Expert
          </button>
        </div>

      </div>

    </div>
  );
}
