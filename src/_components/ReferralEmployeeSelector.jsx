"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Check, Loader2, Search, X } from "lucide-react";

export default function ReferralEmployeeSelector({ checked, onCheckedChange, selectedEmployee, onEmployeeChange, disabled = false }) {
  const [search, setSearch] = useState("");
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!checked) {
      setSearch("");
      setEmployees([]);
      setOpen(false);
      setError("");
      return;
    }

    let cancelled = false;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      setError("");
      try {
        const response = await axios.get("/api/referrals/employees", {
          params: { search },
          signal: controller.signal
        });
        if (!cancelled) setEmployees(Array.isArray(response.data?.employees) ? response.data.employees : []);
      } catch (err) {
        if (!cancelled && !axios.isCancel(err)) {
          setEmployees([]);
          setError("Unable to load employees. Please try again.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      controller.abort();
    };
  }, [checked, search]);

  const handleToggle = e => {
    onCheckedChange(e.target.checked);
    onEmployeeChange(null);
  };

  const selectEmployee = employee => {
    onEmployeeChange(employee);
    setSearch("");
    setOpen(false);
  };

  return (
    <div className="rounded-xl border border-orange-200 bg-orange-50/40 p-4">
      <label className="flex cursor-pointer items-start gap-3">
        <input type="checkbox" checked={checked} onChange={handleToggle} disabled={disabled} className="mt-1 h-4 w-4 accent-[#F6490D]" />
        <span>
          <span className="block text-sm font-semibold text-gray-800">Are you referring on behalf of another employee?</span>
          <span className="mt-1 block text-xs text-gray-500">Select an employee if this referral should be credited to them.</span>
        </span>
      </label>

      {checked && (
        <div className="relative mt-4">
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Select Employee <span className="text-red-500">*</span></label>
          {selectedEmployee ? (
            <div className="flex items-center justify-between gap-3 rounded-lg border border-green-200 bg-green-50 p-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-800">{selectedEmployee.name}</p>
                <p className="text-xs text-gray-500">{selectedEmployee.emp_id} · {selectedEmployee.email}</p>
              </div>
              <button type="button" onClick={() => { onEmployeeChange(null); setOpen(true); }} disabled={disabled} className="rounded-md p-1 text-gray-500 hover:bg-green-100" aria-label="Change selected employee">
                <X size={18} />
              </button>
            </div>
          ) : (
            <>
              <div className="relative">
                <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="text" value={search} onChange={e => { setSearch(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)} disabled={disabled} placeholder="Search name, employee ID or email" className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-10 text-sm outline-none focus:border-orange-500" />
                {loading && <Loader2 size={17} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-orange-500" />}
              </div>
              {open && (
                <div className="mt-1 max-h-56 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                  {error ? (
                    <p className="p-3 text-sm text-red-500">{error}</p>
                  ) : employees.length ? (
                    employees.map(employee => (
                      <button key={employee.emp_id} type="button" onClick={() => selectEmployee(employee)} className="flex w-full items-center justify-between gap-2 border-b px-3 py-2.5 text-left hover:bg-orange-50 last:border-b-0">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-800">{employee.name}</p>
                          <p className="truncate text-xs text-gray-500">{employee.emp_id} · {employee.email}</p>
                        </div>
                        <Check size={16} className="shrink-0 text-gray-300" />
                      </button>
                    ))
                  ) : (
                    <p className="p-3 text-sm text-gray-500">{loading ? "Searching..." : "No employees found."}</p>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}