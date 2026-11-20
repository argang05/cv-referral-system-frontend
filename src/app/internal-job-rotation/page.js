"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useUser } from "@/context/UserContext";
import { toast } from "sonner";
import { ArrowLeftRight, Search, ChevronDown, Loader2, UserRound, Building2, BriefcaseBusiness, Users, Info, Send, RotateCcw, ClipboardList, CalendarDays, CheckCircle2, Clock3, Eye, X, ShieldAlert, ArrowRight, FileText } from "lucide-react";

const EMPTY_FORM = { employee_emp_id: "", proposed_sub_bu: "", proposed_reporting_manager_emp_id: "", proposed_designation: "", proposed_band: "", reason: "", remarks: "", effective_date: "" };
const STATUS_STYLES = { PENDING: "bg-amber-50 text-amber-700 border-amber-200", APPROVED: "bg-blue-50 text-blue-700 border-blue-200", REJECTED: "bg-red-50 text-red-700 border-red-200", IMPLEMENTED: "bg-green-50 text-green-700 border-green-200", CANCELLED: "bg-gray-100 text-gray-600 border-gray-200" };
const formatDate = value => {
  if (!value) return "—";
  const date = /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T00:00:00`) : new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};
const getError = error => {
  const data = error.response?.data;
  if (typeof data?.error === "string") return data.error;
  if (typeof data?.detail === "string") return data.detail;
  if (typeof data === "object" && data) {
    const first = Object.values(data).find(value => value);
    if (Array.isArray(first)) return first.join(", ");
    if (typeof first === "string") return first;
  }
  return error.message || "Something went wrong. Please try again.";
};

function ComparisonRow({ label, current, proposed, changed }) {
  return (
    <div className="border-b border-gray-100 py-3 last:border-b-0">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-xs font-semibold text-gray-600">{label}</p>
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${changed ? "bg-orange-100 text-[#F6490D]" : "bg-gray-100 text-gray-500"}`}>{changed ? "Changed" : "Unchanged"}</span>
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)_20px_minmax(0,1fr)] items-center gap-2">
        <div className="min-w-0 rounded-lg bg-gray-50 px-3 py-2.5">
          <p className="mb-1 text-[10px] font-medium uppercase tracking-wide text-gray-400">Current</p>
          <p className="break-words text-xs font-semibold text-gray-700">{current || "Not assigned"}</p>
        </div>
        <ArrowRight size={16} className={changed ? "text-[#F6490D]" : "text-gray-300"} />
        <div className={`min-w-0 rounded-lg px-3 py-2.5 ${changed ? "border border-orange-100 bg-orange-50" : "bg-gray-50"}`}>
          <p className={`mb-1 text-[10px] font-medium uppercase tracking-wide ${changed ? "text-orange-500" : "text-gray-400"}`}>Proposed</p>
          <p className={`break-words text-xs font-semibold ${changed ? "text-[#F6490D]" : "text-gray-700"}`}>{proposed || "Not assigned"}</p>
        </div>
      </div>
    </div>
  );
}

