import Highcharts from 'highcharts'
import { Retool } from '@tryretool/custom-component-support'
import { type FC, useEffect, useRef, useCallback } from 'react'

interface SeriesConfig {
  name: string
  data: number[]
  color?: string
  valuePrefix?: string
  valueSuffix?: string
}

export const PolarChart: FC = () => {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<Highcharts.Chart | null>(null)

  // Basic chart states
  const [title, setTitle] = Retool.useStateString({ 
    name: 'title',
    initialValue: 'Budget vs spending'
  })
  const [titleX, setTitleX] = Retool.useStateNumber({ 
    name: 'titleX',
    initialValue: -80,
    description: 'X position of the title'
  })
  const [categories, setCategories] = Retool.useStateArray({ 
    name: 'categories',
    initialValue: ['Sales', 'Marketing', 'Development', 'Customer Support', 'Information Technology', 'Administration']
  })
  const [width, setWidth] = Retool.useStateNumber({ name: 'width' })
  const [height, setHeight] = Retool.useStateNumber({ name: 'height' })
  
  // Chart specific states
  const [paneSize, setPaneSize] = Retool.useStateString({ 
    name: 'paneSize',
    initialValue: '80%',
    description: 'Size of the radar chart pane as percentage'
  })

  // Series configuration
  const [seriesConfig, setSeriesConfig] = Retool.useStateArray({
    name: 'seriesConfig',
    description: 'Array of series configurations. Each item should have: name, data, color (optional), valuePrefix (optional), valueSuffix (optional)',
    initialValue: [{
      name: 'Allocated Budget',
      data: [43000, 19000, 60000, 35000, 17000, 10000],
      color: '#7cb5ec',
      valuePrefix: '$'
    }, {
      name: 'Actual Spending',
      data: [50000, 39000, 42000, 31000, 26000, 14000],
      color: '#434348',
      valuePrefix: '$'
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
        'data' in item
      ) {
        return {
          name: String(item.name || ''),
          data: Array.isArray(item.data) ? item.data.map(val => Number(val || 0)) : [],
          color: String(item.color || undefined),
          valuePrefix: item.valuePrefix ? String(item.valuePrefix) : undefined,
          valueSuffix: item.valueSuffix ? String(item.valueSuffix) : undefined
        } as SeriesConfig
      }
      return null
    }).filter((item): item is SeriesConfig => item !== null)

    return {
      chart: {
        polar: true,
        type: 'area',
        width: width,
        height: height
      },
      title: {
        text: title,
        x: titleX
      },
      pane: {
        size: paneSize
      },
      xAxis: {
        categories: (categories || []).map(String),
        tickmarkPlacement: 'on',
        lineWidth: 0
      },
      yAxis: {
        gridLineInterpolation: 'polygon',
        lineWidth: 0,
        min: 0
      },
      tooltip: {
        shared: true,
        pointFormat: '<span style="color:{series.color}">{series.name}: <b>' +
            '{point.y:,.3f}</b><br/>'      },
      legend: {
        align: 'right',
        verticalAlign: 'middle',
        layout: 'vertical'
      },
      series: parsedSeriesConfig.map(series => ({
        name: series.name,
        data: series.data.map(value => ({
          y: value,
          valuePrefix: series.valuePrefix,
          valueSuffix: series.valueSuffix
        })),
        pointPlacement: 'on',
        color: series.color
      })),
      responsive: {
        rules: [{
          condition: {
            maxWidth: 500
          },
          chartOptions: {
            title: {
              x: 0
            },
            legend: {
              align: 'center',
              verticalAlign: 'bottom',
              layout: 'horizontal'
            },
            pane: {
              size: '70%'
            }
          }
        }]
      },
      credits: {
        enabled: false
      }
    }
  }, [
    width,
    height,
    title,
    titleX,
    paneSize,
    categories,
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