'use client'

import { useEffect, useRef } from 'react'
import * as echarts from 'echarts'
import type { EChartsOption } from 'echarts'
import {
  sectorRiskMonthlyData,
  survivalRateWeeklyData,
  scoreDistributionData,
  concentrationData,
} from '@/lib/analyticsData'

// ECharts institutional color palette
const GTIXT_COLORS = {
  primary: '#00E5FF',
  deep: '#14B8A6',
  secondary: '#38BDF8',
  tertiary: '#0EA5E9',
  accent: '#22D3EE',
  surface: '#0F172A',
  dark: '#E2E8F0',
  grid: 'rgba(226, 232, 240, 0.08)',
  text: '#E2E8F0',
  textMuted: 'rgba(226, 232, 240, 0.72)',
}

// Common axis configuration
const institutionalAxisStyle = {
  axisLine: { lineStyle: { color: GTIXT_COLORS.grid } },
  axisTick: { show: false },
  splitLine: { lineStyle: { color: GTIXT_COLORS.grid, type: 'dashed' as const } },
  axisLabel: {
    color: GTIXT_COLORS.textMuted,
    fontSize: 11,
    fontFamily: 'Inter, system-ui, sans-serif',
  },
}

// Common tooltip configuration
const institutionalTooltip: EChartsOption['tooltip'] = {
  trigger: 'axis',
  backgroundColor: 'rgba(10, 26, 47, 0.82)',
  borderColor: 'rgba(226, 232, 240, 0.16)',
  borderWidth: 1,
  textStyle: {
    color: GTIXT_COLORS.text,
    fontSize: 12,
    fontFamily: 'Inter, system-ui, sans-serif',
  },
  padding: [10, 14],
  extraCssText: 'border-radius: 10px; box-shadow: 0 10px 30px rgba(0,0,0,0.28); backdrop-filter: blur(8px);',
}

