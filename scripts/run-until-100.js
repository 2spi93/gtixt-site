/*
 * run-until-100
 * Calls /api/admin/autonomous-lab/cycle until targetMin is reached.
 * Includes retry + exponential backoff + jitter.
 * Optional continuous mode with infra-aware pacing and stop conditions.
 *
 * Usage:
 *   ADMIN_TOKEN="..." node scripts/run-until-100.js
 *   ADMIN_TOKEN="..." TARGET_MIN=100 BATCH_SIZE=10 MAX_CYCLES=30 API_BASE_URL="http://127.0.0.1:3000" RADAR_BOOST_MODULES="scoring,pipeline,operator" node scripts/run-until-100.js
 *   ADMIN_TOKEN="..." CONTINUOUS_MODE=true MAX_RUNTIME_MINUTES=180 node scripts/run-until-100.js
 */

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function toInt(value, fallback, min, max) {
  const n = Number(value)
  if (!Number.isFinite(n)) return fallback
  return Math.max(min, Math.min(max, Math.floor(n)))
}

function computeBackoffMs(baseMs, attempt, maxMs) {
  const exp = Math.min(maxMs, baseMs * 2 ** Math.max(0, attempt - 1))
  const jitter = Math.floor(Math.random() * 300)
  return Math.min(maxMs, exp + jitter)
}

function toFloat(value, fallback, min, max) {
  const n = Number(value)
  if (!Number.isFinite(n)) return fallback
  return Math.max(min, Math.min(max, n))
}

function asBool(value, fallback = false) {
  if (value == null || value === '') return fallback
  const normalized = String(value).trim().toLowerCase()
  return ['1', 'true', 'yes', 'on'].includes(normalized)
}

function clamp(value, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value))
}

async function fetchJson(url, options) {
  const startedAt = Date.now()
  const response = await fetch(url, options)
  const payload = await response.json().catch(() => null)
  return {
    ok: response.ok,
    status: response.status,
    payload,
    latencyMs: Date.now() - startedAt,
  }
}

async function callCycle(args) {
  const result = await fetchJson(`${args.apiBaseUrl}/api/admin/autonomous-lab/cycle`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${args.token}`,
    },
    body: JSON.stringify({
      targetMin: args.targetMin,
      batchSize: args.batchSize,
      sampleLimit: args.sampleLimit,
      radarBoostModules: args.radarBoostModules,
    }),
  })

  if (!result.ok) {
    const msg = result.payload && result.payload.error ? result.payload.error : `HTTP ${result.status}`
    throw new Error(msg)
  }
  return {
    payload: result.payload,
    latencyMs: result.latencyMs,
  }
}

async function callPriorityPreview(args) {
  const qs = new URLSearchParams({ limit: String(args.priorityPreviewLimit) })
  if (args.radarBoostModules.length > 0) {
    qs.set('radarBoostModules', args.radarBoostModules.join(','))
  }

  const result = await fetchJson(
    `${args.apiBaseUrl}/api/admin/autonomous-lab/priority-preview?${qs.toString()}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${args.token}`,
      },
    }
  )

  if (!result.ok) return { data: null, latencyMs: result.latencyMs }
  const data = result.payload && result.payload.success && result.payload.data ? result.payload.data : null
  return { data, latencyMs: result.latencyMs }
}

async function callAdminHealth(args) {
  const result = await fetchJson(`${args.apiBaseUrl}/api/admin/health`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${args.token}`,
    },
  })
  if (!result.ok) return { data: null, latencyMs: result.latencyMs }
  return { data: result.payload || null, latencyMs: result.latencyMs }
}

async function callJobExecutions(args) {
  const limit = Math.max(1, Math.min(200, Number(args.limit || 60)))
  const result = await fetchJson(
    `${args.apiBaseUrl}/api/admin/jobs/executions?limit=${limit}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${args.token}`,
      },
    }
  )
  if (!result.ok) return { data: [], latencyMs: result.latencyMs }
  const data = Array.isArray(result.payload?.data) ? result.payload.data : []
  return { data, latencyMs: result.latencyMs }
}

async function callExperiments(args) {
  const limit = Math.max(1, Math.min(300, Number(args.limit || 120)))
  const result = await fetchJson(
    `${args.apiBaseUrl}/api/admin/autonomous-lab/experiments?limit=${limit}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${args.token}`,
      },
    }
  )
  if (!result.ok) return { data: [], latencyMs: result.latencyMs }
  const data = Array.isArray(result.payload?.data) ? result.payload.data : []
  return { data, latencyMs: result.latencyMs }
}

