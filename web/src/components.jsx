/**
 * 🎯 Modern Components & Utilities
 * Reusable UI Components for Web Platform
 */

import React from 'react'
import theme from './theme'

// ✨ Modern Card Component
export const Card = ({ children, style = {}, hover = true, ...props }) => (
  <div
    style={{
      background: theme.colors.white,
      borderRadius: theme.radius.lg,
      padding: theme.spacing.lg,
      border: `1px solid ${theme.colors.border}`,
      boxShadow: theme.shadows.md,
      transition: `all ${theme.transitions.base}`,
      cursor: hover ? 'pointer' : 'default',
      ...(hover && {
        '&:hover': {
          boxShadow: theme.shadows.lg,
          transform: 'translateY(-2px)',
        }
      }),
      ...style,
    }}
    {...props}
  >
    {children}
  </div>
)

// 🔘 Modern Button Component
export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  ...props
}) => {
  const variants = {
    primary: {
      background: theme.colors.primary,
      color: theme.colors.white,
      border: 'none',
      '&:hover': { background: theme.colors.primaryDark },
    },
    secondary: {
      background: theme.colors.light,
      color: theme.colors.primary,
      border: `2px solid ${theme.colors.primary}`,
      '&:hover': { background: theme.colors.lightBg },
    },
    success: {
      background: theme.colors.success,
      color: theme.colors.white,
      border: 'none',
      '&:hover': { background: theme.colors.success + 'E0' },
    },
    danger: {
      background: theme.colors.error,
      color: theme.colors.white,
      border: 'none',
      '&:hover': { background: theme.colors.error + 'E0' },
    },
  }

  const sizes = {
    sm: { padding: '6px 12px', fontSize: theme.typography.sizes.sm },
    md: { padding: '10px 16px', fontSize: theme.typography.sizes.base },
    lg: { padding: '12px 24px', fontSize: theme.typography.sizes.lg },
  }

  return (
    <button
      style={{
        fontFamily: theme.typography.fonts.primary,
        fontWeight: theme.typography.weights.semibold,
        borderRadius: theme.radius.md,
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: `all ${theme.transitions.fast}`,
        display: 'inline-flex',
        alignItems: 'center',
        gap: theme.spacing.sm,
        opacity: disabled ? 0.5 : 1,
        ...variants[variant],
        ...sizes[size],
      }}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? '⏳' : icon}
      {children}
    </button>
  )
}

