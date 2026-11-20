'use client'

import { useState } from 'react'
import AdminModal from '@/_components/AdminModal'
import EmailTemplateEditor from '@/_components/EmailTemplateEditor'
import CompletedReferrals from '@/_components/CompletedReferrals'
import JobPostingAudit from '@/_components/JobPostingAudit'
import IJRAdmin from '@/_components/IJRAdmin'
import {
  Building2,
  Mail,
  ClipboardCheck,
  History,
  ArrowUpRight,
  ArrowRightLeft
} from 'lucide-react'

export default function AdminPage() {
  const [modalOpen, setModalOpen] = useState(false)
  const [showEmailEditor, setShowEmailEditor] = useState(false)
  const [showCompletedReferrals, setShowCompletedReferrals] = useState(false)
  const [showJobAudit, setShowJobAudit] = useState(false)
  const [showIJRAdmin, setShowIJRAdmin] = useState(false)

  const actions = [
    {
      title: 'Manage SBUs & Departments',
      description: 'Configure organizational structure, reviewers, and departments.',
      icon: Building2,
      onClick: () => setModalOpen(true)
    },
    {
      title: 'Modify Email Template',
      description: 'Edit the automated email templates used in referral and review flows.',
      icon: Mail,
      onClick: () => setShowEmailEditor(true)
    },
    {
      title: 'Completed Referrals & Audit Trail',
      description: 'View finalized referrals, recruitment history, and manage permanent deletion.',
      icon: ClipboardCheck,
      onClick: () => setShowCompletedReferrals(true)
    },
    {
      title: 'Job Posting Audit Trail',
      description: 'Monitor job postings, review lifecycle history, and permanently delete postings with administrator confirmation.',
      icon: History,
      onClick: () => setShowJobAudit(true)
    },
    {
      title: 'Internal Job Rotation Management',
      description: 'Review employee rotation nominations, approve or reject proposed changes, track administrative decisions, and manage nomination records.',
      icon: ArrowRightLeft,
      onClick: () => setShowIJRAdmin(true)
    }
  ]

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-800">Admin Panel</h2>
        <p className="mt-1 text-sm text-gray-500">
          Manage organizational settings, recruitment records, and administrative audit trails.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {actions.map(({ title, description, icon: Icon, onClick }) => (
          <button
            key={title}
            type="button"
            onClick={onClick}
            className="group relative flex min-h-[180px] flex-col rounded-2xl border border-gray-100 bg-white p-6 text-left shadow-md transition-all duration-300 hover:-translate-y-1 hover:border-orange-200 hover:shadow-xl"
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="rounded-xl bg-orange-50 p-3 text-[#F6490D] transition-colors group-hover:bg-orange-100">
                <Icon size={22} />
              </div>
              <ArrowUpRight
                size={18}
                className="text-gray-300 transition-colors group-hover:text-[#F6490D]"
              />
            </div>

            <h3 className="mb-2 text-lg font-semibold text-gray-800 transition-colors group-hover:text-orange-600">
              {title}
            </h3>
            <p className="text-sm leading-relaxed text-gray-500">{description}</p>
          </button>
        ))}
      </div>

      <AdminModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      />

      {showEmailEditor && (
        <EmailTemplateEditor
          onClose={() => setShowEmailEditor(false)}
        />
      )}

      {showCompletedReferrals && (
        <CompletedReferrals
          onClose={() => setShowCompletedReferrals(false)}
        />
      )}

      {showJobAudit && (
        <JobPostingAudit
          onClose={() => setShowJobAudit(false)}
        />
      )}

      {showIJRAdmin && (
        <IJRAdmin
          onClose={() => setShowIJRAdmin(false)}
        />
      )}
    </div>
  )
}