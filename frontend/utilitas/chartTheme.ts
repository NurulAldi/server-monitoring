// Tesla-inspired minimalist chart theme for Recharts
export const teslaChartTheme = {
  // Colors
  colors: {
    primary: '#eeeeee',      // High contrast white
    secondary: '#b8babf',    // Neutral 400
    accent: '#3e6ae1',       // Accent blue
    success: '#00d448',      // Success green
    warning: '#f7c948',      // Warning amber
    critical: '#e31937',     // Accent red
    grid: '#393c41',         // Neutral 700 (subtle)
    background: '#171a20',   // Deep grey
  },

  // Grid configuration (minimal)
  grid: {
    strokeDasharray: '3 3',
    stroke: '#393c41',       // Very subtle
    strokeOpacity: 0.3,
  },

  // Axis configuration
  axis: {
    stroke: '#393c41',
    tick: {
      fill: '#8a8d91',       // Neutral 500
      fontSize: 12,
      fontWeight: 500,
    },
    axisLine: {
      stroke: '#393c41',
      strokeWidth: 1,
    },
  },

  // Tooltip styling
  tooltip: {
    contentStyle: {
      backgroundColor: '#171a20',
      border: '1px solid #393c41',
      borderRadius: '8px',
      padding: '12px',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
    },
    labelStyle: {
      color: '#eeeeee',
      fontWeight: 600,
      marginBottom: '4px',
    },
    itemStyle: {
      color: '#b8babf',
      fontSize: '14px',
    },
  },

  // Legend styling
  legend: {
    wrapperStyle: {
      paddingTop: '16px',
    },
    iconType: 'circle' as const,
  },
}

// Status-based colors (for thresholds)
export const getStatusColor = (value: number, warningThreshold: number, criticalThreshold: number) => {
  if (value >= criticalThreshold) return teslaChartTheme.colors.critical
  if (value >= warningThreshold) return teslaChartTheme.colors.warning
  return teslaChartTheme.colors.success
}

// Gradient definitions for area charts
export const chartGradients = {
  success: {
    id: 'successGradient',
    color1: '#00d448',
    color2: '#00d44820',
  },
  warning: {
    id: 'warningGradient',
    color1: '#f7c948',
    color2: '#f7c94820',
  },
  critical: {
    id: 'criticalGradient',
    color1: '#e31937',
    color2: '#e3193720',
  },
  primary: {
    id: 'primaryGradient',
    color1: '#3e6ae1',
    color2: '#3e6ae120',
  },
}