// 1. SECTOR RISK INDEX CHART (Multi-line with zoom/pan)
export function SectorRiskChart() {
  const chartRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!chartRef.current) return

    const chart = echarts.init(chartRef.current)
    
    const option: EChartsOption = {
      backgroundColor: 'transparent',
      grid: {
        left: '3%',
        right: '4%',
        top: '12%',
        bottom: '15%',
        containLabel: true,
      },
      tooltip: {
        ...institutionalTooltip,
        formatter: (params: any) => {
          const date = params[0].axisValue
          let html = `<div style="font-weight:600;margin-bottom:6px;">${date}</div>`
          params.forEach((item: any) => {
            const color = item.color.colorStops ? item.color.colorStops[0].color : item.color
            html += `
              <div style="display:flex;justify-content:space-between;align-items:center;gap:16px;margin-bottom:3px;">
                <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${color};margin-right:8px;"></span>
                <span style="opacity:0.8;">${item.seriesName}</span>
                <span style="font-weight:600;color:${color};">${item.value.toFixed(1)}%</span>
              </div>
            `
          })
          return html
        },
      },
      legend: {
        data: ['Forex', 'Futures', 'Crypto', 'Indices'],
        top: '2%',
        textStyle: { color: GTIXT_COLORS.text, fontSize: 12 },
        icon: 'circle',
        itemGap: 20,
      },
      xAxis: {
        type: 'category' as const,
        data: sectorRiskMonthlyData.dates,
        ...institutionalAxisStyle,
      },
      yAxis: {
        type: 'value' as const,
        name: 'Risk Index (%)',
        nameTextStyle: { color: GTIXT_COLORS.textMuted, fontSize: 11 },
        min: 30,
        max: 85,
        ...institutionalAxisStyle,
      },
      dataZoom: [
        {
          type: 'inside',
          start: 70,
          end: 100,
          zoomOnMouseWheel: true,
          moveOnMouseMove: true,
        },
        {
          type: 'slider',
          start: 70,
          end: 100,
          height: 24,
          bottom: '3%',
          borderColor: 'rgba(255,255,255,0.08)',
          fillerColor: 'rgba(0, 172, 193, 0.16)',
          handleStyle: {
            color: GTIXT_COLORS.primary,
            borderColor: GTIXT_COLORS.deep,
          },
          dataBackground: {
            lineStyle: { color: GTIXT_COLORS.primary, opacity: 0.3 },
            areaStyle: { color: GTIXT_COLORS.primary, opacity: 0.1 },
          },
          textStyle: { color: GTIXT_COLORS.textMuted },
        },
      ],
      series: [
        {
          name: 'Forex',
          type: 'line',
          data: sectorRiskMonthlyData.forex,
          smooth: true,
          smoothMonotone: 'x',
          symbol: 'circle',
          symbolSize: 6,
          lineStyle: {
            width: 2.5,
            color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
              { offset: 0, color: GTIXT_COLORS.primary },
              { offset: 1, color: GTIXT_COLORS.secondary },
            ]),
          },
          itemStyle: { color: GTIXT_COLORS.primary, borderWidth: 2, borderColor: GTIXT_COLORS.surface },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(0, 172, 193, 0.22)' },
              { offset: 1, color: 'rgba(0, 172, 193, 0)' },
            ]),
          },
          emphasis: { focus: 'series' },
        },
        {
          name: 'Futures',
          type: 'line',
          data: sectorRiskMonthlyData.futures,
          smooth: true,
          smoothMonotone: 'x',
          symbol: 'circle',
          symbolSize: 6,
          lineStyle: {
            width: 2.5,
            color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
              { offset: 0, color: GTIXT_COLORS.secondary },
              { offset: 1, color: GTIXT_COLORS.tertiary },
            ]),
          },
          itemStyle: { color: GTIXT_COLORS.secondary, borderWidth: 2, borderColor: GTIXT_COLORS.surface },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(41, 182, 246, 0.18)' },
              { offset: 1, color: 'rgba(41, 182, 246, 0)' },
            ]),
          },
          emphasis: { focus: 'series' },
        },
        {
          name: 'Crypto',
          type: 'line',
          data: sectorRiskMonthlyData.crypto,
          smooth: true,
          smoothMonotone: 'x',
          symbol: 'circle',
          symbolSize: 6,
          lineStyle: {
            width: 3,
            color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
              { offset: 0, color: '#E53935' },
              { offset: 0.5, color: GTIXT_COLORS.primary },
              { offset: 1, color: GTIXT_COLORS.secondary },
            ]),
          },
          itemStyle: { color: GTIXT_COLORS.primary, borderWidth: 2, borderColor: GTIXT_COLORS.surface },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(0, 172, 193, 0.25)' },
              { offset: 1, color: 'rgba(0, 172, 193, 0)' },
            ]),
          },
          emphasis: { focus: 'series' },
          markLine: {
            silent: false,
            symbol: 'none',
            data: [
              {
                name: 'Crypto volatility spike',
                xAxis: '2024-11',
                label: {
                  formatter: 'Crypto volatility spike (Nov 2024)',
                  position: 'insideEndTop',
                  color: GTIXT_COLORS.deep,
                  fontSize: 11,
                  fontWeight: 500,
                },
                lineStyle: {
                  color: 'rgba(0, 131, 143, 0.45)',
                  type: 'dashed',
                  width: 1.5,
                },
              },
            ],
          },
        },
        {
          name: 'Indices',
          type: 'line',
          data: sectorRiskMonthlyData.indices,
          smooth: true,
          smoothMonotone: 'x',
          symbol: 'circle',
          symbolSize: 6,
          lineStyle: { width: 2, color: GTIXT_COLORS.accent },
          itemStyle: { color: GTIXT_COLORS.accent, borderWidth: 2, borderColor: GTIXT_COLORS.surface },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(124, 58, 237, 0.14)' },
              { offset: 1, color: 'rgba(124, 58, 237, 0)' },
            ]),
          },
          emphasis: { focus: 'series' },
        },
      ],
    }

    chart.setOption(option)

    const handleResize = () => chart.resize()
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      chart.dispose()
    }
  }, [])

  return <div ref={chartRef} style={{ width: '100%', height: 'clamp(260px, 42vh, 320px)' }} />
}