async function callRuntimeControl(args) {
  const result = await fetchJson(`${args.apiBaseUrl}/api/admin/autonomous-lab/runtime-control`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${args.token}`,
    },
  })
  if (!result.ok) return { data: null, latencyMs: result.latencyMs }
  return { data: result.payload?.data || null, latencyMs: result.latencyMs }
}

function applyRuntimeModeProfile(mode, config) {
  if (mode === 'fast') {
    return {
      ...config,
      basePriorityThreshold: Math.max(1.5, config.basePriorityThreshold * 0.7),
      continuousBaseIntervalMs: Math.max(config.continuousMinIntervalMs, Math.floor(config.continuousBaseIntervalMs * 0.6)),
      burstModeEnabled: true,
      burstCycles: Math.max(config.burstCycles, 4),
      qualityStopMinApprovalRate: Math.max(5, config.qualityStopMinApprovalRate * 0.75),
    }
  }

  if (mode === 'safe') {
    return {
      ...config,
      basePriorityThreshold: Math.min(9.5, config.basePriorityThreshold * 1.35),
      continuousBaseIntervalMs: Math.min(config.continuousMaxIntervalMs, Math.floor(config.continuousBaseIntervalMs * 1.8)),
      burstModeEnabled: false,
      burstCycles: 1,
      qualityStopMinApprovalRate: Math.min(90, config.qualityStopMinApprovalRate * 1.25),
    }
  }

  return config
}

function computeQueueDepth(executions) {
  return executions.filter((x) => {
    const s = String(x?.status || '').toLowerCase()
    return s === 'queued' || s === 'running' || s === 'pending'
  }).length
}

function computeRecentSuccessRate(experiments) {
  let approved = 0
  let rejected = 0
  for (const exp of experiments) {
    const status = String(exp?.status || '').toLowerCase()
    if (status === 'approved' || status === 'review_required') approved += 1
    if (status === 'rejected') rejected += 1
  }
  const decided = approved + rejected
  const successRate = decided > 0 ? approved / decided : 0.5
  const approvalRate = decided > 0 ? (approved / decided) * 100 : 50
  return {
    approved,
    rejected,
    decided,
    successRate,
    approvalRate,
  }
}

function computeSystemLoad(args) {
  const cpuUsage = clamp(Number(args.cpuUsage || 0) / 100, 0, 1)
  const apiLatency = clamp(
    Number(args.apiLatencyMs || 0) / Math.max(1, Number(args.latencySaturationMs || 2000)),
    0,
    1
  )
  const queueDepth = clamp(
    Number(args.queueDepth || 0) / Math.max(1, Number(args.queueDepthSaturation || 20)),
    0,
    1
  )

  const load = Number((cpuUsage * 0.4 + apiLatency * 0.3 + queueDepth * 0.3).toFixed(4))
  return {
    load,
    components: { cpuUsage, apiLatency, queueDepth },
  }
}

function computeThreatLevel(summary) {
  const danger = clamp(Number(summary?.dangerFirms || 0) / 10, 0, 1)
  const newAlerts = clamp(Number(summary?.newAlerts || 0) / 10, 0, 1)
  const suspicious = clamp(Number(summary?.suspiciousSignals || 0) / 25, 0, 1)
  return Number((danger * 0.5 + newAlerts * 0.3 + suspicious * 0.2).toFixed(4))
}

function classifyCycleType(args) {
  if (args.recentSuccessRate < args.recoverySuccessThreshold) return 'recovery'
  if (args.threatLevel > 0.65 || args.priorityPressure > 0.65) return 'exploitation'
  return 'exploration'
}

function computeDynamicPriorityThreshold(args) {
  const threshold =
    args.baseThreshold * (1 + args.systemLoad) * (1 - clamp(args.recentSuccessRate, 0, 1))
  return clamp(Number(threshold.toFixed(4)), 0.5, 9.5)
}

function computeAdaptiveSleepMs(args) {
  const {
    continuousBaseIntervalMs,
    continuousMinIntervalMs,
    continuousMaxIntervalMs,
    cycleDurationMs,
    createdCount,
    processedCount,
    batchSize,
    dangerFirms,
    highPriorityDetected,
    systemLoad,
    threatLevel,
    cycleType,
  } = args

  let nextMs = continuousBaseIntervalMs

  if (cycleDurationMs > 12000) {
    nextMs += 4000
  } else if (cycleDurationMs > 6000) {
    nextMs += 2000
  }

  if (processedCount >= Math.max(1, Math.floor(batchSize * 0.8))) {
    nextMs += 1500
  }

  if (dangerFirms >= 4 || highPriorityDetected) {
    nextMs -= 1200
  }

  if (createdCount === 0 && !highPriorityDetected) {
    nextMs += 2500
  }

  if (cycleType === 'recovery') {
    nextMs += 2000
  }

  if (systemLoad > 0.8) {
    nextMs = Math.max(nextMs, continuousBaseIntervalMs * 3)
  }

  if (threatLevel > 0.7) {
    nextMs = Math.min(nextMs, Math.max(continuousMinIntervalMs, 700))
  }

  return Math.max(continuousMinIntervalMs, Math.min(continuousMaxIntervalMs, nextMs))
}

async function run() {
  const token = process.env.ADMIN_TOKEN || ''
  if (!token) {
    throw new Error('ADMIN_TOKEN is required')
  }

  const apiBaseUrl = process.env.API_BASE_URL || 'http://127.0.0.1:3000'
  const targetMin = toInt(process.env.TARGET_MIN, 100, 10, 500)
  const batchSize = toInt(process.env.BATCH_SIZE, 10, 1, 50)
  const sampleLimit = toInt(process.env.SAMPLE_LIMIT, 800, 100, 5000)
  const maxCycles = toInt(process.env.MAX_CYCLES, 30, 1, 500)
  const maxRetries = toInt(process.env.MAX_RETRIES, 4, 1, 10)
  const baseBackoffMs = toInt(process.env.BACKOFF_MS, 1000, 100, 60000)
  const maxBackoffMs = toInt(process.env.MAX_BACKOFF_MS, 12000, 1000, 120000)
  const radarBoostModules = String(
    process.env.RADAR_BOOST_MODULES || 'scoring,pipeline,operator'
  )
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean)

  const continuousMode = asBool(process.env.CONTINUOUS_MODE, false)
  const maxRuntimeMinutes = toInt(process.env.MAX_RUNTIME_MINUTES, 0, 0, 10080)
  const maxStaleCycles = toInt(process.env.MAX_STALE_CYCLES, 3, 1, 50)
  const maxConsecutiveErrors = toInt(process.env.MAX_CONSECUTIVE_ERRORS, 6, 1, 100)
  const idleExitAfterCycles = toInt(process.env.IDLE_EXIT_AFTER_CYCLES, 0, 0, 10000)
  const priorityPreviewLimit = toInt(process.env.PRIORITY_PREVIEW_LIMIT, 10, 1, 100)
  const configuredBasePriorityThreshold = Number(
    process.env.CONTINUOUS_PRIORITY_THRESHOLD || 4.5
  )
  const recoverySuccessThreshold = toFloat(
    process.env.RECOVERY_SUCCESS_THRESHOLD,
    0.25,
    0,
    1
  )
  const qualityStopMinApprovalRate = toFloat(
    process.env.QUALITY_STOP_MIN_APPROVAL_RATE,
    20,
    0,
    100
  )
  const qualityStopMinSamples = toInt(process.env.QUALITY_STOP_MIN_SAMPLES, 12, 1, 500)
  const qualityStopPauseMs = toInt(process.env.QUALITY_STOP_PAUSE_MS, 60000, 1000, 3600000)
  const qualityStopHardExit = asBool(process.env.QUALITY_STOP_HARD_EXIT, false)
  const latencySaturationMs = toInt(process.env.SYSTEM_LOAD_LATENCY_SAT_MS, 2000, 100, 120000)
  const queueDepthSaturation = toInt(process.env.SYSTEM_LOAD_QUEUE_SAT, 20, 1, 5000)

  const configuredBurstModeEnabled = asBool(process.env.BURST_MODE_ENABLED, true)
  const configuredBurstCycles = toInt(process.env.BURST_CYCLES, 3, 2, 10)
  const burstPriorityPressureHigh = toFloat(
    process.env.BURST_PRIORITY_PRESSURE_HIGH,
    0.75,
    0,
    1
  )
  const burstDangerFirmsThreshold = toInt(
    process.env.BURST_DANGER_FIRMS_THRESHOLD,
    4,
    1,
    100
  )
  const burstThreatLevelThreshold = toFloat(
    process.env.BURST_THREAT_LEVEL_THRESHOLD,
    0.7,
    0,
    1
  )

  const continuousBaseIntervalMs = toInt(
    process.env.CONTINUOUS_BASE_INTERVAL_MS,
    3500,
    300,
    600000
  )
  const continuousMinIntervalMs = toInt(
    process.env.CONTINUOUS_MIN_INTERVAL_MS,
    800,
    200,
    600000
  )
  const continuousMaxIntervalMs = toInt(
    process.env.CONTINUOUS_MAX_INTERVAL_MS,
    15000,
    500,
    600000
  )

  console.log(
    `[run-until-100] start targetMin=${targetMin} batchSize=${batchSize} maxCycles=${maxCycles} api=${apiBaseUrl} radarBoostModules=${radarBoostModules.join('|')} continuousMode=${continuousMode} burstMode=${burstModeEnabled}`
  )

  const startedAt = Date.now()
  let lastAfter = -1
  let staleCycles = 0
  let consecutiveErrors = 0
  let idleCycles = 0
  let iteration = 0
  let lastCreatedCount = 0
  let lastProcessedCount = 0

  while (true) {
    iteration += 1
    if (!continuousMode && iteration > maxCycles) {
      throw new Error('[run-until-100] maxCycles reached before hitting target')
    }

    if (continuousMode && maxRuntimeMinutes > 0) {
      const runtimeMinutes = (Date.now() - startedAt) / 60000
      if (runtimeMinutes >= maxRuntimeMinutes) {
        console.log(
          `[run-until-100] stop: max runtime reached (${runtimeMinutes.toFixed(1)} min)`
        )
        return
      }
    }

    let highPriorityDetected = false
    let previewTopScore = null
    let priorityPressure = 0
    let dynamicPriorityThreshold = basePriorityThreshold
    let threatLevel = 0
    let systemLoad = 0
    let cycleType = 'exploration'
    let radarDangerFirms = 0
    let runtimeMode = 'auto'

    let runtimeConfig = {
      basePriorityThreshold: configuredBasePriorityThreshold,
      continuousBaseIntervalMs,
      continuousMinIntervalMs,
      continuousMaxIntervalMs,
      burstModeEnabled: configuredBurstModeEnabled,
      burstCycles: configuredBurstCycles,
      qualityStopMinApprovalRate,
    }

    if (continuousMode) {
      const [previewRes, healthRes, jobsRes, experimentsRes, runtimeControlRes] = await Promise.all([
        callPriorityPreview({
          apiBaseUrl,
          token,
          radarBoostModules,
          priorityPreviewLimit,
        }),
        callAdminHealth({ apiBaseUrl, token }),
        callJobExecutions({ apiBaseUrl, token, limit: 80 }),
        callExperiments({ apiBaseUrl, token, limit: 140 }),
        callRuntimeControl({ apiBaseUrl, token }),
      ])

      runtimeMode = String(runtimeControlRes.data?.mode || 'auto')
      runtimeConfig = applyRuntimeModeProfile(runtimeMode, runtimeConfig)

      const top = Array.isArray(previewRes.data?.rankedPreview)
        ? previewRes.data.rankedPreview[0]
        : null
      previewTopScore =
        top && Number.isFinite(Number(top.dynamicPriorityScore))
          ? Number(top.dynamicPriorityScore)
          : null
      priorityPressure = clamp((previewTopScore || 0) / 10, 0, 1)

      const radarSummary = previewRes.data?.radar?.summary || {}
      radarDangerFirms = Number(radarSummary.dangerFirms || 0)
      threatLevel = computeThreatLevel(radarSummary)

      const queueDepth = computeQueueDepth(jobsRes.data)
      const healthApiLatency = Number(healthRes.data?.apiLatency || 0)
      const inferredApiLatency = Math.max(
        previewRes.latencyMs || 0,
        healthRes.latencyMs || 0,
        healthApiLatency
      )
      const cpuUsage = Number(healthRes.data?.cpuUsage || 0)
      const load = computeSystemLoad({
        cpuUsage,
        apiLatencyMs: inferredApiLatency,
        queueDepth,
        latencySaturationMs,
        queueDepthSaturation,
      })
      systemLoad = load.load

      const qualityStats = computeRecentSuccessRate(experimentsRes.data)
      const recentSuccessRate = qualityStats.successRate

      if (
        qualityStats.decided >= qualityStopMinSamples &&
        qualityStats.approvalRate < runtimeConfig.qualityStopMinApprovalRate
      ) {
        console.warn(
          `[run-until-100] quality stop: approvalRate=${qualityStats.approvalRate.toFixed(1)}% decided=${qualityStats.decided} threshold=${runtimeConfig.qualityStopMinApprovalRate}% mode=${runtimeMode}`
        )
        if (qualityStopHardExit) {
          console.warn('[run-until-100] quality stop hard-exit enabled; stopping')
          return
        }
        await sleep(qualityStopPauseMs)
        continue
      }

      dynamicPriorityThreshold = computeDynamicPriorityThreshold({
        baseThreshold: runtimeConfig.basePriorityThreshold,
        systemLoad,
        recentSuccessRate,
      })

      highPriorityDetected =
        previewTopScore != null && previewTopScore >= dynamicPriorityThreshold

      cycleType = classifyCycleType({
        recentSuccessRate,
        recoverySuccessThreshold,
        threatLevel,
        priorityPressure,
      })

      console.log(
        `[run-until-100] control mode=${runtimeMode} systemLoad=${systemLoad.toFixed(3)} threatLevel=${threatLevel.toFixed(3)} priorityPressure=${priorityPressure.toFixed(3)} dynThreshold=${dynamicPriorityThreshold.toFixed(2)} cycleType=${cycleType} queueDepth=${queueDepth} cpu=${cpuUsage} apiLatencyMs=${inferredApiLatency}`
      )
    }

    const atTarget = lastAfter >= targetMin && lastAfter !== -1
    if (continuousMode && atTarget && !highPriorityDetected) {
      idleCycles += 1
      const waitMs = Math.max(continuousBaseIntervalMs, 5000)
      console.log(
        `[run-until-100] idle cycle=${idleCycles} atTarget=${atTarget} topPriority=${
          previewTopScore == null ? 'n/a' : previewTopScore.toFixed(2)
        } wait=${waitMs}ms`
      )

      if (idleExitAfterCycles > 0 && idleCycles >= idleExitAfterCycles) {
        console.log(
          `[run-until-100] stop: idle exit reached (${idleCycles} idle cycles at target)`
        )
        return
      }

      await sleep(waitMs)
      continue
    }

    idleCycles = 0
    const burstEligible =
      continuousMode &&
      runtimeConfig.burstModeEnabled &&
      priorityPressure > burstPriorityPressureHigh &&
      radarDangerFirms >= burstDangerFirmsThreshold &&
      threatLevel >= burstThreatLevelThreshold

    const cyclesThisIteration = burstEligible ? runtimeConfig.burstCycles : 1
    let cycleDurationMs = 0

    if (burstEligible) {
      console.log(
        `[run-until-100] burst mode ON cycles=${cyclesThisIteration} priorityPressure=${priorityPressure.toFixed(2)} dangerFirms=${radarDangerFirms} threat=${threatLevel.toFixed(2)}`
      )
    }

    for (let burstIndex = 1; burstIndex <= cyclesThisIteration; burstIndex++) {
      let payload = null
      let lastError = null
      const cycleStartedAt = Date.now()

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          const cycleResult = await callCycle({
            apiBaseUrl,
            token,
            targetMin,
            batchSize,
            sampleLimit,
            radarBoostModules,
          })
          payload = cycleResult.payload
          break
        } catch (error) {
          lastError = error
          const waitMs = computeBackoffMs(baseBackoffMs, attempt, maxBackoffMs)
          console.warn(
            `[run-until-100] cycle=${iteration}.${burstIndex} attempt=${attempt}/${maxRetries} failed: ${
              error instanceof Error ? error.message : String(error)
            } | retry in ${waitMs}ms`
          )
          if (attempt < maxRetries) {
            await sleep(waitMs)
          }
        }
      }

      if (!payload || !payload.success || !payload.data) {
        consecutiveErrors += 1
        const msg = `[run-until-100] cycle=${iteration}.${burstIndex} failed after ${maxRetries} attempts: ${
          lastError instanceof Error ? lastError.message : String(lastError)
        }`

        if (!continuousMode || consecutiveErrors >= maxConsecutiveErrors) {
          throw new Error(`${msg} | consecutiveErrors=${consecutiveErrors}`)
        }

        const waitMs = Math.max(
          runtimeConfig.continuousBaseIntervalMs,
          computeBackoffMs(baseBackoffMs, consecutiveErrors, continuousMaxIntervalMs)
        )
        console.warn(
          `${msg} | consecutiveErrors=${consecutiveErrors}/${maxConsecutiveErrors} | continue in ${waitMs}ms`
        )
        await sleep(waitMs)
        continue
      }

      consecutiveErrors = 0
      const data = payload.data
      cycleDurationMs = Date.now() - cycleStartedAt
      lastCreatedCount = Number(data.createdCount || 0)
      lastProcessedCount = Number(data.processedCount || 0)

      console.log(
        `[run-until-100] cycle=${iteration}.${burstIndex} strategy=${data.strategy || 'n/a'} before=${data.beforeCount} after=${data.afterCount} created=${data.createdCount} processed=${data.processedCount} remaining=${data.remainingToTarget} durationMs=${cycleDurationMs}`
      )

      if (data.radar) {
        const radar = data.radar
        const summary = radar.summary || {}
        const injected = Array.isArray(radar.injectedHypotheses)
          ? radar.injectedHypotheses.map((h) => `${h.module}:${h.hypothesis}`).slice(0, 3)
          : []
        console.log(
          `[run-until-100] radar boostModules=${(radar.boostModules || []).join('|') || 'none'} events=${summary.totalEvents || 0} newAlerts=${summary.newAlerts || 0} danger=${summary.dangerFirms || 0} suspiciousSignals=${summary.suspiciousSignals || 0} injected=${injected.join(' || ') || 'none'}`
        )

        threatLevel = computeThreatLevel(summary)
        radarDangerFirms = Number(summary.dangerFirms || 0)
      }

      if (data.afterCount === lastAfter) {
        staleCycles += 1
      } else {
        staleCycles = 0
      }
      lastAfter = data.afterCount

      if (data.remainingToTarget <= 0) {
        if (!continuousMode) {
          console.log('[run-until-100] target reached')
          return
        }
        console.log('[run-until-100] target reached (continuous mode keeps monitoring)')
      }
    }

    if (staleCycles >= maxStaleCycles) {
      if (!continuousMode) {
        throw new Error(
          `[run-until-100] no progress for ${maxStaleCycles} consecutive cycles; stopping to avoid infinite loop`
        )
      }
      console.warn(
        `[run-until-100] stale guard reached (${staleCycles}/${maxStaleCycles}); cooling down`
      )
      await sleep(Math.max(runtimeConfig.continuousBaseIntervalMs, 5000))
      staleCycles = 0
      continue
    }

    if (!continuousMode) {
      await sleep(250)
      continue
    }

    const waitMs = computeAdaptiveSleepMs({
      continuousBaseIntervalMs: runtimeConfig.continuousBaseIntervalMs,
      continuousMinIntervalMs,
      continuousMaxIntervalMs,
      cycleDurationMs,
      createdCount: lastCreatedCount,
      processedCount: lastProcessedCount,
      batchSize,
      dangerFirms: radarDangerFirms,
      highPriorityDetected,
      systemLoad,
      threatLevel,
      cycleType,
    })

    if (systemLoad > 0.8) {
      console.warn(
        `[run-until-100] high system load detected (${systemLoad.toFixed(3)}): aggressive slowdown`
      )
    }

    if (threatLevel > 0.7) {
      console.warn(
        `[run-until-100] high threat level (${threatLevel.toFixed(3)}): pacing override fast mode`
      )
    }

    console.log(
      `[run-until-100] continuous pacing mode=${runtimeMode} wait=${waitMs}ms highPriority=${highPriorityDetected} topPriority=${
        previewTopScore == null ? 'n/a' : previewTopScore.toFixed(2)
      } cycleType=${cycleType} dynThreshold=${dynamicPriorityThreshold.toFixed(2)} systemLoad=${systemLoad.toFixed(3)} threat=${threatLevel.toFixed(3)}`
    )
    await sleep(waitMs)
  }
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
})
