import { Request, Response } from 'express'
import { withAdminRole } from '../../../middleware/sessionValidation'
import { supabase } from '../../../lib/supabase'

/**
 * Admin API endpoint for managing users
 * Requires 'admin' role or higher
 * Demonstrates secure admin authentication layer
 */
async function handler(req: Request, res: Response, admin: any) {
  try {
    switch (req.method) {
      case 'GET':
        await getUsers(req, res, admin)
        break
      case 'PUT':
        await updateUser(req, res, admin)
        break
      case 'DELETE':
        await deleteUser(req, res, admin)
        break
      default:
        res.setHeader('Allow', ['GET', 'PUT', 'DELETE'])
        res.status(405).json({ error: 'Method not allowed' })
        break
    }
  } catch (error) {
    console.error('Admin users API error:', error)
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'An unexpected error occurred'
    })
  }
}

/**
 * Get all users (admin only)
 */
async function getUsers(req: Request, res: Response, admin: any) {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, created_at, email_confirmed_at, last_sign_in_at')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching users:', error)
      return res.status(500).json({ error: 'Failed to fetch users' })
    }

    // Log admin action for audit trail
    console.log(`Admin ${admin.email} (${admin.role}) accessed user list at ${new Date().toISOString()}`)

    return res.status(200).json({
      users,
      total: users?.length || 0,
      admin_info: {
        email: admin.email,
        role: admin.role,
        action: 'view_users'
      }
    })
  } catch (error) {
    console.error('Get users error:', error)
    return res.status(500).json({ error: 'Failed to retrieve users' })
  }
}

/**
 * Update user status (admin only)
 */
async function updateUser(req: Request, res: Response, admin: any) {
  try {
    const { userId, action } = req.body

    if (!userId || !action) {
      return res.status(400).json({ 
        error: 'Bad request',
        message: 'userId and action are required'
      })
    }

    let updateData: any = {}

    switch (action) {
      case 'confirm_email':
        updateData.email_confirmed_at = new Date().toISOString()
        break
      case 'reset_password':
        // This would typically trigger a password reset email
        // For now, we'll just log the action
        console.log(`Admin ${admin.email} initiated password reset for user ${userId}`)
        return res.status(200).json({ 
          message: 'Password reset initiated',
          admin_action: `${admin.email} (${admin.role}) reset password for user ${userId}`
        })
      default:
        return res.status(400).json({ 
          error: 'Invalid action',
          message: 'Supported actions: confirm_email, reset_password'
        })
    }

    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select()

    if (error) {
      console.error('Error updating user:', error)
      return res.status(500).json({ error: 'Failed to update user' })
    }

    // Log admin action for audit trail
    console.log(`Admin ${admin.email} (${admin.role}) performed ${action} on user ${userId} at ${new Date().toISOString()}`)

    return res.status(200).json({
      message: 'User updated successfully',
      user: data?.[0],
      admin_action: `${admin.email} (${admin.role}) performed ${action}`
    })
  } catch (error) {
    console.error('Update user error:', error)
    return res.status(500).json({ error: 'Failed to update user' })
  }
}

/**
 * Delete user (super_admin only - this will be handled by role hierarchy)
 */
async function deleteUser(req: Request, res: Response, admin: any) {
  try {
    // Additional role check for destructive operations
    if (admin.role !== 'super_admin') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Only super_admin can delete users'
      })
    }

    const { userId } = req.body

    if (!userId) {
      return res.status(400).json({ 
        error: 'Bad request',
        message: 'userId is required'
      })
    }

    // In a real application, you might want to soft delete or archive users
    // instead of hard deletion for audit purposes
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId)

    if (error) {
      console.error('Error deleting user:', error)
      return res.status(500).json({ error: 'Failed to delete user' })
    }

    // Log critical admin action
    console.log(`CRITICAL: Super Admin ${admin.email} deleted user ${userId} at ${new Date().toISOString()}`)

    return res.status(200).json({
      message: 'User deleted successfully',
      admin_action: `Super Admin ${admin.email} deleted user ${userId}`,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Delete user error:', error)
    return res.status(500).json({ error: 'Failed to delete user' })
  }
}

// Export with admin role protection (requires 'admin' role or higher)
export default withAdminRole('admin', handler)