// 2. FIRM SURVIVAL RATE CHART (Area with confidence band)
export function SurvivalRateChart() {
  const chartRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!chartRef.current) return

    const chart = echarts.init(chartRef.current)

    const dates = survivalRateWeeklyData.map(d => d.date)
    const values = survivalRateWeeklyData.map(d => d.value)
    const lowerBand = survivalRateWeeklyData.map(d => d.lower)
    const upperBand = survivalRateWeeklyData.map(d => d.upper)
    
    const option: EChartsOption = {
      backgroundColor: 'transparent',
      grid: {
        left: '3%',
        right: '4%',
        top: '8%',
        bottom: '15%',
        containLabel: true,
      },
      tooltip: {
        ...institutionalTooltip,
        formatter: (params: any) => {
          const idx = params[0].dataIndex
          const data = survivalRateWeeklyData[idx]
          return `
            <div style="font-weight:600;margin-bottom:6px;">${data.date}</div>
            <div style="margin-bottom:4px;">
              <span style="opacity:0.7;">Survival Rate:</span>
              <span style="font-weight:600;color:${GTIXT_COLORS.primary};margin-left:8px;">${data.value.toFixed(1)}%</span>
            </div>
            <div style="font-size:10px;opacity:0.6;">
              Confidence: ${data.lower.toFixed(1)}% – ${data.upper.toFixed(1)}%
            </div>
          `
        },
      },
      xAxis: {
        type: 'category' as const,
        data: dates,
        ...institutionalAxisStyle,
        axisLabel: {
          ...institutionalAxisStyle.axisLabel,
          formatter: (value: string) => {
            // Show only year for clarity
            const match = value.match(/^(\d{4})-W/)
            return match ? match[1] : value
          },
        },
      },
      yAxis: {
        type: 'value' as const,
        name: 'Survival Rate (%)',
        nameTextStyle: { color: GTIXT_COLORS.textMuted, fontSize: 11 },
        min: 50,
        max: 72,
        ...institutionalAxisStyle,
      },
      dataZoom: [
        {
          type: 'inside',
          start: 80,
          end: 100,
        },
        {
          type: 'slider',
          start: 80,
          end: 100,
          height: 24,
          bottom: '3%',
          borderColor: 'rgba(38,50,56,0.12)',
          fillerColor: 'rgba(0, 172, 193, 0.14)',
          handleStyle: {
            color: GTIXT_COLORS.primary,
            borderColor: GTIXT_COLORS.deep,
          },
          textStyle: { color: GTIXT_COLORS.textMuted },
        },
      ],
      series: [
        {
          name: 'Confidence Upper',
          type: 'line',
          data: upperBand,
          lineStyle: { width: 0 },
          areaStyle: { color: 'rgba(148, 163, 184, 0)' },
          stack: 'confidence',
          symbol: 'none',
          silent: true,
        },
        {
          name: 'Confidence Band',
          type: 'line',
          data: upperBand.map((u, i) => u - lowerBand[i]),
          lineStyle: { width: 0 },
          areaStyle: { color: 'rgba(148, 163, 184, 0.18)' },
          stack: 'confidence',
          symbol: 'none',
          silent: true,
        },
        {
          name: 'Lower',
          type: 'line',
          data: lowerBand,
          lineStyle: { width: 0 },
          symbol: 'none',
          silent: true,
        },
        {
          name: 'Survival Rate',
          type: 'line',
          data: values,
          smooth: true,
          smoothMonotone: 'x',
          symbol: 'circle',
          symbolSize: 5,
          lineStyle: {
            width: 3,
            color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
              { offset: 0, color: GTIXT_COLORS.deep },
              { offset: 0.5, color: GTIXT_COLORS.primary },
              { offset: 1, color: GTIXT_COLORS.secondary },
            ]),
            shadowColor: 'rgba(0, 172, 193, 0.28)',
            shadowBlur: 8,
          },
          itemStyle: {
            color: GTIXT_COLORS.primary,
            borderWidth: 2,
            borderColor: GTIXT_COLORS.surface,
          },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(0, 172, 193, 0.24)' },
              { offset: 1, color: 'rgba(0, 172, 193, 0)' },
            ]),
          },
          markLine: {
            symbol: 'none',
            data: [
              {
                name: 'Consolidation',
                xAxis: '2023-W08',
                label: {
                  formatter: 'Prop firm consolidation (2023)',
                  position: 'insideStartBottom',
                  color: GTIXT_COLORS.deep,
                  fontSize: 11,
                },
                lineStyle: {
                  color: 'rgba(0, 131, 143, 0.42)',
                  type: 'dashed',
                  width: 1.5,
                },
              },
            ],
          },
        },
      ],
    }

    chart.setOption(option)

    const handleResize = () => chart.resize()
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      chart.dispose()
    }
  }, [])

  return <div ref={chartRef} style={{ width: '100%', height: 'clamp(260px, 42vh, 320px)' }} />
}

