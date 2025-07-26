import Highcharts from 'highcharts'
import { Retool } from '@tryretool/custom-component-support'
import { type FC, useEffect, useRef, useCallback } from 'react'
import 'highcharts/highcharts-more'
import 'highcharts/modules/solid-gauge'

export const KPIGauge: FC = () => {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<Highcharts.Chart | null>(null)

  const [title, setTitle] = Retool.useStateString({ 
    name: 'title',
    initialValue: 'Multiple KPI gauge'
  })
  const [width, setWidth] = Retool.useStateNumber({ name: 'width' })
  const [height, setHeight] = Retool.useStateNumber({ name: 'height' })
  
  // Colors array for the KPI gauges
  const [colors, setColors] = Retool.useStateArray({ 
    name: 'colors',
    initialValue: ['#7cb5ec', '#434348', '#90ed7d', '#f7a35c', '#8085e9']
  })
  
  // KPI Series Data
  const [kpiData, setKpiData] = Retool.useStateArray({ 
    name: 'kpiData',
    initialValue: [
      {
        name: 'Conversion',
        value: 80,
        outerRadius: '112%',
        innerRadius: '88%',
      },
      {
        name: 'Engagement',
        value: 65,
        outerRadius: '87%',
        innerRadius: '63%',
      },
      {
        name: 'Feedback',
        value: 50,
        outerRadius: '62%',
        innerRadius: '38%',
      }
    ]
  })

  // Prepare track colors for the background
  const getTrackColors = useCallback(() => {
    return (colors || []).map(color =>
      `color-mix(in srgb, ${color} 30%, transparent)`
    )
  }, [colors])

  // Prepare chart options
  const getChartOptions = useCallback((): Highcharts.Options => {
    const trackColors = getTrackColors()
    
    // Calculate responsive font sizes based on chart dimensions
    const minDimension = Math.min(width || 400, height || 400)
    const baseFontSize = Math.max(12, minDimension * 0.04) // Base font size scales with chart size
    const valueFontSize = Math.max(16, minDimension * 0.08) // Value font size is larger
    
    // Prepare pane backgrounds
    const paneBackgrounds = (kpiData || []).map((kpi: any, index: number) => ({
      outerRadius: kpi.outerRadius || '100%',
      innerRadius: kpi.innerRadius || '80%',
      backgroundColor: trackColors[index] || 'transparent',
      borderWidth: 0
    }))

    // Prepare series data
    const series = (kpiData || []).map((kpi: any, index: number) => ({
      type: 'solidgauge' as const,
      name: kpi.name || `KPI ${index + 1}`,
      data: [{
        color: String(colors?.[index] || '#7cb5ec'),
        radius: kpi.outerRadius || '100%',
        innerRadius: kpi.innerRadius || '80%',
        y: Number(kpi.value || 0)
      }],
      custom: {
        icon: kpi.icon || 'circle',
        iconColor: kpi.iconColor || '#303030'
      },
      showInLegend: true
    }))

    return {
      chart: {
        type: 'solidgauge',
        width: width,
        height: height
      },

      title: {
        text: title,
        style: {
          fontSize: '24px'
        }
      },

      tooltip: {
        backgroundColor: 'none',
        fixed: true,
        useHTML: true,
        pointFormat: `<div style="text-align: center; line-height: 1.2;">
          <div style="font-size: ${baseFontSize}px; margin-bottom: 4px;">{series.name}</div>
          <div style="font-size: ${valueFontSize}px; color: {point.color}; font-weight: bold;">{point.y}%</div>
        </div>`,
        position: {
          align: 'center',
          verticalAlign: 'middle'
        },
        style: {
          fontSize: `${baseFontSize}px`
        }
      },

      legend: {
        useHTML: true,
        symbolWidth: 0,
        symbolHeight: 0,
        labelFormatter: function() {
            const series = this as any;
            const seriesIndex = series.index;
            const color = colors?.[seriesIndex] || '#000000';
            return '<span>' +
                   '<span style="display: inline-block; width: 10px; height: 10px; background-color: ' + color + '; margin-right: 5px; border-radius: 5px;"></span>' +
                   this.name + '</span>';
        }
      },

      pane: {
        startAngle: 0,
        endAngle: 360,
        background: paneBackgrounds
      },

      yAxis: {
        min: 0,
        max: 100,
        lineWidth: 0,
        tickPositions: []
      },

      plotOptions: {
        solidgauge: {
          dataLabels: {
            enabled: false
          },
          linecap: 'round',
          stickyTracking: false,
          rounded: true
        }
      },

      credits: {
        enabled: false
      },

      series: series
    }
  }, [title, width, height, JSON.stringify(kpiData), JSON.stringify(colors), getTrackColors])

  useEffect(() => {
    if (!chartContainerRef.current) return

    const options = getChartOptions()

    if (!chartRef.current) {
      // Create new chart if it doesn't exist
      chartRef.current = Highcharts.chart(chartContainerRef.current, options)
    } else {
      // Update existing chart
      chartRef.current.update(options, true)
    }

    // Cleanup function
    return () => {
      if (chartRef.current) {
        chartRef.current.destroy()
        chartRef.current = null
      }
    }
  }, [JSON.stringify(getChartOptions())])

  return (
    <div
      ref={chartContainerRef}
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100%'
      }}
    />
  )
} 