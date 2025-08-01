'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import axios from 'axios';
import { X, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';

const PURPOSES = [
  { value: 'CV_TO_SBU', label: 'CV Referral (to SBU)' },
  { value: 'CV_APPROVED_SBU', label: 'CV Referral Approved [By SBU]' },
  { value: 'CV_REJECTED_SBU', label: 'CV Referral Disapproved [By SBU]' },
  { value: 'CV_TO_HR', label: 'CV Referral to HR' },
  { value: 'CV_APPROVED_HR', label: 'CV Referral Approved [By HR]' },
  { value: 'CV_REJECTED_HR', label: 'CV Referral Disapproved [By HR]' },
  { value: 'CV_UPDATED_SBU', label: 'CV Referral Updated [To SBU]' },
  { value: 'CV_DELETED_SBU', label: 'CV Referral Deleted [To SBU]' },
  { value: 'CV_APPROVED_SBU_REFERRER', label: 'CV Approved by SBU - Notify Referrer' },
  { value: 'CV_APPROVED_SBU_TO_HR', label: 'CV Approved by SBU - Notify HR' },
  { value: 'CV_REVOKED_BY_SBU', label: 'CV Approval Revoked by SBU - Notify HR' },
];

export default function EmailTemplateEditor({ initialPurpose = 'CV_TO_SBU', onClose }) {
  const [selectedPurpose, setSelectedPurpose] = useState(initialPurpose);
  const [template, setTemplate] = useState({ subject: '', html_body: '' });
  const [isFetching, setIsFetching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isWysiwyg, setIsWysiwyg] = useState(false);
  const fetchIdRef = useRef(0); // to ignore stale fetches

  const fetchTemplate = useCallback(async (purpose) => {
    const fetchId = ++fetchIdRef.current;
    setIsFetching(true);
    try {
      const res = await axios.get(`/api/admin-config/email-templates`, {
        params: { purpose },
      });

      if (fetchId !== fetchIdRef.current) return; // stale skip

      let data = res.data;
      if (Array.isArray(data) && data.length) data = data[0];

      setTemplate({
        subject: data?.subject || '',
        html_body: data?.html_body || '',
      });
    } catch (err) {
      console.error('Failed to fetch template', err);
      toast.error('Failed to load template');
      setTemplate({ subject: '', html_body: '' });
    } finally {
      if (fetchId === fetchIdRef.current) setIsFetching(false);
    }
  }, []);

  // load when purpose changes
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setIsFetching(true);
      try {
        const res = await axios.get(`/api/admin-config/email-templates/${selectedPurpose}`, {
          headers: { 'Cache-Control': 'no-cache' },
        });
        if (cancelled) return;
        let data = res.data;
        if (Array.isArray(data) && data.length) data = data[0];
        setTemplate({
          subject: data?.subject || '',
          html_body: data?.html_body || '',
        });
      } catch (err) {
        if (!cancelled) {
          toast.error('Failed to load template');
          setTemplate({ subject: '', html_body: '' });
        }
      } finally {
        if (!cancelled) setIsFetching(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [selectedPurpose]);
  

  const saveTemplate = async () => {
    setIsSaving(true);
    try {
      const payload = {
        purpose: selectedPurpose,
        subject: template.subject,
        html_body: template.html_body,
      };
      await axios.put(`/api/admin-config/email-templates/${selectedPurpose}/`, payload);
      toast.success('Template saved');
    } catch (err) {
      console.error('Save failed', err);
      toast.error('Failed to save template');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-start overflow-y-auto z-50">
      <div className="relative w-full max-w-7xl mx-auto my-12 bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold">Manipulate Email Template</h2>
            <div className="text-sm text-gray-600">
              Editing: {PURPOSES.find((p) => p.value === selectedPurpose)?.label}
            </div>
          </div>
          <button onClick={onClose} className="text-gray-600 hover:text-black rounded-full p-1">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-col lg:flex-row gap-6 px-6 py-4 flex-1 overflow-hidden">
          {/* Left: controls + editor */}
          <div className="flex-1 flex flex-col gap-4 min-w-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
              <div className="flex flex-col">
                <label className="text-sm font-medium mb-1">Purpose</label>
                <div className="relative">
                  <select
                    className="w-full border rounded px-3 py-2 pr-8"
                    value={selectedPurpose}
                    onChange={(e) => setSelectedPurpose(e.target.value)}
                  >
                    {PURPOSES.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                  {/* <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                    <ChevronDown size={16} />
                  </div> */}
                </div>
              </div>

              <div className="flex flex-col">
                <label className="text-sm font-medium mb-1">Subject</label>
                <input
                  type="text"
                  className="w-full border rounded px-3 py-2"
                  value={template.subject}
                  onChange={(e) => setTemplate({ ...template, subject: e.target.value })}
                  placeholder="Email subject"
                />
              </div>
            </div>

            <div className="flex justify-between items-center mt-1">
              <div className="text-xs text-gray-500">
                {isFetching ? 'Loading template...' : 'Edit HTML body below'}
              </div>
              <div className="flex gap-3 items-center">
                <button onClick={() => setIsWysiwyg((v) => !v)} className="text-sm underline">
                  {isWysiwyg ? 'Show Source' : 'Show Rendered (editable)'}
                </button>
                <button
                  onClick={saveTemplate}
                  disabled={isSaving || isFetching}
                  className="hidden bg-green-600 text-white px-4 py-2 rounded shadow disabled:opacity-60 flex items-center gap-2"
                >
                  {isSaving ? 'Saving...' : 'Save Template'}
                </button>
              </div>
            </div>

            <div className="flex-1 min-h-[340px]">
              {isWysiwyg ? (
                <div
                  contentEditable
                  aria-label="WYSIWYG editor"
                  className="w-full h-full border rounded p-4 overflow-auto bg-gray-50 prose max-w-full"
                  suppressContentEditableWarning
                  onInput={(e) => {
                    setTemplate({ ...template, html_body: e.currentTarget.innerHTML });
                  }}
                  dangerouslySetInnerHTML={{ __html: template.html_body }}
                  style={{ minHeight: '300px' }}
                />
              ) : (
                <textarea
                  className="w-full h-full border rounded p-3 font-mono text-xs resize-none overflow-auto"
                  value={template.html_body}
                  onChange={(e) => setTemplate({ ...template, html_body: e.target.value })}
                  placeholder="Write HTML body here..."
                  style={{ minHeight: '300px' }}
                />
              )}
            </div>
          </div>

          {/* Right: live preview */}
          <div className="w-full lg:w-1/2 flex flex-col">
            <div className="flex justify-between items-center mb-2">
              <div className="text-sm font-medium">Preview</div>
              <div className="text-xs text-gray-500">
                Live rendering of the HTML. Unsafe content assumed trusted.
              </div>
            </div>
            <div className="flex-1 border rounded-lg bg-white shadow-sm overflow-auto p-4 min-h-[340px]">
              <div
                className="max-w-full"
                style={{ wordBreak: 'break-word' }}
                dangerouslySetInnerHTML={{ __html: template.html_body }}
              />
            </div>
          </div>
        </div>

        {/* Footer Save */}
        <div className="flex justify-end gap-3 px-6 pb-6">
          <button
            onClick={saveTemplate}
            disabled={isSaving || isFetching}
            className="bg-green-600 text-white px-6 py-2 rounded shadow disabled:opacity-60"
          >
            {isSaving ? 'Saving...' : 'Save Template'}
          </button>
        </div>
      </div>
    </div>
  );
}