// 3. SCORE DISTRIBUTION CHART (Histogram + KDE curve)
export function ScoreDistributionChart() {
  const chartRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!chartRef.current) return

    const chart = echarts.init(chartRef.current)

    const { buckets, kdePoints } = scoreDistributionData
    
    const option: EChartsOption = {
      backgroundColor: 'transparent',
      grid: {
        left: '3%',
        right: '8%',
        top: '8%',
        bottom: '12%',
        containLabel: true,
      },
      tooltip: {
        ...institutionalTooltip,
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params: any) => {
          const bucket = params[0]
          let html = `<div style="font-weight:600;margin-bottom:6px;">Score ${bucket.axisValue}</div>`
          html += `<div><span style="opacity:0.7;">Firms:</span> <span style="font-weight:600;color:${GTIXT_COLORS.primary};margin-left:8px;">${bucket.value}</span></div>`
          if (params[1]) {
            html += `<div style="margin-top:4px;"><span style="opacity:0.7;">Density:</span> <span style="font-weight:600;color:${GTIXT_COLORS.secondary};margin-left:8px;">${params[1].value.toFixed(3)}</span></div>`
          }
          return html
        },
      },
      xAxis: {
        type: 'category' as const,
        data: buckets.map(b => b.range),
        ...institutionalAxisStyle,
        axisLabel: {
          ...institutionalAxisStyle.axisLabel,
          rotate: 0,
        },
      },
      yAxis: [
        {
          type: 'value' as const,
          name: 'Firms',
          nameTextStyle: { color: GTIXT_COLORS.textMuted, fontSize: 11 },
          ...institutionalAxisStyle,
        },
        {
          type: 'value' as const,
          name: 'Density',
          nameTextStyle: { color: GTIXT_COLORS.textMuted, fontSize: 11 },
          max: 0.06,
          ...institutionalAxisStyle,
          splitLine: { show: false },
        },
      ],
      dataZoom: [
        {
          type: 'inside',
          start: 0,
          end: 100,
          zoomLock: false,
        },
      ],
      series: [
        {
          name: 'Firms',
          type: 'bar',
          data: buckets.map(b => b.firms),
          barWidth: '65%',
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: GTIXT_COLORS.primary },
              { offset: 1, color: GTIXT_COLORS.tertiary },
            ]),
            borderRadius: [6, 6, 0, 0],
            shadowColor: 'rgba(0, 172, 193, 0.2)',
            shadowBlur: 6,
          },
          emphasis: {
            itemStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: GTIXT_COLORS.deep },
                { offset: 1, color: GTIXT_COLORS.secondary },
              ]),
            },
          },
          markLine: {
            symbol: 'none',
            data: [
              {
                name: 'Median Shift',
                xAxis: '75-79',
                label: {
                  formatter: 'Median shift (compliance)',
                  position: 'insideEndTop',
                  color: GTIXT_COLORS.deep,
                  fontSize: 11,
                },
                lineStyle: {
                  color: 'rgba(0, 131, 143, 0.42)',
                  type: 'dashed',
                  width: 1.5,
                },
              },
            ],
          },
        },
        {
          name: 'KDE',
          type: 'line',
          yAxisIndex: 1,
          data: kdePoints.map((p, i) => {
            // Align KDE with histogram categories
            const bucketIdx = Math.floor((p.score - 50) / 5)
            return [bucketIdx, p.density]
          }).filter(([idx]) => idx >= 0 && idx < buckets.length)
            .map(([idx, density]) => density),
          smooth: true,
          symbol: 'none',
          lineStyle: {
            width: 2.5,
            color: GTIXT_COLORS.secondary,
            shadowColor: 'rgba(41, 182, 246, 0.3)',
            shadowBlur: 7,
          },
          emphasis: { lineStyle: { width: 3 } },
        },
      ],
    }

    chart.setOption(option)

    const handleResize = () => chart.resize()
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      chart.dispose()
    }
  }, [])

  return <div ref={chartRef} style={{ width: '100%', height: 'clamp(260px, 42vh, 320px)' }} />
}

