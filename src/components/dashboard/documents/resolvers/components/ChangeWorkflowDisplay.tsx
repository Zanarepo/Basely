'use client'

import React, { useState } from 'react'
import { ApprovalPolicyRule } from '../hooks/useChangeManagementPlanData'
import { ShieldCheck, Edit3, Save, X, Lock, Check, Layers, AlertTriangle, Loader2 } from 'lucide-react'

interface ChangeWorkflowDisplayProps {
  approvalThresholds: string
  escalationProcess: string
  rolesDescription: string
  isEnterpriseTier: boolean
  approvalPolicies?: ApprovalPolicyRule[]
  saving: boolean
  costThreshold: number
  scheduleThresholdDays: number
  onSave: (thresholds: string, escalation: string, roles: string, costThresh: number, scheduleThresh: number) => Promise<boolean>
  currencySymbol?: string
}

export function ChangeWorkflowDisplay({
  approvalThresholds,
  escalationProcess,
  rolesDescription,
  isEnterpriseTier,
  approvalPolicies = [],
  saving,
  costThreshold,
  scheduleThresholdDays,
  onSave,
  currencySymbol = '$'
}: ChangeWorkflowDisplayProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [thresholdsVal, setThresholdsVal] = useState(approvalThresholds)
  const [escalationVal, setEscalationVal] = useState(escalationProcess)
  const [rolesVal, setRolesVal] = useState(rolesDescription)
  const [costThreshVal, setCostThreshVal] = useState(costThreshold.toString())
  const [scheduleThreshVal, setScheduleThreshVal] = useState(scheduleThresholdDays.toString())
  const [savedSuccess, setSavedSuccess] = useState(false)

  const handleEditOpen = () => {
    setThresholdsVal(approvalThresholds)
    setEscalationVal(escalationProcess)
    setRolesVal(rolesDescription)
    setCostThreshVal(costThreshold.toString())
    setScheduleThreshVal(scheduleThresholdDays.toString())
    setIsEditing(true)
  }

  const handleSave = async (e?: React.MouseEvent) => {
    e?.preventDefault()
    const parsedCost = parseFloat(costThreshVal) || 0
    const parsedSchedule = parseFloat(scheduleThreshVal) || 0
    const ok = await onSave(thresholdsVal, escalationVal, rolesVal, parsedCost, parsedSchedule)
    if (ok) {
      setIsEditing(false)
      setSavedSuccess(true)
      setTimeout(() => setSavedSuccess(false), 3000)
    }
  }

  return (
    <div className="space-y-6">
      {/* Enterprise Tier Governance Status Banner */}
      <div className="bg-app-surface-solid border border-app-border rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm transition-colors">
        <div className="flex items-center gap-4">
          <div className={`p-3.5 rounded-2xl ${isEnterpriseTier ? 'bg-violet-500/10 text-violet-400 border border-violet-500/20' : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'} shadow-xs`}>
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h3 className="font-bold text-app-fg text-base sm:text-lg">Change Governance & Gating Rules</h3>
              {isEnterpriseTier ? (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-violet-500/10 text-violet-400 border border-violet-500/20 shadow-2xs">
                  Enterprise Workflow Active
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-slate-500/10 text-slate-400 border border-slate-500/20 shadow-2xs">
                  Standard Tier Governance
                </span>
              )}
            </div>
            <p className="text-xs text-app-muted mt-1 leading-relaxed">
              Establishes formal baselined variance criteria, CCB escalation pathways, and approval boundaries.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleEditOpen}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs bg-violet-600 hover:bg-violet-500 text-white transition-all cursor-pointer shadow-sm hover:shadow-md w-full sm:w-auto justify-center flex-shrink-0"
          style={{ cursor: 'pointer' }}
        >
          <Edit3 className="w-4 h-4" /> Edit Governance Rules
        </button>
      </div>

      {savedSuccess && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 text-sm text-emerald-400 flex items-center gap-2.5 font-semibold shadow-sm">
          <Check className="w-5 h-5 flex-shrink-0 text-emerald-500" /> Change management governance procedures updated successfully!
        </div>
      )}

      {/* Enterprise Configured Automated Policies (if active) */}
      {isEnterpriseTier && approvalPolicies.length > 0 && (
        <div className="bg-app-surface border border-app-border rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-violet-400 font-bold text-sm">
            <Layers className="w-4 h-4 text-violet-400" />
            <span>Configured Organization Approval Workflows</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {approvalPolicies.map(rule => (
              <div key={rule.id} className="bg-app-surface-solid border border-app-border rounded-xl p-4 text-xs shadow-sm transition-all hover:border-violet-500/30">
                <p className="font-bold text-app-fg truncate text-sm">{rule.policy_name}</p>
                <p className="text-app-muted mt-1.5 capitalize">Target Entity: <span className="text-violet-400 font-mono font-semibold">{rule.entity_type}</span></p>
                <div className="mt-3.5 pt-3 border-t border-app-border flex flex-wrap gap-1.5">
                  {rule.require_manager_approval && (
                    <span className="px-2 py-0.5 rounded-md bg-violet-500/10 text-violet-300 font-semibold text-[11px] border border-violet-500/20">PM Sign-Off</span>
                  )}
                  {rule.require_sponsor_approval && (
                    <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 font-semibold text-[11px] border border-amber-500/20">Sponsor Sign-Off</span>
                  )}
                  {rule.threshold_amount !== undefined && rule.threshold_amount > 0 && (
                    <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-300 font-mono font-bold text-[11px] border border-emerald-500/20">
                      &gt; ${rule.threshold_amount.toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Governance Content Cards - Vertical Rows Layout */}
      <div className="flex flex-col gap-5">
        {/* Row 1: Thresholds */}
        <div className="group bg-app-surface-solid border border-app-border rounded-2xl p-6 hover:border-violet-500/40 shadow-sm transition-all relative flex flex-col md:flex-row gap-6 md:gap-8 items-start">
          <div className="w-full md:w-1/3 flex flex-col items-start gap-3">
            <h4 className="font-bold text-app-fg text-sm sm:text-base flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-violet-500 inline-block shadow-2xs shadow-violet-500/50"></span>
              Approval Thresholds
            </h4>
            <p className="text-xs text-app-muted">Baseline cost and schedule variances that trigger formal escalation.</p>
            <button
              type="button"
              onClick={handleEditOpen}
              className="mt-1 opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-violet-500/10 text-violet-400 hover:bg-violet-500/20 font-semibold cursor-pointer border border-violet-500/20 shadow-2xs"
              style={{ cursor: 'pointer' }}
            >
              <Edit3 className="w-3.5 h-3.5" /> Edit Thresholds
            </button>
          </div>
          
          <div className="w-full md:w-2/3 flex flex-col gap-4">
            <div className="flex flex-wrap gap-4">
              <div className="bg-app-muted-surface border border-app-border rounded-xl p-3.5 flex-1 min-w-[140px]">
                <span className="text-[10px] text-app-muted font-bold uppercase tracking-wider block mb-1">Cost Threshold</span>
                <div className="flex items-baseline gap-0.5 text-app-fg font-semibold text-lg">
                  <span className="font-sans text-base">{currencySymbol}</span>
                  <span className="font-mono">{costThreshold.toLocaleString()}</span>
                </div>
              </div>
              <div className="bg-app-muted-surface border border-app-border rounded-xl p-3.5 flex-1 min-w-[140px]">
                <span className="text-[10px] text-app-muted font-bold uppercase tracking-wider block mb-1">Schedule Delay</span>
                <span className="font-mono text-app-fg font-semibold text-lg">{scheduleThresholdDays} Days</span>
              </div>
            </div>
            <div className="bg-app-surface border border-app-border rounded-xl p-4">
              <p className="text-xs sm:text-sm text-app-fg whitespace-pre-line leading-relaxed font-sans">
                {approvalThresholds}
              </p>
            </div>
          </div>
        </div>

        {/* Row 2: Escalation Process */}
        <div className="group bg-app-surface-solid border border-app-border rounded-2xl p-6 hover:border-amber-500/40 shadow-sm transition-all relative flex flex-col md:flex-row gap-6 md:gap-8 items-start">
          <div className="w-full md:w-1/3 flex flex-col items-start gap-3">
            <h4 className="font-bold text-app-fg text-sm sm:text-base flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block shadow-2xs shadow-amber-500/50"></span>
              Escalation Pathway
            </h4>
            <p className="text-xs text-app-muted">Step-by-step workflow for evaluating and escalating baseline changes.</p>
            <button
              type="button"
              onClick={handleEditOpen}
              className="mt-1 opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 font-semibold cursor-pointer border border-amber-500/20 shadow-2xs"
              style={{ cursor: 'pointer' }}
            >
              <Edit3 className="w-3.5 h-3.5" /> Edit Pathway
            </button>
          </div>
          
          <div className="w-full md:w-2/3">
            <div className="bg-app-surface border border-app-border rounded-xl p-4 h-full">
              <p className="text-xs sm:text-sm text-app-fg whitespace-pre-line leading-relaxed font-sans">
                {escalationProcess}
              </p>
            </div>
          </div>
        </div>

        {/* Row 3: Governance Roles */}
        <div className="group bg-app-surface-solid border border-app-border rounded-2xl p-6 hover:border-emerald-500/40 shadow-sm transition-all relative flex flex-col md:flex-row gap-6 md:gap-8 items-start">
          <div className="w-full md:w-1/3 flex flex-col items-start gap-3">
            <h4 className="font-bold text-app-fg text-sm sm:text-base flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block shadow-2xs shadow-emerald-500/50"></span>
              Governance Roles & CCB
            </h4>
            <p className="text-xs text-app-muted">Key stakeholders and their specific responsibilities in the change process.</p>
            <button
              type="button"
              onClick={handleEditOpen}
              className="mt-1 opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 font-semibold cursor-pointer border border-emerald-500/20 shadow-2xs"
              style={{ cursor: 'pointer' }}
            >
              <Edit3 className="w-3.5 h-3.5" /> Edit Roles
            </button>
          </div>
          
          <div className="w-full md:w-2/3">
            <div className="bg-app-surface border border-app-border rounded-xl p-4 h-full">
              <p className="text-xs sm:text-sm text-app-fg whitespace-pre-line leading-relaxed font-sans">
                {rolesDescription}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Governance Edit Popup Modal (Standard Project Design) */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-app-bg/80 backdrop-blur-sm animate-fadeIn">
          <div 
            className="w-full max-w-3xl bg-app-surface-solid border border-app-border rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-app-border bg-app-surface">
              <div className="flex items-center gap-3.5">
                <div className="p-3 rounded-2xl bg-violet-500/10 text-violet-400 border border-violet-500/20 shadow-xs">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-app-fg text-lg">Modify Change Governance Rules</h3>
                  <p className="text-xs text-app-subtle mt-0.5">
                    Configure variance thresholds, escalation pathways, and CCB responsibilities without reloading.
                  </p>
                </div>
              </div>
              <button
                type="button"
                disabled={saving}
                onClick={() => setIsEditing(false)}
                className="p-2 text-app-subtle hover:text-app-fg hover:bg-app-hover rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                style={{ cursor: 'pointer' }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
              {/* Thresholds Input */}
              <div className="space-y-4">
                <label className="text-xs font-bold text-app-fg flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-violet-500 inline-block shadow-2xs shadow-violet-500/50"></span>
                  Approval Thresholds & Variances
                </label>
                
                <div className="flex gap-4">
                  <div className="flex-1 space-y-1.5">
                    <label className="text-[11px] text-app-muted font-semibold">Cost Threshold ($)</label>
                    <input
                      type="number"
                      value={costThreshVal}
                      onChange={(e) => setCostThreshVal(e.target.value)}
                      disabled={saving}
                      className="w-full bg-app-surface border border-app-border rounded-xl p-3 text-sm text-app-fg focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                    />
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <label className="text-[11px] text-app-muted font-semibold">Schedule Threshold (Days)</label>
                    <input
                      type="number"
                      value={scheduleThreshVal}
                      onChange={(e) => setScheduleThreshVal(e.target.value)}
                      disabled={saving}
                      className="w-full bg-app-surface border border-app-border rounded-xl p-3 text-sm text-app-fg focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                    />
                  </div>
                </div>

                <textarea
                  value={thresholdsVal}
                  onChange={(e) => setThresholdsVal(e.target.value)}
                  disabled={saving}
                  rows={4}
                  className="w-full bg-app-surface border border-app-border rounded-2xl p-4 text-xs text-app-fg placeholder:text-app-subtle focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all font-mono leading-relaxed resize-none shadow-inner disabled:opacity-50"
                  placeholder="Specify financial and schedule variance boundaries..."
                />
                <p className="text-[11px] text-app-muted">Define when changes can be approved directly by the PM versus escalation to Executive Sponsors.</p>
              </div>

              {/* Escalation Process Input */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-app-fg flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block shadow-2xs shadow-amber-500/50"></span>
                  Escalation Pathway & Workflow
                </label>
                <textarea
                  value={escalationVal}
                  onChange={(e) => setEscalationVal(e.target.value)}
                  disabled={saving}
                  rows={4}
                  className="w-full bg-app-surface border border-app-border rounded-2xl p-4 text-xs text-app-fg placeholder:text-app-subtle focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all font-mono leading-relaxed resize-none shadow-inner disabled:opacity-50"
                  placeholder="Detail step-by-step CCB escalation process..."
                />
                <p className="text-[11px] text-app-muted">Outline timelines and sequential reviews for elevating baseline variances to formal governing boards.</p>
              </div>

              {/* Governance Roles Input */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-app-fg flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block shadow-2xs shadow-emerald-500/50"></span>
                  Governance Roles & CCB Responsibilities
                </label>
                <textarea
                  value={rolesVal}
                  onChange={(e) => setRolesVal(e.target.value)}
                  disabled={saving}
                  rows={4}
                  className="w-full bg-app-surface border border-app-border rounded-2xl p-4 text-xs text-app-fg placeholder:text-app-subtle focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all font-mono leading-relaxed resize-none shadow-inner disabled:opacity-50"
                  placeholder="Define responsibilities for PM, CCB, and Executive Sponsor..."
                />
                <p className="text-[11px] text-app-muted">Specify stakeholder evaluation criteria and authorization permissions.</p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-app-border bg-app-surface/50">
              <button
                type="button"
                disabled={saving}
                onClick={() => setIsEditing(false)}
                className="btn-secondary px-5 py-2.5 text-xs font-semibold"
                style={{ cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={handleSave}
                className="btn-primary px-6 py-2.5 text-xs font-bold flex items-center gap-2"
                style={{ cursor: 'pointer' }}
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving Changes...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Governance Rules</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
