import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

/**
 * 🗂️ Archived Discovery Notifications API
 * 
 * Returns recently archived discovery notifications for debugging/verification
 * 
 * Usage:
 * GET /api/galaxy/discoveries/archived?days=7
 * 
 * Response:
 * {
 *   "archived": [
 *     {
 *       "date": "2026-03-07",
 *       "notification": { ... },
 *       "archived_at": "2026-03-07T18:45:36Z"
 *     }
 *   ],
 *   "total": 5
 * }
 */

const ARCHIVE_DIR = '/opt/gpti/data/discovery/notifications/archive'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const daysBack = parseInt(searchParams.get('days') || '7', 10)
    
    // Check if archive directory exists
    const dirExists = await fs.access(ARCHIVE_DIR)
      .then(() => true)
      .catch(() => false)
    
    if (!dirExists) {
      return NextResponse.json({
        archived: [],
        total: 0,
        message: 'No archived notifications'
      })
    }
    
    // Read archive directory
    const files = await fs.readdir(ARCHIVE_DIR)
    const jsonFiles = files.filter(f => f.endsWith('.json')).sort().reverse()
    
    // Filter by date range
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysBack)
    
    const archived: Array<{
      date: string
      notification: any
      archived_at: string
      firms_count: number
    }> = []
    
    for (const file of jsonFiles) {
      const filePath = path.join(ARCHIVE_DIR, file)
      const stats = await fs.stat(filePath)
      
      // Skip old files
      if (stats.mtime < cutoffDate) {
        continue
      }
      
      try {
        const content = await fs.readFile(filePath, 'utf-8')
        const notification = JSON.parse(content)
        
        archived.push({
          date: file.replace('.json', ''),
          notification,
          archived_at: stats.mtime.toISOString(),
          firms_count: notification.count || 0
        })
      } catch (e) {
        console.error(`Failed to read archive ${file}:`, e)
      }
    }
    
    return NextResponse.json({
      archived,
      total: archived.length,
      days_back: daysBack
    })
    
  } catch (error) {
    console.error('Failed to read archived notifications:', error)
    
    return NextResponse.json({
      archived: [],
      total: 0,
      error: 'Failed to load archived notifications'
    }, { status: 500 })
  }
}
