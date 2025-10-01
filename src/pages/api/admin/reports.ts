import { Request, Response } from 'express'
import { withAdminRole } from '../../../middleware/sessionValidation'
import { supabase } from '../../../lib/supabase'

/**
 * Admin API endpoint for managing reports
 * Requires 'admin' role or higher
 * Demonstrates secure admin authentication layer with audit logging
 */
async function handler(req: Request, res: Response, admin: any) {
  try {
    switch (req.method) {
      case 'GET':
        await getReports(req, res, admin)
        break
      case 'PUT':
        await updateReport(req, res, admin)
        break
      case 'DELETE':
        await deleteReport(req, res, admin)
        break
      default:
        res.setHeader('Allow', ['GET', 'PUT', 'DELETE'])
        res.status(405).json({ error: 'Method not allowed' })
        break
    }
  } catch (error) {
    console.error('Admin reports API error:', error)
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'An unexpected error occurred'
    })
  }
}

/**
 * Get all reports with filtering options (admin only)
 */
async function getReports(req: Request, res: Response, admin: any) {
  try {
    const { status, user_id, limit = 50, offset = 0 } = req.query

    let query = supabase
      .from('reports')
      .select(`
        id,
        title,
        status,
        created_at,
        updated_at,
        user_id,
        users!inner(email)
      `)
      .order('created_at', { ascending: false })
      .range(Number(offset), Number(offset) + Number(limit) - 1)

    // Apply filters
    if (status) {
      query = query.eq('status', status)
    }
    if (user_id) {
      query = query.eq('user_id', user_id)
    }

    const { data: reports, error, count } = await query

    if (error) {
      console.error('Error fetching reports:', error)
      res.status(500).json({ error: 'Failed to fetch reports' })
      return
    }

    // Log admin action for audit trail
    console.log(`Admin ${admin.email} (${admin.role}) accessed reports list with filters: ${JSON.stringify({ status, user_id, limit, offset })} at ${new Date().toISOString()}`)

    res.status(200).json({
      reports,
      total: count,
      pagination: {
        limit: Number(limit),
        offset: Number(offset),
        has_more: count ? count > Number(offset) + Number(limit) : false
      },
      admin_info: {
        email: admin.email,
        role: admin.role,
        action: 'view_reports',
        filters_applied: { status, user_id }
      }
    })
  } catch (error) {
    console.error('Get reports error:', error)
    res.status(500).json({ error: 'Failed to retrieve reports' })
    return
  }
}

/**
 * Update report status or priority (admin only)
 */
async function updateReport(req: Request, res: Response, admin: any) {
  try {
    const { reportId, updates } = req.body

    if (!reportId || !updates) {
      res.status(400).json({ 
        error: 'Bad request',
        message: 'reportId and updates are required'
      })
      return
    }

    // Validate allowed update fields
    const allowedFields = ['status', 'priority', 'admin_notes']
    const updateData: any = {}
    
    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        updateData[key] = value
      }
    }

    if (Object.keys(updateData).length === 0) {
      res.status(400).json({
        error: 'Bad request',
        message: `No valid fields to update. Allowed fields: ${allowedFields.join(', ')}`
      })
      return
    }

    // Add admin metadata
    updateData.updated_at = new Date().toISOString()
    updateData.last_updated_by = admin.id

    const { data, error } = await supabase
      .from('reports')
      .update(updateData)
      .eq('id', reportId)
      .select(`
        id,
        title,
        status,
        priority,
        admin_notes,
        updated_at,
        users!inner(email)
      `)

    if (error) {
      console.error('Error updating report:', error)
      res.status(500).json({ error: 'Failed to update report' })
      return
    }

    if (!data || data.length === 0) {
      res.status(404).json({ error: 'Report not found' })
      return
    }

    // Log admin action for audit trail
    console.log(`Admin ${admin.email} (${admin.role}) updated report ${reportId} with changes: ${JSON.stringify(updateData)} at ${new Date().toISOString()}`)

    res.status(200).json({
      message: 'Report updated successfully',
      report: data[0],
      admin_action: {
        admin_email: admin.email,
        admin_role: admin.role,
        action: 'update_report',
        changes: updateData,
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('Update report error:', error)
    res.status(500).json({ error: 'Failed to update report' })
    return
  }
}

/**
 * Delete report (super_admin only)
 */
async function deleteReport(req: Request, res: Response, admin: any) {
  try {
    // Additional role check for destructive operations
    if (admin.role !== 'super_admin') {
      res.status(403).json({
        error: 'Forbidden',
        message: 'Only super_admin can delete reports'
      })
      return
    }

    const { reportId } = req.body

    if (!reportId) {
      res.status(400).json({ 
        error: 'Bad request',
        message: 'reportId is required'
      })
      return
    }

    // Get report details before deletion for audit log
    const { data: reportData } = await supabase
      .from('reports')
      .select('id, title, user_id, users!inner(email)')
      .eq('id', reportId)
      .single()

    // Soft delete by updating status instead of hard delete
    const { error } = await supabase
      .from('reports')
      .update({ 
        status: 'deleted',
        deleted_at: new Date().toISOString(),
        deleted_by: admin.id
      })
      .eq('id', reportId)

    if (error) {
      console.error('Error deleting report:', error)
      res.status(500).json({ error: 'Failed to delete report' })
      return
    }

    // Log critical admin action
    console.log(`CRITICAL: Super Admin ${admin.email} deleted report ${reportId} (${reportData?.title}) belonging to user ${reportData?.users?.[0]?.email} at ${new Date().toISOString()}`)

    res.status(200).json({
      message: 'Report deleted successfully',
      admin_action: {
        admin_email: admin.email,
        admin_role: admin.role,
        action: 'delete_report',
        report_id: reportId,
        report_title: reportData?.title,
        report_owner: reportData?.users?.[0]?.email,
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('Delete report error:', error)
    res.status(500).json({ error: 'Failed to delete report' })
    return
  }
}

// Export with admin role protection (requires 'admin' role or higher)
export default withAdminRole('admin', handler)