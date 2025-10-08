'use client'
import { useState } from 'react'
import AdminModal from '@/_components/AdminModal'
import EmailTemplateEditor from '@/_components/EmailTemplateEditor'

export default function AdminPage() {
  const [modalOpen, setModalOpen] = useState(false)
  const [showEmailEditor, setShowEmailEditor] = useState(false)

  const actions = [
    {
      title: "Manage SBUs & Departments",
      description: "Configure organizational structure, reviewers, and departments.",
      onClick: () => setModalOpen(true),
    },
    {
      title: "Modify Email Template",
      description: "Edit the automated email templates used in referral and review flows.",
      onClick: () => setShowEmailEditor(true),
    },
  ]

  return (
    <div className="p-8">
      <h2 className="text-2xl font-semibold mb-8 text-gray-800">Admin Panel</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {actions.map((action, index) => (
          <div
            key={index}
            onClick={action.onClick}
            className="cursor-pointer group p-6 rounded-2xl bg-white shadow-md hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100"
          >
            <h3 className="text-lg font-semibold text-gray-800 mb-2 group-hover:text-orange-600 transition-colors">
              {action.title}
            </h3>
            <p className="text-gray-500 text-sm leading-relaxed">
              {action.description}
            </p>
          </div>
        ))}
      </div>

      <AdminModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
      {showEmailEditor && (
        <EmailTemplateEditor onClose={() => setShowEmailEditor(false)} />
      )}
    </div>
  )
}
