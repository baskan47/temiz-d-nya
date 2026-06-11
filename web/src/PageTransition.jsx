import React, { useState, useEffect } from 'react'

/**
 * PageTransition Component
 * Provides fade and slide animations for page changes
 * Matches mobile Flutter transitions (600ms duration)
 */
export const PageTransition = ({ children, key }) => {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [key])

  const pageStyle = {
    animation: isVisible ? 'pageEnter 0.6s ease-out' : 'pageExit 0.6s ease-out',
    animationFillMode: 'both',
  }

  return (
    <div style={pageStyle}>
      <style>{`
        @keyframes pageEnter {
          from {
            opacity: 0;
            transform: translateX(30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes pageExit {
          from {
            opacity: 1;
            transform: translateX(0);
          }
          to {
            opacity: 0;
            transform: translateX(-30px);
          }
        }
      `}</style>
      {children}
    </div>
  )
}

export default PageTransition