// 📊 Modern Stat Card
export const StatCard = ({ icon, label, value, color = 'primary', gradient = false }) => (
  <div
    style={{
      background: gradient
        ? theme.gradients[color] || theme.gradients.primary
        : theme.colors.white,
      color: gradient ? theme.colors.white : theme.colors.text.primary,
      padding: theme.spacing.xl,
      borderRadius: theme.radius.lg,
      border: gradient ? 'none' : `1px solid ${theme.colors.border}`,
      boxShadow: theme.shadows.md,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      textAlign: 'center',
      gap: theme.spacing.md,
    }}
  >
    <div
      style={{
        fontSize: '32px',
        background: gradient ? 'rgba(255,255,255,0.2)' : theme.colors[color] + '15',
        width: '60px',
        height: '60px',
        borderRadius: theme.radius.lg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {icon}
    </div>
    <div>
      <div style={{ fontSize: theme.typography.sizes.sm, opacity: 0.8, marginBottom: '4px' }}>
        {label}
      </div>
      <div
        style={{
          fontSize: theme.typography.sizes['3xl'],
          fontWeight: theme.typography.weights.bold,
        }}
      >
        {value}
      </div>
    </div>
  </div>
)

// 🎨 Progress Bar
export const ProgressBar = ({ value, max = 100, color = 'primary', label }) => {
  const percentage = (value / max) * 100
  const colorValue = theme.colors[color] || theme.colors.primary

  return (
    <div style={{ width: '100%' }}>
      {label && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '6px',
            fontSize: theme.typography.sizes.sm,
          }}
        >
          <span>{label}</span>
          <span style={{ fontWeight: theme.typography.weights.bold }}>
            {percentage.toFixed(0)}%
          </span>
        </div>
      )}
      <div
        style={{
          width: '100%',
          height: '8px',
          background: theme.colors.light,
          borderRadius: theme.radius.full,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${percentage}%`,
            background: colorValue,
            transition: `width ${theme.transitions.base}`,
          }}
        />
      </div>
    </div>
  )
}

// 🏷️ Badge Component
export const Badge = ({ children, variant = 'primary', size = 'sm' }) => {
  const sizes = {
    sm: { padding: '2px 8px', fontSize: theme.typography.sizes.xs },
    md: { padding: '4px 12px', fontSize: theme.typography.sizes.sm },
    lg: { padding: '6px 16px', fontSize: theme.typography.sizes.base },
  }

  const variants = {
    primary: { background: theme.colors.primary + '20', color: theme.colors.primary },
    success: { background: theme.colors.success + '20', color: theme.colors.success },
    warning: { background: theme.colors.warning + '20', color: theme.colors.warning },
    error: { background: theme.colors.error + '20', color: theme.colors.error },
  }

  return (
    <span
      style={{
        display: 'inline-block',
        borderRadius: theme.radius.full,
        fontWeight: theme.typography.weights.semibold,
        ...variants[variant],
        ...sizes[size],
      }}
    >
      {children}
    </span>
  )
}

// 📱 Responsive Grid
export const Grid = ({ children, columns = 3, gap = 'lg', style = {} }) => (
  <div
    style={{
      display: 'grid',
      gridTemplateColumns: `repeat(auto-fit, minmax(300px, 1fr))`,
      gap: theme.spacing[gap],
      ...style,
    }}
  >
    {children}
  </div>
)

// 🔔 Toast/Alert Component
export const Alert = ({ type = 'info', message, icon = '✓' }) => {
  const types = {
    info: { bg: '#E3F2FD', border: '#2196F3', text: '#1976D2' },
    success: { bg: '#E8F5E9', border: '#4CAF50', text: '#388E3C' },
    warning: { bg: '#FFF3E0', border: '#FF9800', text: '#E65100' },
    error: { bg: '#FFEBEE', border: '#F44336', text: '#C62828' },
  }

  const config = types[type]

  return (
    <div
      style={{
        background: config.bg,
        border: `2px solid ${config.border}`,
        borderRadius: theme.radius.md,
        padding: theme.spacing.md,
        display: 'flex',
        gap: theme.spacing.md,
        alignItems: 'center',
        color: config.text,
        fontSize: theme.typography.sizes.sm,
      }}
    >
      <span style={{ fontSize: '18px' }}>{icon}</span>
      <span>{message}</span>
    </div>
  )
}

// 📋 List Item
export const ListItem = ({ icon, title, subtitle, action, ...props }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: theme.spacing.md,
      borderBottom: `1px solid ${theme.colors.border}`,
      '&:last-child': { borderBottom: 'none' },
    }}
    {...props}
  >
    <div style={{ display: 'flex', gap: theme.spacing.md, alignItems: 'center' }}>
      {icon && (
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: theme.radius.md,
            background: theme.colors.light,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px',
          }}
        >
          {icon}
        </div>
      )}
      <div>
        <div style={{ fontWeight: theme.typography.weights.semibold }}>
          {title}
        </div>
        {subtitle && (
          <div style={{ fontSize: theme.typography.sizes.sm, color: theme.colors.text.secondary }}>
            {subtitle}
          </div>
        )}
      </div>
    </div>
    {action && <div>{action}</div>}
  </div>
)

export default {
  Card,
  Button,
  StatCard,
  ProgressBar,
  Badge,
  Grid,
  Alert,
  ListItem,
}
