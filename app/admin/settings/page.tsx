'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Save, Plus, Edit, Trash2 } from 'lucide-react'

export default function AdminSettingsPage() {
  const [paystackPublicKey, setPaystackPublicKey] = useState('')
  const [paystackSecretKey, setPaystackSecretKey] = useState('')
  const [pricingPlans, setPricingPlans] = useState<any[]>([])
  const [showPlanForm, setShowPlanForm] = useState(false)
  const [editingPlan, setEditingPlan] = useState<any>(null)
  const [planForm, setPlanForm] = useState({
    name: '',
    min_voters: 0,
    max_voters: 0,
    price: 0,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    fetchSettings()
    fetchPricingPlans()
  }, [])

  const fetchSettings = async () => {
    const { data } = await supabase
      .from('admin_settings')
      .select('*')
      .in('key', ['paystack_public_key', 'paystack_secret_key'])

    if (data) {
      data.forEach((setting) => {
        const value = typeof (setting as any).value === 'string' 
          ? (setting as any).value 
          : JSON.stringify((setting as any).value).replace(/"/g, '')
        
        if ((setting as any).key === 'paystack_public_key') {
          setPaystackPublicKey(value)
        } else if ((setting as any).key === 'paystack_secret_key') {
          setPaystackSecretKey(value)
        }
      })
    }
    setLoading(false)
  }

  const fetchPricingPlans = async () => {
    const { data } = await supabase
      .from('pricing_plans')
      .select('*')
      .order('min_voters', { ascending: true })

    if (data) {
      setPricingPlans(data)
    }
  }

  const savePaystackSettings = async () => {
    setSaving(true)

    await supabase
      .from('admin_settings')
      .update({ value: JSON.stringify(paystackPublicKey) } as any)
      .eq('key', 'paystack_public_key')

    await supabase
      .from('admin_settings')
      .update({ value: JSON.stringify(paystackSecretKey) } as any)
      .eq('key', 'paystack_secret_key')

    alert('Paystack settings saved successfully!')
    setSaving(false)
  }

  const handlePlanSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (editingPlan) {
      await supabase
        .from('pricing_plans')
        .update(planForm as any)
        .eq('id', editingPlan.id)
    } else {
      await supabase
        .from('pricing_plans')
        .insert({ ...planForm, currency: 'NGN', is_active: true } as any)
    }

    setPlanForm({ name: '', min_voters: 0, max_voters: 0, price: 0 })
    setEditingPlan(null)
    setShowPlanForm(false)
    fetchPricingPlans()
  }

  const handleEditPlan = (plan: any) => {
    setEditingPlan(plan)
    setPlanForm({
      name: plan.name,
      min_voters: plan.min_voters,
      max_voters: plan.max_voters,
      price: plan.price,
    })
    setShowPlanForm(true)
  }

  const handleDeletePlan = async (id: string) => {
    if (!confirm('Delete this pricing plan?')) return

    await supabase
      .from('pricing_plans')
      .delete()
      .eq('id', id)

    fetchPricingPlans()
  }

  const togglePlanStatus = async (id: string, currentStatus: boolean) => {
    await supabase
      .from('pricing_plans')
      .update({ is_active: !currentStatus } as any)
      .eq('id', id)

    fetchPricingPlans()
  }

  if (loading) {
    return <div className="flex items-center justify-center py-12">Loading...</div>
  }

  return (
    <div className="px-4 sm:px-0 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">System Settings</h1>
      </div>

      {/* Paystack Configuration */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Paystack Configuration</h2>
        <p className="text-sm text-gray-600 mb-6">
          Configure your Paystack API keys to enable payment processing.
        </p>

        <div className="space-y-4">
          <div>
            <label htmlFor="public-key" className="block text-sm font-medium text-gray-700 mb-2">
              Paystack Public Key
            </label>
            <input
              type="text"
              id="public-key"
              className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              value={paystackPublicKey}
              onChange={(e) => setPaystackPublicKey(e.target.value)}
              placeholder="pk_live_..."
            />
          </div>

          <div>
            <label htmlFor="secret-key" className="block text-sm font-medium text-gray-700 mb-2">
              Paystack Secret Key
            </label>
            <input
              type="password"
              id="secret-key"
              className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              value={paystackSecretKey}
              onChange={(e) => setPaystackSecretKey(e.target.value)}
              placeholder="sk_live_..."
            />
          </div>

          <button
            onClick={savePaystackSettings}
            disabled={saving}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Paystack Settings'}
          </button>
        </div>
      </div>

      {/* Pricing Plans */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Pricing Plans</h2>
            <p className="text-sm text-gray-600 mt-1">
              Manage pricing tiers based on number of voters.
            </p>
          </div>
          <button
            onClick={() => {
              setShowPlanForm(!showPlanForm)
              setEditingPlan(null)
              setPlanForm({ name: '', min_voters: 0, max_voters: 0, price: 0 })
            }}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Plan
          </button>
        </div>

        {showPlanForm && (
          <div className="mb-6 bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {editingPlan ? 'Edit Plan' : 'New Plan'}
            </h3>
            <form onSubmit={handlePlanSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Plan Name *
                </label>
                <input
                  type="text"
                  required
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 text-sm"
                  value={planForm.name}
                  onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                  placeholder="e.g., Basic"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price (NGN) *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 text-sm"
                  value={planForm.price}
                  onChange={(e) => setPlanForm({ ...planForm, price: parseFloat(e.target.value) })}
                  placeholder="50000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Min Voters *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 text-sm"
                  value={planForm.min_voters}
                  onChange={(e) => setPlanForm({ ...planForm, min_voters: parseInt(e.target.value) })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Voters *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 text-sm"
                  value={planForm.max_voters}
                  onChange={(e) => setPlanForm({ ...planForm, max_voters: parseInt(e.target.value) })}
                />
              </div>

              <div className="col-span-2 flex gap-3">
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  {editingPlan ? 'Update Plan' : 'Create Plan'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowPlanForm(false)
                    setEditingPlan(null)
                  }}
                  className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Voter Range
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {pricingPlans.map((plan) => (
                <tr key={plan.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {plan.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {plan.min_voters} - {plan.max_voters}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ₦{plan.price.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => togglePlanStatus(plan.id, plan.is_active)}
                      className={`px-2 py-1 text-xs rounded-full ${
                        plan.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {plan.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEditPlan(plan)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeletePlan(plan.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
