'use client'
import { useState } from 'react'
import AdminModal from '@/_components/AdminModal'
import EmailTemplateEditor from '@/_components/EmailTemplateEditor'
export default function AdminPage() {
  const [modalOpen, setModalOpen] = useState(false)
  const [showEmailEditor, setShowEmailEditor] = useState(false)
  return (
    <div className="p-8">
      <h2 className="text-2xl font-semibold">Admin Panel</h2>
      <button
        className="cursor-pointer mt-4 bg-blue-600 text-white px-4 py-2 rounded"
        onClick={() => setModalOpen(true)}
      >
        Manage SBUs & Departments
      </button>

      <AdminModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
      <button className='cursor-pointer ms-4 mt-4 bg-blue-600 text-white px-4 py-2 rounded' onClick={() => setShowEmailEditor(true)}>
        Modify Email Template</button>
      {showEmailEditor && <EmailTemplateEditor onClose={() => setShowEmailEditor(false)} />}
    </div>
  )
}
