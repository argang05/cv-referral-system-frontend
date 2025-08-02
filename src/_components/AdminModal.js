'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { X, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export default function AdminModal({ onClose, isOpen }) {
  const [departments, setDepartments] = useState([]);
  const [sbuList, setSbuList] = useState([]);
  const [newDepartment, setNewDepartment] = useState('');
  const [selectedDepartmentId, setSelectedDepartmentId] = useState(null);
  const [selectedSbuId, setSelectedSbuId] = useState('');
  const [isOther, setIsOther] = useState(false);
  const [otherName, setOtherName] = useState('');
  const [otherEmail, setOtherEmail] = useState('');
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [loadingSbus, setLoadingSbus] = useState(false);
  const [addingDepartment, setAddingDepartment] = useState(false);
  const [addingReviewer, setAddingReviewer] = useState(false);
  const [removingReviewerIds, setRemovingReviewerIds] = useState({}); // track per dept-index

  const fetchDepartments = async () => {
    setLoadingDepartments(true);
    try {
      const res = await axios.get('/api/admin-config/departments');
      setDepartments(res.data);
    } catch (err) {
      toast.error('Failed to load departments');
    } finally {
      setLoadingDepartments(false);
    }
  };

  const fetchSbus = async () => {
    setLoadingSbus(true);
    try {
      const res = await axios.get('/api/sbu-list/'); // per your new URL
      setSbuList(res.data);
    } catch (err) {
      toast.error('Failed to load SBUs');
    } finally {
      setLoadingSbus(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
    fetchSbus();
  }, []);

  const handleAddDepartment = async () => {
    if (!newDepartment.trim()) return;
    setAddingDepartment(true);
    try {
      await axios.post('/api/admin-config/departments', {
        name: newDepartment.trim(),
        reviewers: []
      });
      toast.success('Department added');
      setNewDepartment('');
      await fetchDepartments();
    } catch (err) {
      toast.error('Failed to add department');
    } finally {
      setAddingDepartment(false);
    }
  };

  const handleAddReviewer = async () => {
    if (!selectedDepartmentId) {
      toast.error('Select a department first');
      return;
    }
    setAddingReviewer(true);
    try {
      const dept = departments.find((d) => d.id === selectedDepartmentId);
      if (!dept) throw new Error('Department not found');
  
      let reviewerObj = null;
  
      if (isOther) {
        if (!otherName.trim() || !otherEmail.trim()) {
          toast.error('Provide name and email for new reviewer');
          return;
        }
        const email = otherEmail.trim();
        reviewerObj = { name: otherName.trim(), email };
  
        // Try to fetch existing SBU to merge departments
        let existingSbu = null;
        try {
          const res = await axios.get(`/api/admin-config/sbus?email=${encodeURIComponent(email)}`);
          existingSbu = res.data?.[0] || null;
        } catch {
          existingSbu = null;
        }
  
        let mergedDepartments = [dept.name];
        if (existingSbu) {
          const existingDeps = Array.isArray(existingSbu.departments)
            ? existingSbu.departments
            : JSON.parse(existingSbu.departments || '[]');
          mergedDepartments = Array.from(new Set([...existingDeps, dept.name]));
          // Update existing SBU
          await axios.put(`/api/admin-config/sbus/${encodeURIComponent(email)}/`, {
            name: otherName.trim(),
            email,
            departments: [dept.name],
          });
        } else {
          // Create new SBU with this department
          await axios.post('/api/admin-config/sbus/', {
            name: otherName.trim(),
            email,
            departments: [dept.name],
          });
        }
      } else {
        if (!selectedSbuId) {
          toast.error('Select an existing SBU or choose Other');
          return;
        }
        const sbu = sbuList.find((s) => String(s.id) === String(selectedSbuId));
        if (!sbu) throw new Error('Selected SBU not found');
        reviewerObj = { name: sbu.name, email: sbu.email };
  
        // Merge department into existing SBU departments
        const existingDepartments = Array.isArray(sbu.departments)
          ? sbu.departments
          : JSON.parse(sbu.departments || '[]');
        const updatedDeptList = Array.from(new Set([...existingDepartments, dept.name]));
        await axios.put(`/api/admin-config/sbus/${encodeURIComponent(sbu.email)}/`, {
          name: sbu.name,
          email: sbu.email,
          departments: updatedDeptList,
        });
      }
  
      // Update Department reviewer list
      const alreadyPresent = (dept.reviewers || []).some((r) => r.email === reviewerObj.email);
      if (alreadyPresent) {
        toast.error('Reviewer already exists in department');
      } else {
        const updatedReviewers = [...(dept.reviewers || []), reviewerObj];
        await axios.put(`/api/admin-config/departments/${selectedDepartmentId}/`, {
          reviewers: updatedReviewers,
        });
        toast.success('Reviewer added');
        // reset selection
        setSelectedSbuId('');
        setIsOther(false);
        setOtherName('');
        setOtherEmail('');
        await fetchDepartments();
        await fetchSbus();
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to add reviewer');
    } finally {
      setAddingReviewer(false);
    }
  };
  

  const handleRemoveReviewer = async (deptId, indexToRemove) => {
    const key = `${deptId}-${indexToRemove}`;
    setRemovingReviewerIds((p) => ({ ...p, [key]: true }));
    try {
      const dept = departments.find((d) => d.id === deptId);
      if (!dept) throw new Error('Department not found');
      const reviewer = dept.reviewers[indexToRemove];
      const updatedReviewers = dept.reviewers.filter((_, i) => i !== indexToRemove);
  
      // Update Department table (PUT to /departments/{id} proxy)
      await axios.put(`/api/admin-config/departments/${deptId}/`, {
        reviewers: updatedReviewers,
      });
  
      // Remove reviewer from SBU (call delete on sbus/[email] with department_id)
      await axios.delete(`/api/admin-config/sbus/${reviewer.email}`, {
        params: { department_id: deptId },
      });
  
      toast.success('Reviewer removed');
      fetchDepartments();
    } catch (err) {
      toast.error('Failed to remove reviewer');
    } finally {
      setRemovingReviewerIds((p) => ({ ...p, [key]: false }));
    }
  };
  
  

  return (
    isOpen &&
      (<div className="fixed inset-0 bg-black/50 flex justify-center items-start overflow-y-auto z-50 py-10">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-4xl relative">
        <button onClick={onClose} className="absolute top-2 right-2 text-gray-600 hover:text-black">
          <X />
        </button>
        <h2 className="text-xl font-semibold mb-4">Manage Departments & Reviewers</h2>

        {/* Add Department */}
        <div className="flex flex-wrap items-center mb-6 gap-2">
          <Input
            placeholder="New Department Name"
            value={newDepartment}
            onChange={(e) => setNewDepartment(e.target.value)}
          />
          <Button onClick={handleAddDepartment} disabled={addingDepartment}>
            {addingDepartment ? 'Adding...' : 'Add Department'}
          </Button>
        </div>

        {/* Add Reviewer */}
        <div className="border p-4 rounded mb-6">
          <h3 className="font-medium mb-2">Add Reviewer to Department</h3>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[180px]">
              <label className="block text-sm font-medium mb-1">Select Department</label>
              <select
                className="w-full border p-2 rounded"
                value={selectedDepartmentId || ''}
                onChange={(e) => {
                  setSelectedDepartmentId(e.target.value);
                  // reset reviewer selection when changing department
                  setSelectedSbuId('');
                  setIsOther(false);
                }}
              >
                <option value="">-- Choose Department --</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1 min-w-[180px]">
              <label className="block text-sm font-medium mb-1">Select Reviewer</label>
              <select
                className="w-full border p-2 rounded"
                value={isOther ? 'other' : selectedSbuId}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === 'other') {
                    setIsOther(true);
                    setSelectedSbuId('');
                  } else {
                    setIsOther(false);
                    setSelectedSbuId(val);
                  }
                }}
              >
                <option value="">-- Select SBU Reviewer --</option>
                {sbuList.map((s) => (
                  <option key={s.email} value={s.id}>
                    {s.name} ({s.email})
                  </option>
                ))}
                <option value="other">Other (new reviewer)</option>
              </select>
            </div>

            {isOther && (
              <>
                <div className="flex-1 min-w-[160px]">
                  <label className="block text-sm font-medium mb-1">Name</label>
                  <Input
                    placeholder="Reviewer Name"
                    value={otherName}
                    onChange={(e) => setOtherName(e.target.value)}
                  />
                </div>
                <div className="flex-1 min-w-[160px]">
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <Input
                    placeholder="Reviewer Email"
                    value={otherEmail}
                    onChange={(e) => setOtherEmail(e.target.value)}
                  />
                </div>
              </>
            )}

            <div className="flex items-end">
              <Button onClick={handleAddReviewer} disabled={addingReviewer}>
                {addingReviewer ? 'Adding...' : 'Add Reviewer'}
              </Button>
            </div>
          </div>
        </div>

        {/* Department List */}
        <div className="space-y-6 max-h-[60vh] overflow-y-auto">
          {loadingDepartments ? (
            <div className="text-center py-6">Loading departments...</div>
          ) : (
            departments.map((dept) => (
              <div key={dept.id} className="border p-4 rounded">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold text-lg">{dept.name}</h3>
                </div>

                {/* Reviewer List */}
                <ul className="mt-2 space-y-2">
                  {(dept.reviewers || []).map((r, index) => (
                    <li key={index} className="flex gap-2 items-center">
                      <div className="flex-1">
                        <div className="text-sm font-medium">{r.name}</div>
                        <div className="text-xs text-gray-500">{r.email}</div>
                      </div>
                      <Button
                        variant="destructive"
                        onClick={() => handleRemoveReviewer(dept.id, index)}
                        disabled={!!removingReviewerIds[`${dept.id}-${index}`]}
                      >
                        {removingReviewerIds[`${dept.id}-${index}`] ? 'Removing...' : <Trash className="w-4 h-4" />}
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            ))
          )}
          {!loadingDepartments && departments.length === 0 && <div>No departments yet.</div>}
        </div>
      </div>
    </div>)
  
  );
}
