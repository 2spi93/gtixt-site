import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

/**
 * 🌌 Galaxy Discovery API
 * 
 * Returns latest discovered firms for auto-update in 3D galaxy
 * 
 * Polls: /opt/gpti/data/discovery/notifications/latest.json
 * Created by: Autonomous Discovery Agent
 * 
 * Usage:
 * GET /api/galaxy/discoveries
 * 
 * Response:
 * {
 *   "hasNewFirms": true,
 *   "count": 3,
 *   "timestamp": "2026-03-07T12:00:00Z",
 *   "firms": [
 *     {
 *       "firm_id": "newfirm",
 *       "name": "New Firm",
 *       "score": 85,
 *       "jurisdiction": "UK",
 *       "detected_at": "2026-03-07T12:00:00Z"
 *     }
 *   ]
 * }
 */

const NOTIFICATION_FILE = '/opt/gpti/data/discovery/notifications/latest.json'
const MAX_AGE_HOURS = 24 // Only show discoveries from last 24 hours

export async function GET(_request: NextRequest) {
  try {
    // Check if notification file exists
    const fileExists = await fs.access(NOTIFICATION_FILE)
      .then(() => true)
      .catch(() => false)
    
    if (!fileExists) {
      return NextResponse.json({
        hasNewFirms: false,
        count: 0,
        firms: []
      })
    }
    
    // Read notification file
    const content = await fs.readFile(NOTIFICATION_FILE, 'utf-8')
    const notification = JSON.parse(content)
    
    // Check if notification is recent (last 24 hours)
    const notificationTime = new Date(notification.timestamp)
    const now = new Date()
    const ageHours = (now.getTime() - notificationTime.getTime()) / (1000 * 60 * 60)
    
    if (ageHours > MAX_AGE_HOURS) {
      return NextResponse.json({
        hasNewFirms: false,
        count: 0,
        firms: [],
        message: 'No recent discoveries'
      })
    }
    
    // Return new firms
    return NextResponse.json({
      hasNewFirms: notification.firms && notification.firms.length > 0,
      count: notification.count || 0,
      timestamp: notification.timestamp,
      firms: notification.firms || []
    })
    
  } catch (error) {
    console.error('Failed to read discovery notifications:', error)
    
    return NextResponse.json({
      hasNewFirms: false,
      count: 0,
      firms: [],
      error: 'Failed to load discoveries'
    }, { status: 500 })
  }
}

/**
 * Mark notification as read/acknowledged
 */
export async function POST(_request: NextRequest) {
  try {
    const fileExists = await fs.access(NOTIFICATION_FILE)
      .then(() => true)
      .catch(() => false)

    if (!fileExists) {
      return NextResponse.json({
        success: true,
        message: 'No notification to acknowledge'
      })
    }

    // Archive the notification
    const content = await fs.readFile(NOTIFICATION_FILE, 'utf-8')
    const notification = JSON.parse(content)
    
    // Move to archive
    const archiveDir = '/opt/gpti/data/discovery/notifications/archive'
    await fs.mkdir(archiveDir, { recursive: true })
    
    const archiveFile = path.join(
      archiveDir,
      `${new Date(notification.timestamp).toISOString().split('T')[0]}.json`
    )
    
    await fs.writeFile(archiveFile, content)
    
    // Keep latest notification available for galaxy polling,
    // but mark it as acknowledged to preserve audit trace.
    const acknowledged = {
      ...notification,
      acknowledged_at: new Date().toISOString(),
    }
    await fs.writeFile(NOTIFICATION_FILE, JSON.stringify(acknowledged, null, 2), 'utf-8')
    
    return NextResponse.json({
      success: true,
      message: 'Notification acknowledged'
    })
    
  } catch (error) {
    console.error('Failed to acknowledge notification:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to acknowledge notification'
    }, { status: 500 })
  }
}
