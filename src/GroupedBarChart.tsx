import Highcharts from 'highcharts'
import { Retool } from '@tryretool/custom-component-support'
import { type FC, useEffect, useRef, useCallback } from 'react'

export const GroupedBarChart: FC = () => {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<Highcharts.Chart | null>(null)

  // Basic chart configuration
  const [title, setTitle] = Retool.useStateString({ name: 'title' })
  const [subtitle, setSubtitle] = Retool.useStateString({ name: 'subtitle' })
  const [width, setWidth] = Retool.useStateNumber({ name: 'width' })
  const [height, setHeight] = Retool.useStateNumber({ name: 'height' })
  const [showLegend, setShowLegend] = Retool.useStateBoolean({
    name: 'showLegend',
    initialValue: true
  })

  // X-axis configuration
  const [categories, setCategories] = Retool.useStateArray({
    name: 'categories'
  })
  const [xAxisTitle, setXAxisTitle] = Retool.useStateString({
    name: 'xAxisTitle'
  })

  // Primary Y-axis configuration
  const [primaryYAxisTitle, setPrimaryYAxisTitle] = Retool.useStateString({
    name: 'primaryYAxisTitle'
  })
  const [primaryYAxisMin, setPrimaryYAxisMin] = Retool.useStateNumber({
    name: 'primaryYAxisMin'
  })
  const [primaryYAxisMax, setPrimaryYAxisMax] = Retool.useStateNumber({
    name: 'primaryYAxisMax'
  })

  // Secondary Y-axis configuration
  const [secondaryYAxisTitle, setSecondaryYAxisTitle] = Retool.useStateString({
    name: 'secondaryYAxisTitle'
  })
  const [secondaryYAxisMin, setSecondaryYAxisMin] = Retool.useStateNumber({
    name: 'secondaryYAxisMin'
  })
  const [secondaryYAxisMax, setSecondaryYAxisMax] = Retool.useStateNumber({
    name: 'secondaryYAxisMax'
  })

  // Series data - expecting array of series objects with name, data, and yAxis properties
  const [seriesData, setSeriesData] = Retool.useStateArray({
    name: 'seriesData'
  })

  // Colors for series
  const [colors, setColors] = Retool.useStateArray({ name: 'colors' })

  // Tooltip configuration
  const [tooltipSuffix, setTooltipSuffix] = Retool.useStateString({
    name: 'tooltipSuffix'
  })
  const [sharedTooltip, setSharedTooltip] = Retool.useStateBoolean({
    name: 'sharedTooltip',
    initialValue: true
  })

  // Plot options
  const [pointPadding, setPointPadding] = Retool.useStateNumber({
    name: 'pointPadding',
    initialValue: 0.2
  })
  const [borderWidth, setBorderWidth] = Retool.useStateNumber({
    name: 'borderWidth',
    initialValue: 0
  })

  // Data labels
  const [showDataLabels, setShowDataLabels] = Retool.useStateBoolean({
    name: 'showDataLabels',
    initialValue: false
  })

  // Prepare series data with colors and y-axis assignment
  const prepareSeriesData = useCallback(() => {
    if (!Array.isArray(seriesData) || seriesData.length === 0) {
      return []
    }

    return seriesData.map((series: any, index: number) => ({
      name: series.name || `Series ${index + 1}`,
      data: series.data || [],
      yAxis: series.yAxis || 0, // Default to primary axis
      color: series.color || colors[index % colors.length],
      type: 'column' as const
    }))
  }, [JSON.stringify(seriesData), JSON.stringify(colors)])

  // Memoize chart options
  const getChartOptions = useCallback(
    (): Highcharts.Options => ({
      chart: {
        type: 'column',
        reflow: true,
        width: width,
        height: height
      },
      title: {
        text: title,
        align: 'left'
      },
      subtitle: {
        text: subtitle,
        align: 'left'
      },
      xAxis: {
        categories: categories as string[],
        crosshair: true,
        title: {
          text: xAxisTitle
        },
        accessibility: {
          description: 'Categories'
        }
      },
      yAxis: [
        {
          // Primary yAxis
          type: 'logarithmic',
          title: {
            text: primaryYAxisTitle
          }
        },
        {
          // Secondary yAxis
          title: {
            text: secondaryYAxisTitle
          },
          opposite: true // Put it on the right side
        }
      ],
      tooltip: {
        shared: sharedTooltip,
        valueSuffix: tooltipSuffix || ''
      },
      legend: {
        enabled: showLegend,
        align: 'center',
        verticalAlign: 'bottom',
        layout: 'horizontal'
      },
      plotOptions: {
        column: {
          pointPadding: pointPadding,
          borderWidth: borderWidth,
          dataLabels: {
            enabled: showDataLabels
          }
        }
      },
      series: prepareSeriesData(),
      credits: {
        enabled: false
      }
    }),
    [
      width,
      height,
      title,
      subtitle,
      JSON.stringify(categories),
      xAxisTitle,
      primaryYAxisTitle,
      secondaryYAxisTitle,
      tooltipSuffix,
      sharedTooltip,
      showLegend,
      pointPadding,
      borderWidth,
      showDataLabels,
      JSON.stringify(prepareSeriesData())
    ]
  )

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

  return <div ref={chartContainerRef} />
}
