import Highcharts from 'highcharts'
import { Retool } from '@tryretool/custom-component-support'
import { type FC, useEffect, useRef, useCallback } from 'react'

interface SeriesData {
  [key: string]: number[]
}

interface ChartData {
  categories: string[]
  series: SeriesData
}

export const BarChartV2: FC = () => {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<Highcharts.Chart | null>(null)

  const [xAxisTitle, setXAxisTitle] = Retool.useStateString({ 
    name: 'xAxisTitle',
    initialValue: 'X Axis Title'
  })
  const [yAxisTitle, setYAxisTitle] = Retool.useStateString({ 
    name: 'yAxisTitle',
    initialValue: 'Y Axis Title'
  })
  const [chartData, setChartData] = Retool.useStateObject<ChartData>({ 
    name: 'chartData',
    initialValue: {
      categories: ['Africa', 'America', 'Asia', 'Europe'],
      series: {
        '1990': [632, 727, 3202, 721],
        '2000': [814, 841, 3714, 726],
        '2021': [1393, 1031, 4695, 745]
      }
    }
  })
  const [selectedSeries, setSelectedSeries] = Retool.useStateString({ 
    name: 'selectedSeries',
    initialValue: '1990'
  })
  const [title, setTitle] = Retool.useStateString({ 
    name: 'title',
    initialValue: 'Dynamic Bar Chart'
  })
  const [subtitle, setSubtitle] = Retool.useStateString({ 
    name: 'subtitle',
    initialValue: 'Data sorted by selected series'
  })
  const [width, setWidth] = Retool.useStateNumber({ name: 'width' })
  const [height, setHeight] = Retool.useStateNumber({ 
    name: 'height',
    initialValue: 500
  })
  const [showDataLabels, setShowDataLabels] = Retool.useStateBoolean({ 
    name: 'showDataLabels',
    initialValue: true
  })
  const [sortBySelectedSeries, setSortBySelectedSeries] = Retool.useStateBoolean({ 
    name: 'sortBySelectedSeries',
    initialValue: true
  })
  const [enableSeriesControls, setEnableSeriesControls] = Retool.useStateBoolean({ 
    name: 'enableSeriesControls',
    initialValue: true
  })
  const [colors, setColors] = Retool.useStateArray({ name: 'colors' })
  const [itemsPerPage, setItemsPerPage] = Retool.useStateNumber({ 
    name: 'itemsPerPage',
    initialValue: 10
  })
  const [enablePagination, setEnablePagination] = Retool.useStateBoolean({ 
    name: 'enablePagination',
    initialValue: true
  })
  const [currentPage, setCurrentPage] = Retool.useStateNumber({ 
    name: 'currentPage',
    initialValue: 1
  })

  const getSeriesColor = useCallback((seriesKey: string, index: number) => {
    if (colors && colors.length > 0) {
      return colors[index % colors.length]
    }
    
    // Fallback colors if none provided
    const defaultColors = [
      '#007bff', '#28a745', '#dc3545', '#ffc107', '#17a2b8', 
      '#6f42c1', '#fd7e14', '#e83e8c', '#20c997'
    ]
    
    return defaultColors[index % defaultColors.length]
  }, [colors])

  const getSortedData = useCallback((seriesKey: string) => {
    if (!chartData.categories || !chartData.series || !chartData.series[seriesKey]) {
      return {
        categories: [],
        sortedData: [],
        allSeriesData: {},
        totalItems: 0,
        totalPages: 1,
        shouldPaginate: false
      }
    }

    const categories = [...chartData.categories]
    const seriesData = [...chartData.series[seriesKey]]
    
    const combined = categories.map((cat, index) => ({
      category: cat,
      value: seriesData[index],
      ...Object.keys(chartData.series).reduce((acc, key) => ({
        ...acc,
        [`data${key}`]: chartData.series[key][index]
      }), {})
    }))
    
    if (sortBySelectedSeries) {
      combined.sort((a, b) => b.value - a.value)
    }

    const totalItems = combined.length
    const shouldPaginate = enablePagination && totalItems > itemsPerPage
    const totalPages = shouldPaginate ? Math.ceil(totalItems / itemsPerPage) : 1
    
    // Get current page data
    let paginatedData = combined
    if (shouldPaginate) {
      const startIndex = (currentPage - 1) * itemsPerPage
      const endIndex = startIndex + itemsPerPage
      paginatedData = combined.slice(startIndex, endIndex)
    }
    
    return {
      categories: paginatedData.map(item => item.category),
      sortedData: paginatedData.map(item => item.value),
      allSeriesData: Object.keys(chartData.series).reduce((acc, key) => ({
        ...acc,
        [key]: paginatedData.map(item => (item as any)[`data${key}`])
      }), {} as SeriesData),
      totalItems,
      totalPages,
      shouldPaginate
    }
  }, [chartData, sortBySelectedSeries, enablePagination, itemsPerPage, currentPage])

  const getChartOptions = useCallback((): Highcharts.Options => {
    const sortedData = getSortedData(selectedSeries)
    const seriesKeys = Object.keys(chartData.series || {})
    const seriesIndex = seriesKeys.indexOf(selectedSeries)
    const seriesColor = getSeriesColor(selectedSeries, seriesIndex)

    return {
      chart: {
        type: 'bar',
        backgroundColor: 'transparent',
        animation: {
          duration: 800,
          easing: 'easeOutQuart'
        },
        width: width || undefined,
        height: height || 500
      },
      title: {
        text: `${title}${selectedSeries ? ` - ${selectedSeries}` : ''}`,
        style: {
          fontSize: '20px',
          fontWeight: 'bold',
          color: '#333'
        }
      },
      subtitle: {
        text: subtitle,
        style: {
          color: '#666'
        }
      },
      xAxis: {
        categories: sortedData.categories,
        title: {
          text: xAxisTitle
        },
        lineWidth: 0,
        labels: {
          style: {
            fontSize: '12px',
            fontWeight: 'bold'
          }
        }
      },
      yAxis: {
        min: 0,
        title: {
          text: yAxisTitle,
          align: 'high',
          style: {
            color: '#666'
          }
        },
        labels: {
          overflow: 'justify'
        },
      },
      tooltip: {
        valueSuffix: '',
        backgroundColor: 'rgba(0,0,0,0.8)',
        style: {
          color: 'white'
        },
        borderRadius: 8,
        shadow: true
      },
      plotOptions: {
        bar: {
          borderRadius: 4,
          dataLabels: {
            enabled: showDataLabels,
            style: {
              fontWeight: 'bold',
              color: 'white',
              textOutline: '1px contrast'
            }
          },
          groupPadding: 0.1,
          pointPadding: 0.05
        },
        series: {
          animation: {
            duration: 1000
          }
        }
      },
      legend: {
        enabled: false
      },
      credits: {
        enabled: false
      },
      series: [{
        type: 'bar',
        name: selectedSeries,
        data: sortedData.sortedData,
        color: seriesColor
      }]
    }
  }, [
    selectedSeries,
    title,
    subtitle,
    width,
    height,
    showDataLabels,
    getSortedData,
    getSeriesColor,
    chartData.series
  ])

  const createSeriesControls = useCallback(() => {
    if (!enableSeriesControls || !chartData.series) return null

    const seriesKeys = Object.keys(chartData.series).sort()
    
    const controlsHtml = `
      <div style="margin-bottom: 1rem; text-align: center;">
        <div style="display: inline-flex; border-radius: 6px; border: 1px solid #e2e8f0; overflow: hidden;">
          ${seriesKeys.map((key, index) => `
            <button 
              type="button"
              class="series-btn" 
              data-series="${key}"
              style="
                padding: 8px 16px;
                border: none;
                background: ${key === selectedSeries ? '#0f172a' : '#ffffff'};
                color: ${key === selectedSeries ? '#ffffff' : '#0f172a'};
                font-size: 14px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s ease;
                border-right: ${index < seriesKeys.length - 1 ? '1px solid #e2e8f0' : 'none'};
              "
              onmouseover="
                if (this.getAttribute('data-series') !== '${selectedSeries}') {
                  this.style.background = '#f8fafc';
                }
              "
              onmouseout="
                if (this.getAttribute('data-series') !== '${selectedSeries}') {
                  this.style.background = '#ffffff';
                }
              "
            >
              ${key}
            </button>
          `).join('')}
        </div>
      </div>
    `
    
    return controlsHtml
  }, [enableSeriesControls, chartData.series, selectedSeries])

  const createPaginationControls = useCallback(() => {
    const sortedData = getSortedData(selectedSeries)
    
    if (!sortedData.shouldPaginate) return null

    const { totalPages } = sortedData
    const maxVisibleButtons = 5
    const startPage = Math.max(1, currentPage - Math.floor(maxVisibleButtons / 2))
    const endPage = Math.min(totalPages, startPage + maxVisibleButtons - 1)
    
    const pages = []
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i)
    }

    const paginationHtml = `
      <div style="margin-top: 0.5rem; text-align: center;">
        <div style="display: inline-flex; align-items: center; gap: 2px;">
          <button 
            type="button"
            class="pagination-btn" 
            data-page="${currentPage - 1}"
            ${currentPage === 1 ? 'disabled' : ''}
            style="
              padding: 4px 8px;
              border: 1px solid #e2e8f0;
              border-radius: 4px;
              background: ${currentPage === 1 ? '#f8fafc' : '#ffffff'};
              color: ${currentPage === 1 ? '#94a3b8' : '#0f172a'};
              font-size: 12px;
              font-weight: 500;
              cursor: ${currentPage === 1 ? 'not-allowed' : 'pointer'};
              transition: all 0.2s ease;
            "
            onmouseover="
              if (!this.disabled) {
                this.style.background = '#f1f5f9';
              }
            "
            onmouseout="
              if (!this.disabled) {
                this.style.background = '#ffffff';
              }
            "
          >
            ←
          </button>
          
          ${pages.map(page => `
            <button 
              type="button"
              class="pagination-btn" 
              data-page="${page}"
              style="
                padding: 4px 8px;
                border: 1px solid #e2e8f0;
                border-radius: 4px;
                background: ${page === currentPage ? '#0f172a' : '#ffffff'};
                color: ${page === currentPage ? '#ffffff' : '#0f172a'};
                font-size: 12px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s ease;
                min-width: 28px;
              "
              onmouseover="
                if (${page} !== ${currentPage}) {
                  this.style.background = '#f1f5f9';
                }
              "
              onmouseout="
                if (${page} !== ${currentPage}) {
                  this.style.background = '#ffffff';
                }
              "
            >
              ${page}
            </button>
          `).join('')}
          
          <button 
            type="button"
            class="pagination-btn" 
            data-page="${currentPage + 1}"
            ${currentPage === totalPages ? 'disabled' : ''}
            style="
              padding: 4px 8px;
              border: 1px solid #e2e8f0;
              border-radius: 4px;
              background: ${currentPage === totalPages ? '#f8fafc' : '#ffffff'};
              color: ${currentPage === totalPages ? '#94a3b8' : '#0f172a'};
              font-size: 12px;
              font-weight: 500;
              cursor: ${currentPage === totalPages ? 'not-allowed' : 'pointer'};
              transition: all 0.2s ease;
            "
            onmouseover="
              if (!this.disabled) {
                this.style.background = '#f1f5f9';
              }
            "
            onmouseout="
              if (!this.disabled) {
                this.style.background = '#ffffff';
              }
            "
          >
            →
          </button>
        </div>
        
        <div style="margin-top: 4px; color: #64748b; font-size: 10px;">
          Showing ${(currentPage - 1) * itemsPerPage + 1}-${Math.min(currentPage * itemsPerPage, sortedData.totalItems)} of ${sortedData.totalItems} items
        </div>
      </div>
    `
    
    return paginationHtml
  }, [selectedSeries, currentPage, itemsPerPage, getSortedData])

  useEffect(() => {
    if (!chartContainerRef.current) return

    const container = chartContainerRef.current
    const options = getChartOptions()

    const seriesControlsHtml = enableSeriesControls ? createSeriesControls() : ''
    const paginationControlsHtml = createPaginationControls() || ''
    
    container.innerHTML = `
      ${seriesControlsHtml}
      <div class="chart-area"></div>
      ${paginationControlsHtml}
    `
    
    const chartArea = container.querySelector('.chart-area') as HTMLDivElement
    if (chartArea) {
      if (!chartRef.current) {
        chartRef.current = Highcharts.chart(chartArea, options)
      } else {
        chartRef.current.update(options, true)
      }
    }

    // Add event listeners for series buttons
    if (enableSeriesControls) {
      const seriesButtons = container.querySelectorAll('.series-btn')
      seriesButtons.forEach(btn => {
        btn.addEventListener('click', function() {
          const series = (this as HTMLButtonElement).getAttribute('data-series')
          if (series) {
            setSelectedSeries(series)
            setCurrentPage(1) // Reset to first page when switching series
          }
        })
      })
    }

    // Add event listeners for pagination buttons
    const paginationButtons = container.querySelectorAll('.pagination-btn')
    paginationButtons.forEach(btn => {
      btn.addEventListener('click', function() {
        if (!(this as HTMLButtonElement).disabled) {
          const page = parseInt((this as HTMLButtonElement).getAttribute('data-page') || '1')
          setCurrentPage(page)
        }
      })
    })

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy()
        chartRef.current = null
      }
    }
  }, [
    JSON.stringify(getChartOptions()),
    enableSeriesControls,
    JSON.stringify(createSeriesControls()),
    JSON.stringify(createPaginationControls())
  ])

  return <div ref={chartContainerRef} />
}
