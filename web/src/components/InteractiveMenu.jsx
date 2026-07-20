import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Home, Sprout } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import LanguageToggle from './LanguageToggle';

const defaultItems = [
  { label: 'home', icon: Home, route: '/' },
  { label: 'plan', icon: Sprout, route: '/ragi-advisory' },
  { label: 'language', icon: null, route: null }, // Language toggle
];

const defaultAccentColor = '#688C31';

const InteractiveMenu = ({ items, accentColor, activeIndex, onNavigate }) => {
  const { t } = useTranslation();
  
  const finalItems = useMemo(() => {
    const isValid = items && Array.isArray(items) && items.length >= 2 && items.length <= 5;
    if (!isValid) {
      console.warn("InteractiveMenu: 'items' prop is invalid or missing. Using default items.", items);
      return defaultItems;
    }
    return items;
  }, [items]);

  const [internalActiveIndex, setInternalActiveIndex] = useState(0);
  const currentActiveIndex = activeIndex !== undefined ? activeIndex : internalActiveIndex;

  useEffect(() => {
    if (currentActiveIndex >= finalItems.length) {
      setInternalActiveIndex(0);
    }
  }, [finalItems, currentActiveIndex]);

  const textRefs = useRef([]);
  const itemRefs = useRef([]);

  useEffect(() => {
    const setLineWidth = () => {
      const activeItemElement = itemRefs.current[currentActiveIndex];
      const activeTextElement = textRefs.current[currentActiveIndex];

      if (activeItemElement && activeTextElement) {
        const textWidth = activeTextElement.offsetWidth;
        activeItemElement.style.setProperty('--lineWidth', `${textWidth}px`);
      }
    };

    setLineWidth();

    window.addEventListener('resize', setLineWidth);
    return () => {
      window.removeEventListener('resize', setLineWidth);
    };
  }, [currentActiveIndex, finalItems]);

  const handleItemClick = (index) => {
    if (activeIndex === undefined) {
      setInternalActiveIndex(index);
    }
    if (finalItems[index].route && onNavigate) {
      onNavigate(finalItems[index].route);
    }
  };

  const navStyle = useMemo(() => {
    const activeColor = accentColor || defaultAccentColor;
    return { '--component-active-color': activeColor };
  }, [accentColor]);

  return (
    <nav
      className="menu"
      role="navigation"
      style={{
        ...navStyle,
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'white',
        borderTop: '1px solid #e5e5e5',
        padding: '12px 24px',
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        zIndex: 100,
        boxShadow: '0 -2px 10px rgba(0,0,0,0.05)'
      }}
    >
      {finalItems.map((item, index) => {
        const isActive = index === currentActiveIndex;
        const isTextActive = isActive;

        const IconComponent = item.icon;

        return (
          <button
            key={item.label}
            className={`menu__item ${isActive ? 'active' : ''}`}
            onClick={() => handleItemClick(index)}
            ref={(el) => (itemRefs.current[index] = el)}
            style={{ 
              '--lineWidth': '0px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              backgroundColor: 'transparent',
              padding: '8px',
              borderRadius: '12px',
              border: 'none',
              cursor: item.route ? 'pointer' : 'default',
              position: 'relative',
              flex: 1
            }}
          >
            <div className="menu__icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {IconComponent ? (
                <IconComponent 
                  className="icon" 
                  size={24}
                  style={{ 
                    color: isActive ? '#688C31' : '#999999',
                    transition: 'color 0.2s'
                  }} 
                />
              ) : (
                <LanguageToggle />
              )}
            </div>
            {IconComponent && (
              <strong
                className={`menu__text ${isTextActive ? 'active' : ''}`}
                ref={(el) => (textRefs.current[index] = el)}
                style={{
                  fontSize: '0.75rem',
                  fontWeight: '700',
                  color: isActive ? '#688C31' : '#999999',
                  transition: 'color 0.2s'
                }}
              >
                {t(item.label)}
              </strong>
            )}
            {isActive && IconComponent && (
              <div
                style={{
                  position: 'absolute',
                  bottom: '0',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: 'var(--lineWidth, 20px)',
                  height: '3px',
                  backgroundColor: 'var(--component-active-color)',
                  borderRadius: '2px',
                  transition: 'width 0.3s ease'
                }}
              />
            )}
          </button>
        );
      })}
    </nav>
  );
};

export { InteractiveMenu };