export default function InternalJobRotation() {
  const { user, loading: userLoading } = useUser();
  const [employees, setEmployees] = useState([]);
  const [sbus, setSbus] = useState([]);
  const [managers, setManagers] = useState([]);
  const [nominations, setNominations] = useState([]);
  const [employeeDetails, setEmployeeDetails] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("nominate");
  const [selectedNomination, setSelectedNomination] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [employeeLoading, setEmployeeLoading] = useState(false);
  const [managerLoading, setManagerLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const canAccess = Boolean(user?.is_hr);

  const loadInitialData = async () => {
    setInitialLoading(true);
    try {
      const [employeeRes, sbuRes, nominationRes] = await Promise.all([
        axios.get("/api/internal-job-rotation/employees/"),
        axios.get("/api/internal-job-rotation/options/"),
        axios.get("/api/internal-job-rotation/nominations/")
      ]);
      setEmployees(employeeRes.data?.employees || []);
      setSbus(sbuRes.data?.sbus || []);
      setNominations(nominationRes.data?.nominations || []);
    } catch (error) {
      toast.error(getError(error));
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    if (!userLoading && canAccess) loadInitialData();
    if (!userLoading && !canAccess) setInitialLoading(false);
  }, [userLoading, canAccess]);

  useEffect(() => {
    if (!search.trim()) {
      setSearchResults([]);
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const response = await axios.get("/api/internal-job-rotation/employees/", { params: { search: search.trim() }, signal: controller.signal });
        setSearchResults(response.data?.employees || []);
      } catch (error) {
        if (error.code !== "ERR_CANCELED") console.error("Employee search failed:", error);
      }
    }, 300);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [search]);

  useEffect(() => {
    if (!form.proposed_sub_bu) {
      setManagers([]);
      return;
    }
    const controller = new AbortController();
    const loadManagers = async () => {
      setManagerLoading(true);
      try {
        const response = await axios.get("/api/internal-job-rotation/managers/", { params: { sub_bu: form.proposed_sub_bu }, signal: controller.signal });
        setManagers((response.data?.managers || []).filter(manager => manager.emp_id !== form.employee_emp_id));
      } catch (error) {
        if (error.code !== "ERR_CANCELED") toast.error(getError(error));
      } finally {
        if (!controller.signal.aborted) setManagerLoading(false);
      }
    };
    loadManagers();
    return () => controller.abort();
  }, [form.proposed_sub_bu, form.employee_emp_id]);

  const selectEmployee = async empId => {
    setSearchOpen(false);
    setSearch("");
    setEmployeeDetails(null);
    setManagers([]);
    setForm({ ...EMPTY_FORM, employee_emp_id: empId });
    if (!empId) return;
    setEmployeeLoading(true);
    try {
      const response = await axios.get(`/api/internal-job-rotation/employees/${encodeURIComponent(empId)}`);
      const employee = response.data?.employee;
      if (!employee) throw new Error("Employee details not found.");
      setEmployeeDetails(employee);
      setForm(prev => ({
        ...prev,
        employee_emp_id: empId,
        proposed_sub_bu: employee.sub_bu || "",
        proposed_reporting_manager_emp_id: employee.reporting_manager_emp_id || "",
        proposed_designation: employee.designation || "",
        proposed_band: employee.band || ""
      }));
    } catch (error) {
      toast.error(getError(error));
    } finally {
      setEmployeeLoading(false);
    }
  };

  const changeSbu = value => {
    setForm(prev => ({ ...prev, proposed_sub_bu: value, proposed_reporting_manager_emp_id: "" }));
    setManagers([]);
  };

  const updateField = (field, value) => setForm(prev => ({ ...prev, [field]: value }));
  const sbuChanged = Boolean(employeeDetails && form.proposed_sub_bu.trim().toLowerCase() !== (employeeDetails.sub_bu || "").trim().toLowerCase());
  const currentManagerId = employeeDetails?.reporting_manager_emp_id || "";
  const managerChanged = Boolean(form.proposed_reporting_manager_emp_id && form.proposed_reporting_manager_emp_id !== currentManagerId);
  const selectedManager = managers.find(manager => manager.emp_id === form.proposed_reporting_manager_emp_id);
  const hasActiveNomination = nominations.some(nomination => nomination.employee_emp_id === form.employee_emp_id && ["PENDING", "APPROVED"].includes(nomination.status));

  const proposedManagerName = selectedManager?.name || (!managerChanged ? employeeDetails?.reporting_manager_name : "") || "";
  const currentManagerName = employeeDetails?.reporting_manager_name || "";
  const currentManagerDisplay = currentManagerName ? `${currentManagerName}${currentManagerId ? ` (${currentManagerId})` : ""}` : currentManagerId;
  const proposedManagerDisplay = proposedManagerName ? `${proposedManagerName}${form.proposed_reporting_manager_emp_id ? ` (${form.proposed_reporting_manager_emp_id})` : ""}` : form.proposed_reporting_manager_emp_id;
  const proposedDesignation = form.proposed_designation.trim() || employeeDetails?.designation || "";
  const proposedBand = form.proposed_band.trim() || employeeDetails?.band || "";
  const designationChanged = proposedDesignation !== (employeeDetails?.designation || "");
  const bandChanged = proposedBand !== (employeeDetails?.band || "");
  const changeCount = [sbuChanged, managerChanged, designationChanged, bandChanged].filter(Boolean).length;

  const validateForm = () => {
    if (!form.employee_emp_id || !employeeDetails) return "Please select an employee.";
    if (hasActiveNomination) return "This employee already has an active IJR nomination.";
    if (!form.proposed_sub_bu) return "Please select a proposed SBU.";
    if (sbuChanged && !form.proposed_reporting_manager_emp_id) return "Changing SBU requires selecting a new reporting manager.";
    if (form.proposed_reporting_manager_emp_id === form.employee_emp_id) return "An employee cannot report to themselves.";
    if (sbuChanged && form.proposed_reporting_manager_emp_id === currentManagerId) return "Please select a different reporting manager for the new SBU.";
    if (form.proposed_reporting_manager_emp_id && !selectedManager && !managerLoading) return "Please select a valid reporting manager from the proposed SBU.";
    if (!form.reason.trim()) return "Please provide a reason for the job rotation.";
    return null;
  };

  const requestSubmit = event => {
    event.preventDefault();
    const error = validateForm();
    if (error) return toast.error(error);
    setConfirmOpen(true);
  };

  const submitNomination = async () => {
    const error = validateForm();
    if (error) { setConfirmOpen(false); return toast.error(error); }
    setSubmitting(true);
    try {
      const payload = {
        employee_emp_id: form.employee_emp_id,
        proposed_sub_bu: form.proposed_sub_bu,
        proposed_reporting_manager_emp_id: form.proposed_reporting_manager_emp_id,
        proposed_designation: form.proposed_designation,
        proposed_band: form.proposed_band,
        reason: form.reason.trim(),
        remarks: form.remarks.trim(),
        effective_date: form.effective_date || null
      };
      await axios.post("/api/internal-job-rotation/nominations/", payload);
      toast.success("IJR nomination submitted successfully. Administrators have been notified.");
      setConfirmOpen(false);
      setForm(EMPTY_FORM);
      setEmployeeDetails(null);
      setManagers([]);
      const response = await axios.get("/api/internal-job-rotation/nominations/");
      setNominations(response.data?.nominations || []);
      setActiveTab("history");
    } catch (error) {
      toast.error(getError(error));
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEmployeeDetails(null);
    setManagers([]);
    setSearch("");
    setSearchOpen(false);
  };

  const Field = ({ label, value, icon: Icon }) => (
    <div className="rounded-xl border border-gray-100 bg-gray-50/80 p-3">
      <div className="mb-1 flex items-center gap-2 text-xs font-medium text-gray-500">{Icon && <Icon size={13} />}{label}</div>
      <p className="break-words text-sm font-semibold text-gray-900">{value || "Not assigned"}</p>
    </div>
  );

  if (userLoading || (canAccess && initialLoading)) return <div className="flex min-h-[70vh] items-center justify-center"><Loader2 className="animate-spin text-[#F6490D]" size={38} /></div>;
  if (!canAccess) return (
    <div className="flex min-h-[70vh] items-center justify-center bg-gray-50 p-6">
      <div className="max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
        <ShieldAlert className="mx-auto mb-4 text-red-500" size={42} />
        <h2 className="text-xl font-bold text-gray-900">Access Restricted</h2>
        <p className="mt-2 text-sm text-gray-500">Only authorized HR personnel can access the Internal Job Rotation module.</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-7 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[#F6490D]"><ArrowLeftRight size={15} /> HR WORKSPACE</div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">Internal Job Rotation</h1>
            <p className="mt-1 text-sm text-gray-500">Nominate employees for internal movements and track rotation requests.</p>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-orange-100 bg-orange-50 px-4 py-2.5 text-sm font-medium text-orange-700"><ShieldAlert size={17} /> HR Authorized</div>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            { label: "Total Nominations", value: nominations.length, icon: ClipboardList },
            { label: "Pending Review", value: nominations.filter(item => item.status === "PENDING").length, icon: Clock3 },
            { label: "Approved", value: nominations.filter(item => item.status === "APPROVED").length, icon: CheckCircle2 }
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div><p className="text-xs font-medium text-gray-500">{label}</p><p className="mt-1 text-2xl font-bold text-gray-900">{value}</p></div>
              <div className="rounded-xl bg-orange-50 p-3 text-[#F6490D]"><Icon size={22} /></div>
            </div>
          ))}
        </div>

        <div className="mb-6 flex gap-2 border-b border-gray-200">
          {[{ id: "nominate", label: "New Nomination", icon: Send }, { id: "history", label: "Nomination History", icon: ClipboardList }].map(({ id, label, icon: Icon }) => (
            <button key={id} type="button" onClick={() => setActiveTab(id)} className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition ${activeTab === id ? "border-[#F6490D] text-[#F6490D]" : "border-transparent text-gray-500 hover:text-gray-800"}`}><Icon size={16} /> {label}</button>
          ))}
        </div>

        {activeTab === "nominate" ? (
          <form onSubmit={requestSubmit} className="space-y-6">
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-5 flex items-center gap-3"><div className="rounded-xl bg-orange-50 p-2.5 text-[#F6490D]"><UserRound size={20} /></div><div><h2 className="text-base font-bold text-gray-900">Select Employee</h2><p className="text-xs text-gray-500">Search by name, ID, or email, or choose from the complete active employee list.</p></div></div>
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="relative">
                  <label className="mb-1.5 block text-xs font-semibold text-gray-700">Search Employee</label>
                  <div className="relative"><Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input value={search} onChange={event => { setSearch(event.target.value); setSearchOpen(true); }} onFocus={() => setSearchOpen(true)} placeholder="Search name, employee ID or email..." className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-4 text-sm outline-none transition focus:border-[#F6490D] focus:ring-2 focus:ring-orange-100" /></div>
                  {searchOpen && search.trim() && (
                    <div className="absolute left-0 right-0 top-full z-30 mt-1 max-h-64 overflow-y-auto rounded-xl border border-gray-200 bg-white p-1 shadow-xl">
                      {searchResults.length ? searchResults.map(employee => (
                        <button key={employee.emp_id} type="button" onClick={() => selectEmployee(employee.emp_id)} className="w-full rounded-lg px-3 py-2.5 text-left hover:bg-orange-50"><p className="text-sm font-semibold text-gray-900">{employee.name} <span className="font-normal text-gray-400">({employee.emp_id})</span></p><p className="truncate text-xs text-gray-500">{employee.email} • {employee.sub_bu || "No SBU"}</p></button>
                      )) : <p className="px-3 py-4 text-center text-xs text-gray-500">No matching employees found.</p>}
                    </div>
                  )}
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-700">Or Select from All Active Employees <span className="text-red-500">*</span></label>
                  <div className="relative"><select value={form.employee_emp_id} onChange={event => selectEmployee(event.target.value)} className="w-full appearance-none rounded-xl border border-gray-200 bg-white px-4 py-3 pr-10 text-sm outline-none focus:border-[#F6490D] focus:ring-2 focus:ring-orange-100"><option value="">Select an employee...</option>{employees.map(employee => <option key={employee.emp_id} value={employee.emp_id}>{employee.name} ({employee.emp_id}) — {employee.sub_bu || "No SBU"}</option>)}</select><ChevronDown size={17} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" /></div>
                </div>
              </div>
              {employeeLoading && <div className="mt-4 flex items-center gap-2 text-sm text-gray-500"><Loader2 size={16} className="animate-spin" /> Loading employee details...</div>}
              {employeeDetails && !employeeLoading && (
                <div className="mt-5 flex items-center gap-3 rounded-xl border border-orange-100 bg-orange-50/60 p-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#F6490D] text-sm font-bold text-white">{employeeDetails.name?.split(" ").slice(0, 2).map(part => part[0]).join("").toUpperCase()}</div>
                  <div className="min-w-0"><p className="font-semibold text-gray-900">{employeeDetails.name}</p><p className="truncate text-xs text-gray-600">{employeeDetails.emp_id} • {employeeDetails.email}</p></div>
                  {hasActiveNomination && <span className="ml-auto rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">Active Nomination Exists</span>}
                </div>
              )}
            </div>

            {employeeDetails && !employeeLoading && (
              <>
                <div className="grid gap-6 lg:grid-cols-2">
                  <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
                    <div className="mb-5 flex items-center gap-3"><div className="rounded-xl bg-gray-100 p-2.5 text-gray-600"><Building2 size={20} /></div><div><h2 className="text-base font-bold text-gray-900">Current Organization</h2><p className="text-xs text-gray-500">Existing employee details (read-only)</p></div></div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Field label="Current SBU" value={employeeDetails.sub_bu} icon={Building2} />
                      <Field label="Reporting Manager" value={employeeDetails.reporting_manager_name || employeeDetails.reporting_manager_emp_id} icon={Users} />
                      <Field label="Designation" value={employeeDetails.designation} icon={BriefcaseBusiness} />
                      <Field label="Band" value={employeeDetails.band} icon={UserRound} />
                    </div>
                  </div>
                  <div className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm sm:p-6">
                    <div className="mb-5 flex items-center gap-3"><div className="rounded-xl bg-orange-50 p-2.5 text-[#F6490D]"><ArrowLeftRight size={20} /></div><div><h2 className="text-base font-bold text-gray-900">Proposed Organization</h2><p className="text-xs text-gray-500">Changes to be reviewed by administrators</p></div></div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold text-gray-700">Proposed SBU <span className="text-red-500">*</span></label>
                        <select value={form.proposed_sub_bu} onChange={event => changeSbu(event.target.value)} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm outline-none focus:border-[#F6490D] focus:ring-2 focus:ring-orange-100"><option value="">Select SBU</option>{sbus.map(sbu => <option key={sbu} value={sbu}>{sbu}</option>)}</select>
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold text-gray-700">Proposed Reporting Manager {sbuChanged && <span className="text-red-500">*</span>}</label>
                        <select value={form.proposed_reporting_manager_emp_id} onChange={event => updateField("proposed_reporting_manager_emp_id", event.target.value)} disabled={!form.proposed_sub_bu || managerLoading} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm outline-none focus:border-[#F6490D] focus:ring-2 focus:ring-orange-100 disabled:bg-gray-50"><option value="">{managerLoading ? "Loading managers..." : "Select reporting manager"}</option>{managers.map(manager => <option key={manager.emp_id} value={manager.emp_id}>{manager.name} ({manager.emp_id})</option>)}</select>
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold text-gray-700">Proposed Designation <span className="font-normal text-gray-400">(Optional)</span></label>
                        <input value={form.proposed_designation} onChange={event => updateField("proposed_designation", event.target.value)} maxLength={100} placeholder="Enter designation" className="w-full rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm outline-none focus:border-[#F6490D] focus:ring-2 focus:ring-orange-100" />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold text-gray-700">Proposed Band <span className="font-normal text-gray-400">(Optional)</span></label>
                        <input value={form.proposed_band} onChange={event => updateField("proposed_band", event.target.value)} maxLength={10} placeholder="Enter band" className="w-full rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm outline-none focus:border-[#F6490D] focus:ring-2 focus:ring-orange-100" />
                      </div>
                    </div>
                    {sbuChanged && <div className="mt-4 flex gap-2 rounded-xl border border-amber-100 bg-amber-50 p-3 text-xs text-amber-800"><Info size={17} className="shrink-0" /><span>Changing the SBU requires a different reporting manager from the proposed SBU. Consider reviewing the employee's designation as well; changing it is optional.</span></div>}
                    {managerChanged && !sbuChanged && <div className="mt-3 flex items-center gap-2 text-xs text-green-700"><CheckCircle2 size={15} /> Reporting manager change detected within the same SBU.</div>}
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
                  <div className="mb-5 flex items-center gap-3"><div className="rounded-xl bg-orange-50 p-2.5 text-[#F6490D]"><FileText size={20} /></div><div><h2 className="text-base font-bold text-gray-900">Nomination Justification</h2><p className="text-xs text-gray-500">Provide the business rationale and supporting details.</p></div></div>
                  <div className="grid gap-4 lg:grid-cols-2">
                    <div className="lg:col-span-2"><label className="mb-1.5 block text-xs font-semibold text-gray-700">Reason for Rotation <span className="text-red-500">*</span></label><textarea value={form.reason} onChange={event => updateField("reason", event.target.value)} rows={4} placeholder="Explain why this employee is being nominated for internal rotation..." className="w-full resize-y rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#F6490D] focus:ring-2 focus:ring-orange-100" /></div>
                    <div><label className="mb-1.5 block text-xs font-semibold text-gray-700">Additional Remarks <span className="font-normal text-gray-400">(Optional)</span></label><textarea value={form.remarks} onChange={event => updateField("remarks", event.target.value)} rows={3} placeholder="Any additional comments..." className="w-full resize-y rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#F6490D] focus:ring-2 focus:ring-orange-100" /></div>
                    <div><label className="mb-1.5 block text-xs font-semibold text-gray-700">Proposed Effective Date <span className="font-normal text-gray-400">(Optional)</span></label><input type="date" value={form.effective_date} onChange={event => updateField("effective_date", event.target.value)} className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#F6490D] focus:ring-2 focus:ring-orange-100" /><p className="mt-2 flex items-center gap-1 text-xs text-gray-400"><CalendarDays size={13} /> Final implementation is subject to approval.</p></div>
                  </div>
                  <div className="mt-6 flex flex-wrap justify-end gap-3 border-t border-gray-100 pt-5">
                    <button type="button" onClick={resetForm} disabled={submitting} className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"><RotateCcw size={16} /> Reset</button>
                    <button type="submit" disabled={submitting || employeeLoading || managerLoading || hasActiveNomination} className="inline-flex items-center gap-2 rounded-xl bg-[#F6490D] px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50">{submitting ? <Loader2 size={17} className="animate-spin" /> : <Send size={17} />} Submit Nomination</button>
                  </div>
                </div>
              </>
            )}
          </form>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 p-5"><div><h2 className="text-base font-bold text-gray-900">Nomination History</h2><p className="text-xs text-gray-500">Track submitted internal rotation requests.</p></div><span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">{nominations.length} records</span></div>
            {nominations.length ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500"><tr><th className="px-5 py-3 font-semibold">Employee</th><th className="px-5 py-3 font-semibold">Movement</th><th className="px-5 py-3 font-semibold">Nominated By</th><th className="px-5 py-3 font-semibold">Date</th><th className="px-5 py-3 font-semibold">Status</th><th className="px-5 py-3 font-semibold">Action</th></tr></thead>
                  <tbody className="divide-y divide-gray-100">
                    {nominations.map(nomination => (
                      <tr key={nomination.id} className="hover:bg-gray-50/70">
                        <td className="px-5 py-4"><p className="font-semibold text-gray-900">{nomination.employee_name}</p><p className="text-xs text-gray-500">{nomination.employee_emp_id}</p></td>
                        <td className="px-5 py-4"><div className="flex items-center gap-2 text-xs"><span className="max-w-[120px] truncate text-gray-600">{nomination.current_details?.sub_bu || "Unassigned"}</span><ArrowRight size={14} className="shrink-0 text-[#F6490D]" /><span className="max-w-[120px] truncate font-semibold text-gray-900">{nomination.proposed_details?.sub_bu || "Unassigned"}</span></div></td>
                        <td className="px-5 py-4 text-gray-600">{nomination.nominated_by_name}</td>
                        <td className="px-5 py-4 text-gray-600">{formatDate(nomination.created_at)}</td>
                        <td className="px-5 py-4"><span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[nomination.status] || STATUS_STYLES.CANCELLED}`}>{nomination.status}</span></td>
                        <td className="px-5 py-4"><button type="button" onClick={() => setSelectedNomination(nomination)} className="inline-flex items-center gap-1.5 font-semibold text-[#F6490D] hover:underline"><Eye size={15} /> View</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <div className="py-16 text-center"><ClipboardList size={40} className="mx-auto mb-3 text-gray-300" /><p className="text-sm font-medium text-gray-600">No nominations submitted yet.</p></div>}
          </div>
        )}
      </div>

      {confirmOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-3 sm:p-5" role="dialog" aria-modal="true" aria-labelledby="ijr-confirm-title">
          <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex shrink-0 items-start justify-between gap-3 border-b border-gray-100 px-5 py-4 sm:px-6">
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-orange-50 p-2.5 text-[#F6490D]"><ClipboardList size={21} /></div>
                <div>
                  <h2 id="ijr-confirm-title" className="text-lg font-bold text-gray-900">Review & Confirm Nomination</h2>
                  <p className="mt-1 text-xs text-gray-500">Verify all proposed changes before submitting for approval.</p>
                </div>
              </div>
              <button type="button" onClick={() => !submitting && setConfirmOpen(false)} disabled={submitting} aria-label="Close confirmation" className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 disabled:opacity-50"><X size={20} /></button>
            </div>

            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-5 sm:px-6">
              <div className="flex flex-wrap items-center gap-3 rounded-xl border border-orange-100 bg-orange-50/60 p-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#F6490D] text-sm font-bold text-white">{employeeDetails?.name?.split(" ").slice(0, 2).map(part => part[0]).join("").toUpperCase() || "U"}</div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-gray-900">{employeeDetails?.name}</p>
                  <p className="mt-0.5 text-xs text-gray-600">Employee ID: {employeeDetails?.emp_id}</p>
                  <p className="break-all text-xs text-gray-500">{employeeDetails?.email}</p>
                </div>
                <span className="rounded-full border border-orange-200 bg-white px-3 py-1 text-xs font-semibold text-[#F6490D]">{changeCount} {changeCount === 1 ? "Change" : "Changes"}</span>
              </div>

              <section>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2"><ArrowLeftRight size={17} className="text-[#F6490D]" /><h3 className="text-sm font-bold text-gray-900">Organizational Change Summary</h3></div>
                  <span className="text-[11px] text-gray-400">Current → Proposed</span>
                </div>
                <div className="rounded-xl border border-gray-200 px-4">
                  <ComparisonRow label="Sub Business Unit (SBU)" current={employeeDetails?.sub_bu} proposed={form.proposed_sub_bu} changed={sbuChanged} />
                  <ComparisonRow label="Reporting Manager" current={currentManagerDisplay} proposed={proposedManagerDisplay} changed={managerChanged} />
                  <ComparisonRow label="Designation" current={employeeDetails?.designation} proposed={proposedDesignation} changed={designationChanged} />
                  <ComparisonRow label="Band" current={employeeDetails?.band} proposed={proposedBand} changed={bandChanged} />
                </div>
              </section>

              <section>
                <div className="mb-3 flex items-center gap-2"><FileText size={17} className="text-[#F6490D]" /><h3 className="text-sm font-bold text-gray-900">Nomination Justification</h3></div>
                <div className="space-y-3 rounded-xl border border-gray-200 p-4">
                  <div>
                    <p className="mb-1 text-xs font-semibold text-gray-500">Reason for Rotation</p>
                    <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-gray-800">{form.reason.trim()}</p>
                  </div>
                  {form.remarks.trim() && <div className="border-t border-gray-100 pt-3"><p className="mb-1 text-xs font-semibold text-gray-500">Additional Remarks</p><p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-gray-800">{form.remarks.trim()}</p></div>}
                </div>
              </section>

              <section className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-gray-200 p-4">
                  <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-gray-500"><CalendarDays size={15} /> Proposed Effective Date</div>
                  <p className="text-sm font-semibold text-gray-900">{form.effective_date ? formatDate(form.effective_date) : "Not specified"}</p>
                </div>
                <div className="rounded-xl border border-gray-200 p-4">
                  <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-gray-500"><UserRound size={15} /> Nominated By</div>
                  <p className="text-sm font-semibold text-gray-900">{user?.name || "HR Personnel"}</p>
                </div>
              </section>

              <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
                <Info size={18} className="mt-0.5 shrink-0 text-amber-600" />
                <div>
                  <p className="text-xs font-bold text-amber-900">Important: Approval Required</p>
                  <p className="mt-1 text-xs leading-relaxed text-amber-800">Submitting this nomination creates a <strong>Pending</strong> request and notifies the designated administrators. The employee's existing SBU, reporting manager, designation, and band will remain unchanged until the rotation is formally approved and implemented.</p>
                </div>
              </div>
            </div>

            <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-gray-100 bg-white px-5 py-4 sm:px-6">
              <p className="hidden text-xs text-gray-400 sm:block">Please verify all details carefully.</p>
              <div className="ml-auto flex items-center gap-3">
                <button type="button" onClick={() => setConfirmOpen(false)} disabled={submitting} className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50">Back to Edit</button>
                <button type="button" onClick={submitNomination} disabled={submitting} className="inline-flex items-center gap-2 rounded-xl bg-[#F6490D] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50">{submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />} {submitting ? "Submitting..." : "Confirm & Submit"}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedNomination && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true" aria-label="Nomination details">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-3"><div><h2 className="text-lg font-bold text-gray-900">Nomination Details</h2><p className="mt-1 text-xs text-gray-500">Submitted on {formatDate(selectedNomination.created_at)}</p></div><button type="button" onClick={() => setSelectedNomination(null)} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100"><X size={20} /></button></div>
            <div className="mb-5 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-orange-50 p-4"><div><p className="font-semibold text-gray-900">{selectedNomination.employee_name}</p><p className="text-xs text-gray-500">{selectedNomination.employee_emp_id}</p></div><span className={`rounded-full border px-3 py-1 text-xs font-semibold ${STATUS_STYLES[selectedNomination.status] || STATUS_STYLES.CANCELLED}`}>{selectedNomination.status}</span></div>
            <div className="grid gap-4 sm:grid-cols-2">
              {[{ title: "Current Organization", details: selectedNomination.current_details }, { title: "Proposed Organization", details: selectedNomination.proposed_details }].map(({ title, details }) => (
                <div key={title} className="rounded-xl border border-gray-100 p-4"><h3 className="mb-3 text-sm font-bold text-gray-900">{title}</h3><div className="space-y-3">{[["SBU", details?.sub_bu], ["Reporting Manager", details?.reporting_manager_name || details?.reporting_manager_emp_id], ["Designation", details?.designation], ["Band", details?.band]].map(([label, value]) => <div key={label}><p className="text-xs text-gray-500">{label}</p><p className="text-sm font-medium text-gray-900">{value || "Not assigned"}</p></div>)}</div></div>
              ))}
            </div>
            <div className="mt-5 space-y-4 rounded-xl bg-gray-50 p-4"><div><p className="text-xs font-semibold text-gray-500">Rotation Reason</p><p className="mt-1 whitespace-pre-wrap text-sm text-gray-800">{selectedNomination.reason}</p></div>{selectedNomination.remarks && <div><p className="text-xs font-semibold text-gray-500">Remarks</p><p className="mt-1 whitespace-pre-wrap text-sm text-gray-800">{selectedNomination.remarks}</p></div>}<div className="grid grid-cols-2 gap-3"><div><p className="text-xs font-semibold text-gray-500">Effective Date</p><p className="mt-1 text-sm text-gray-800">{formatDate(selectedNomination.effective_date)}</p></div><div><p className="text-xs font-semibold text-gray-500">Nominated By</p><p className="mt-1 text-sm text-gray-800">{selectedNomination.nominated_by_name}</p></div></div></div>
          </div>
        </div>
      )}
    </div>
  );
}