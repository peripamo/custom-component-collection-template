import Highcharts from 'highcharts'
import { Retool } from '@tryretool/custom-component-support'
import { type FC, useEffect, useRef, useCallback } from 'react'

interface SeriesConfig {
  name: string
  data: number[]
  color: string
  yAxis?: number
  valuePrefix?: string
  valueSuffix?: string
}

export const TargetColumnChart: FC = () => {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<Highcharts.Chart | null>(null)

  // Basic chart states
  const [title, setTitle] = Retool.useStateString({ name: 'title' })
  const [subtitle, setSubtitle] = Retool.useStateString({ name: 'subtitle' })
  const [categories, setCategories] = Retool.useStateArray({ name: 'categories' })
  const [width, setWidth] = Retool.useStateNumber({ name: 'width' })
  const [height, setHeight] = Retool.useStateNumber({ name: 'height' })
  
  // Axis titles
  const [leftAxisTitle, setLeftAxisTitle] = Retool.useStateString({ 
    name: 'leftAxisTitle',
    description: 'Title for the left Y-axis'
  })
  const [rightAxisTitle, setRightAxisTitle] = Retool.useStateString({ 
    name: 'rightAxisTitle',
    description: 'Title for the right Y-axis'
  })

  // Series configuration
  const [seriesConfig, setSeriesConfig] = Retool.useStateArray({
    name: 'seriesConfig',
    description: 'Array of series configurations. Each item should have: name, data, color, yAxis (optional), valuePrefix (optional), valueSuffix (optional)',
    initialValue: [{
      name: 'Series 1',
      data: [100, 200, 300],
      color: 'rgba(126,86,134,1)',
      yAxis: 0
    }, {
      name: 'Series 2',
      data: [150, 250, 350],
      color: 'rgba(186,60,61,.9)',
      yAxis: 1,
      valuePrefix: '$',
      valueSuffix: ' M'
    }]
  })

  // Memoize chart options
  const getChartOptions = useCallback((): Highcharts.Options => {
    // Parse series config from Retool state
    const parsedSeriesConfig = (seriesConfig || []).map(item => {
      if (
        typeof item === 'object' && 
        item !== null && 
        'name' in item && 
        'data' in item && 
        'color' in item
      ) {
        return {
          name: String(item.name || ''),
          data: Array.isArray(item.data) ? item.data.map(val => Number(val || 0)) : [],
          color: String(item.color || ''),
          yAxis: Number(item.yAxis || 0),
          valuePrefix: item.valuePrefix ? String(item.valuePrefix) : undefined,
          valueSuffix: item.valueSuffix ? String(item.valueSuffix) : undefined
        } as SeriesConfig
      }
      return null
    }).filter((item): item is SeriesConfig => item !== null)

    return {
      chart: {
        type: 'column',
        width: width,
        height: height
      },
      title: {
        text: title
      },
      subtitle: {
        text: subtitle
      },
      xAxis: {
        categories: (categories || []).map(String)
      },
      yAxis: [{
        min: 0,
        title: {
          text: leftAxisTitle
        }
      }, {
        title: {
          text: rightAxisTitle
        },
        opposite: true
      }],
      legend: {
        shadow: false
      },
      tooltip: {
        shared: true
      },
      plotOptions: {
        column: {
          grouping: false,
          shadow: false,
          borderWidth: 0
        }
      },
      series: parsedSeriesConfig.map((series, index) => {
        // Calculate which pair this series belongs to (0-based)
        const pairIndex = Math.floor(index / 2)
        // Calculate offset based on pair index
        const pairOffset = pairIndex * 0.3 // Increase spacing between pairs
        
        return {
          name: series.name,
          type: 'column',
          color: series.color,
          data: series.data.map(value => ({
            y: Number(value),
            ...(series.valuePrefix || series.valueSuffix ? {
              tooltip: {
                valuePrefix: series.valuePrefix,
                valueSuffix: series.valueSuffix
              }
            } : {})
          })),
          // Make even-numbered series wider (Series 1, 3, 5...)
          pointWidth: index % 2 === 0 ? 30 : 15,
          // Center columns within their pair
          pointPadding: 0.1,
          groupPadding: 0.05,
          // Apply offset based on pair index
          pointPlacement: pairOffset,
          yAxis: series.yAxis
        }
      }),
      credits: {
        enabled: false
      }
    }
  }, [
    width,
    height,
    title,
    subtitle,
    categories,
    leftAxisTitle,
    rightAxisTitle,
    JSON.stringify(seriesConfig)
  ])

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
  }, [JSON.stringify(getChartOptions())]) // Re-run effect only when memoized options change

  return <div ref={chartContainerRef} style={{ width: '100%', height: '100%' }} />
} 