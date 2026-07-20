import React from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

export default function SplashScreen({ isFading }) {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100dvh',
      backgroundColor: '#FFFFFF',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 9999,
      opacity: isFading ? 0 : 1,
      transition: 'opacity 0.5s ease-in-out',
      pointerEvents: isFading ? 'none' : 'all',
    }}>
      <div style={{ 
        width: '100%', 
        maxWidth: '360px', 
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0px'
      }}>
        <div style={{ 
          width: '320px', 
          height: '320px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center' 
        }}>
          <DotLottieReact
            src="https://lottie.host/169ffa0e-33b4-4279-9642-4bdb34445832/BdPqkHi4t9.lottie"
            loop
            autoplay
            style={{ width: '100%', height: '100%' }}
          />
        </div>
        <h1 style={{ 
          color: 'var(--brand-primary)', 
          fontSize: '2rem',
          letterSpacing: '0.05em',
          marginTop: '-30px',
          fontWeight: '700'
        }}>
          BhoomiMitra
        </h1>
      </div>
    </div>
  );
}
