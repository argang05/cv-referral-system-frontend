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

  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  
  const [reviewerType, setReviewerType] = useState("SBU");
  
  // SBU | EMPLOYEE | OTHER
  
  const [employeeList, setEmployeeList] = useState([]);
  const [otherName, setOtherName] = useState('');
  const [otherEmail, setOtherEmail] = useState('');
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [loadingSbus, setLoadingSbus] = useState(false);
  const [addingDepartment, setAddingDepartment] = useState(false);
  const [addingReviewer, setAddingReviewer] = useState(false);
  const [removingReviewerIds, setRemovingReviewerIds] = useState({}); // track per dept-index
  const [departmentSearch, setDepartmentSearch] = useState('');

  const fetchDepartments = async () => {
    setLoadingDepartments(true);
    try {
      const res = await axios.get('/api/admin-config/departments');
      const sortedDepartments = res.data.sort((a, b) =>
        a.name.localeCompare(b.name)
      );
      setDepartments(sortedDepartments);
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

  const fetchEmployees = async () => {

    try {
  
      const res = await axios.get(
  
        '/api/admin-config/available-employees'
  
      );
  
      setEmployeeList(res.data);
  
    } catch (err) {
  
      toast.error("Failed to load employees");
  
    }
  
  };

  // useEffect(() => {
  //   fetchDepartments();
  //   fetchSbus();
  // }, []);

  useEffect(() => {

    if(isOpen){
  
      fetchDepartments();
  
      fetchSbus();
  
      fetchEmployees();
  
    }
  
  }, [isOpen]);

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
  
      if(reviewerType==="OTHER"){

        if(!otherName.trim() || !otherEmail.trim()){
         toast.error("Provide name and email");
         return;
        }
        
        reviewerObj={
         name:otherName.trim(),
         email:otherEmail.trim()
        };
        
        }
        else if(reviewerType==="EMPLOYEE"){
        
        const emp = employeeList.find(
        (e)=>String(e.emp_id)===String(selectedEmployeeId)
        );
        
        
        if(!emp){
         toast.error("Employee not found");
         return;
        }
        
        
        reviewerObj={
         name:emp.name,
         email:emp.email
        };
        
        
        }
        else {
        
        
        const sbu=sbuList.find(
        (s)=>String(s.id)===String(selectedSbuId)
        );
        
        
        if(!sbu){
         toast.error("Select reviewer");
         return;
        }
        
        
        reviewerObj={
         name:sbu.name,
         email:sbu.email
        };
        
        
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
        setReviewerType("SBU");
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

  const filteredDepartments = departments.filter((dept) =>
    dept.name
      .toLowerCase()
      .includes(departmentSearch.trim().toLowerCase())
  );
  

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

                      setSelectedEmployeeId('');

                      setReviewerType("SBU");

                      // reset manual reviewer fields also

                      setOtherName('');

                      setOtherEmail('');

                    }}

                  >
                <option value="">-- Choose Department --</option>
                {filteredDepartments.map((d) => (
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
              value={
                reviewerType === "OTHER"
                  ? "other"
                  : reviewerType === "EMPLOYEE"
                  ? selectedEmployeeId
                  : selectedSbuId
              }
              onChange={(e)=>{
              const value=e.target.value;
              if(value==="other"){
              setReviewerType("OTHER");
              setSelectedSbuId("");
              setSelectedEmployeeId("");
              }
              else if(
              employeeList.some(
              (emp)=>String(emp.emp_id)===String(value)
              )
              ){
              setReviewerType("EMPLOYEE");
              setSelectedEmployeeId(value);
              setSelectedSbuId("");
              }
              else{
              setReviewerType("SBU");
              setSelectedSbuId(value);
              setSelectedEmployeeId("");
              }
              }}
              >
              <option value="">
              -- Select Reviewer --
              </option>
              <optgroup label="Existing SBU Reviewers">
              {
              sbuList.map((s)=>(
              <option 
              key={s.email}
              value={s.id}
              >
              {s.name} ({s.email})
              </option>
              ))
              }
              </optgroup>
              <optgroup label="Existing Employees">
              {
              employeeList.map((emp)=>(
              <option
              key={emp.emp_id}
              value={emp.emp_id}
              >
              {emp.name} ({emp.email})
              </option>
              ))
              }
              </optgroup>
              <option value="other">
              Other (new reviewer)
              </option>
              </select>
            </div>

            {reviewerType === "OTHER" && (
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
        <div className="mb-4">
          <Input
            placeholder="Search department by name..."
            value={departmentSearch}
            onChange={(e) => setDepartmentSearch(e.target.value)}
            />
        </div>
        <div className="space-y-6 max-h-[60vh] overflow-y-auto">
          {loadingDepartments ? (
            <div className="text-center py-6">Loading departments...</div>
          ) : (
            filteredDepartments.map((dept) => (
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
          {!loadingDepartments && filteredDepartments.length === 0 && (
            <div className="text-center py-4 text-gray-500">
              No matching departments found.
            </div>
            )}
        </div>
      </div>
    </div>)
  
  );
}