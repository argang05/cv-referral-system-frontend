'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { X, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

const AdminModal = ({ onClose , isOpen }) => {
  const [departments, setDepartments] = useState([]);
  const [newDepartment, setNewDepartment] = useState('');
  const [selectedDepartmentId, setSelectedDepartmentId] = useState(null);
  const [reviewerName, setReviewerName] = useState('');
  const [reviewerEmail, setReviewerEmail] = useState('');

  const fetchDepartments = async () => {
    try {
      const res = await axios.get('/api/admin-config/departments');
  
      const enhanced = res.data.map((dept) => ({
        ...dept,
        reviewers: dept.reviewers.map((r) => ({
          ...r,
          originalEmail: r.email, // ⬅️ Save original email
        })),
      }));
  
      setDepartments(enhanced);
    } catch (err) {
      toast.error('Failed to load departments');
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const handleAddDepartment = async () => {
    if (!newDepartment) return;
    try {
      await axios.post('/api/admin-config/departments', {
        name: newDepartment,
        reviewers: []
      });
      toast.success('Department added');
      setNewDepartment('');
      fetchDepartments();
    } catch (err) {
      toast.error('Failed to add department');
    }
  };

  const getAllDepartmentsForReviewer = (email) => {
    return departments
      .filter((d) => d.reviewers.some((r) => r.email === email))
      .map((d) => d.name);
  };

  const handleAddReviewer = async () => {
    if (!selectedDepartmentId || !reviewerName || !reviewerEmail) return;
    try {
      const dept = departments.find((d) => d.id === selectedDepartmentId);
      const updatedReviewers = [...dept.reviewers, { name: reviewerName, email: reviewerEmail }];
      await axios.put(`/api/admin-config/departments/${selectedDepartmentId}`, {
        reviewers: updatedReviewers
      });

    //   // Update SBU table
    //   await axios.post('/api/admin-config/sbus/update-departments', {
    //     reviewer_email: reviewerEmail,
    //     department_name: dept.name
    //   });

      toast.success('Reviewer added');
      setReviewerName('');
      setReviewerEmail('');
      fetchDepartments();
    } catch (err) {
      toast.error('Failed to add reviewer');
    }
  };

  const handleUpdateReviewer = async (deptId, reviewerIndex, newName, newEmail, originalEmail) => {
    try {
      const dept = departments.find((d) => d.id === deptId);
  
      // First update the department table locally
      const updatedReviewers = dept.reviewers.map((r, i) =>
        i === reviewerIndex ? { name: newName, email: newEmail } : r
      );
  
      // Step 1: Send updated reviewers to Department table
      await axios.put(`/api/admin-config/departments/${deptId}`, {
        reviewers: updatedReviewers,
      });
  
      // Step 2: Now, collect all departments where the updated reviewer appears
      const allDepartmentsForReviewer = departments
        .map((d) => {
          // Use the newEmail if this is the updated department
          const reviewers = d.id === deptId ? updatedReviewers : d.reviewers;
          return reviewers.some((r) => r.email === newEmail) ? d.name : null;
        })
        .filter(Boolean); // remove nulls
  
      // Step 3: Send correct department list to update SBU
      await axios.put(`/api/admin-config/sbus/${originalEmail}`, {
        name: newName,
        email: newEmail,
        departments: allDepartmentsForReviewer,
      });
  
      toast.success('Reviewer updated');
      fetchDepartments();
    } catch (err) {
      toast.error('Failed to update reviewer');
    }
  };
  
  

  const handleRemoveReviewer = async (deptId, indexToRemove) => {
    try {
      const dept = departments.find((d) => d.id === deptId);
      const reviewerToRemove = dept.reviewers[indexToRemove];
  
      // Step 1: Remove reviewer from department (PUT)
      const updatedReviewers = dept.reviewers.filter((_, i) => i !== indexToRemove);
      await axios.put(`/api/admin-config/departments/${deptId}`, {
        reviewers: updatedReviewers,
      });
  
      // Step 2: Update SBU table via DELETE request
      await axios.delete(`/api/admin-config/sbus/${reviewerToRemove.email}`, {
        params: { department_id: deptId },
      });
  
      toast.success('Reviewer removed');
      fetchDepartments();
    } catch (err) {
      toast.error('Failed to remove reviewer');
      console.error(err);
    }
  };
  

  return (
     <div className={`fixed inset-0 bg-black/50 flex justify-center items-center z-50 ${isOpen ? 'block' : 'hidden'}`}>
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-3xl relative">
        <button onClick={onClose} className="absolute top-2 right-2 text-gray-600 hover:text-black">
          <X />
        </button>
        <h2 className="text-xl font-semibold mb-4">Manage Departments & Reviewers</h2>

        {/* Add Department */}
        <div className="flex items-center mb-4 gap-2">
          <Input
            placeholder="New Department Name"
            value={newDepartment}
            onChange={(e) => setNewDepartment(e.target.value)}
          />
          <Button onClick={handleAddDepartment}>Add Department</Button>
        </div>

        {/* Department List */}
        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          {departments.map((dept) => (
            <div key={dept.id} className="border p-4 rounded">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-lg">{dept.name}</h3>
              </div>

              {/* Reviewer List */}
              <ul className="mt-2 space-y-2">
                {dept.reviewers.map((r, index) => (
                  <li key={index} className="flex gap-2 items-center">
                    <Input
                      className="w-1/3"
                      value={r.name}
                      onChange={(e) => {
                        const updated = [...dept.reviewers];
                        updated[index].name = e.target.value;
                        setDepartments((prev) =>
                          prev.map((d) => (d.id === dept.id ? { ...d, reviewers: updated } : d))
                        );
                      }}
                    />
                    <Input
                      className="w-1/3"
                      value={r.email}
                      onChange={(e) => {
                        const updated = [...dept.reviewers];
                        updated[index].email = e.target.value;
                        setDepartments((prev) =>
                          prev.map((d) => (d.id === dept.id ? { ...d, reviewers: updated } : d))
                        );
                      }}
                    />
                    <Button
                      variant="secondary"
                      onClick={() => handleUpdateReviewer(dept.id, index, r.name, r.email, r.originalEmail)}
                    >
                      Save
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => handleRemoveReviewer(dept.id, index)}
                    >
                      <Trash className="w-4 h-4" />
                    </Button>
                  </li>
                ))}
              </ul>

              {/* Add reviewer to this department */}
              <div className="flex gap-2 mt-4">
                <Input
                  placeholder="Reviewer Name"
                  value={selectedDepartmentId === dept.id ? reviewerName : ''}
                  onChange={(e) => {
                    setSelectedDepartmentId(dept.id);
                    setReviewerName(e.target.value);
                  }}
                />
                <Input
                  placeholder="Reviewer Email"
                  value={selectedDepartmentId === dept.id ? reviewerEmail : ''}
                  onChange={(e) => {
                    setSelectedDepartmentId(dept.id);
                    setReviewerEmail(e.target.value);
                  }}
                />
                <Button onClick={handleAddReviewer}>Add</Button>
              </div>
              <span className='text-[11px] font-bold text-center mt-2 text-gray-500'>{"Warning: You Cannot Update The SBU Reviewer Email For Case Sensitivity (Changing aplhabets to capital letters or small letters keeping the entire email same will not work)"}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminModal;