// 4. INDUSTRY CONCENTRATION CHART (Donut with center metric)
export function ConcentrationChart() {
  const chartRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!chartRef.current) return

    const chart = echarts.init(chartRef.current)
    
    const option: EChartsOption = {
      backgroundColor: 'transparent',
      tooltip: {
        ...institutionalTooltip,
        trigger: 'item',
        formatter: `{b}: <b style="color:${GTIXT_COLORS.primary};">{c}%</b> ({d}%)`,
      },
      legend: {
        orient: 'vertical',
        right: '8%',
        top: 'center',
        textStyle: { color: GTIXT_COLORS.text, fontSize: 12 },
        icon: 'circle',
        itemGap: 16,
        formatter: (name: string) => {
          const item = concentrationData.current.find(d => d.name === name)
          return `${name}  ${item?.value}%`
        },
      },
      series: [
        {
          name: 'Concentration',
          type: 'pie',
          radius: ['45%', '72%'],
          center: ['35%', '50%'],
          avoidLabelOverlap: true,
          itemStyle: {
            borderRadius: 4,
            borderColor: GTIXT_COLORS.surface,
            borderWidth: 2,
            shadowBlur: 12,
            shadowColor: 'rgba(0, 172, 193, 0.2)',
          },
          label: {
            show: true,
            position: 'outside',
            color: GTIXT_COLORS.text,
            fontSize: 12,
            formatter: '{b}\n{d}%',
          },
          labelLine: {
            show: true,
            length: 12,
            length2: 8,
            lineStyle: {
              color: 'rgba(38,50,56,0.3)',
            },
          },
          emphasis: {
            itemStyle: {
              shadowBlur: 20,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 172, 193, 0.35)',
            },
            label: {
              fontSize: 14,
              fontWeight: 'bold',
            },
          },
          data: concentrationData.current,
        },
      ],
      graphic: [
        {
          type: 'text',
          left: 'center',
          top: '46%',
          style: {
            text: 'Top 5',
            textAlign: 'center',
            fill: GTIXT_COLORS.textMuted,
            fontSize: 11,
            fontFamily: 'Inter, system-ui, sans-serif',
            fontWeight: 500,
          },
        } as any,
        {
          type: 'text',
          left: 'center',
          top: '52%',
          style: {
            text: '62%',
            textAlign: 'center',
            fill: GTIXT_COLORS.primary,
            fontSize: 26,
            fontFamily: 'Inter, system-ui, sans-serif',
            fontWeight: 700,
          },
        } as any,
      ],
    }

    chart.setOption(option)

    const handleResize = () => chart.resize()
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      chart.dispose()
    }
  }, [])

  return <div ref={chartRef} style={{ width: '100%', height: 'clamp(260px, 42vh, 320px)' }} />
}
