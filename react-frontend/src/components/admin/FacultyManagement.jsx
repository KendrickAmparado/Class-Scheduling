import React, { useState, useEffect, useCallback } from "react";
import Sidebar from "../common/Sidebar.jsx";
import Header from "../common/Header.jsx";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTrash,
  faPlus,
  faUserPlus,
  faTrashAlt,
  faCopy,
  faCheckSquare,
  faSquare,
  faListCheck,
  faDownload,
  faChalkboardTeacher,
} from "@fortawesome/free-solid-svg-icons";
import TableSortHeader from '../common/TableSortHeader.jsx';
import XLSX from 'xlsx-js-style';
import { io } from "socket.io-client";
import { useToast } from "../common/ToastProvider.jsx";
import ConfirmationDialog from "../common/ConfirmationDialog.jsx";
import { SkeletonTable } from "../common/SkeletonLoader.jsx";
import EmptyState from "../common/EmptyState.jsx";
import apiClient from '../../services/apiClient.js';

  const socket = io("http://localhost:5000", {
  autoConnect: false,
});

const Modal = ({ show, onClose, title, children, actions }) => {
  if (!show) return null;
  return (
    <div
      style={{
        position: "fixed",
        zIndex: 1000,
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        background: "rgba(0,0,0,0.6)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        animation: 'fadeIn 0.2s ease-out',
        backdropFilter: 'blur(4px)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          position: "relative",
          background: "white",
          padding: 32,
          borderRadius: 16,
          minWidth: 360,
          maxWidth: "90vw",
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow: "0 20px 60px rgba(0,0,0,0.4), 0 0 0 1px rgba(255, 255, 255, 0.1)",
          fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
          animation: 'scaleIn 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          transform: 'scale(1)',
          transition: 'transform 0.2s ease',
        }}
        onClick={(e) => e.stopPropagation()}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.01)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
        }}
      >
        {title && <h2 style={{ marginBottom: 16, color: '#1e293b', fontSize: '24px', fontWeight: '700' }}>{title}</h2>}
        <div style={{ marginBottom: 16 }}>{children}</div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
          {actions}
        </div>
      </div>
    </div>
  );
};

const FacultyManagement = () => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState("active");
  const [instructors, setInstructors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [sortConfig, setSortConfig] = useState({ key: 'instructorId', direction: 'asc' });
  const [confirmDialog, setConfirmDialog] = useState({
    show: false,
    title: "",
    message: "",
    onConfirm: null,
    destructive: false,
  });

  // Add Instructor states
  const [showAddModal, setShowAddModal] = useState(false);
  const [addEmail, setAddEmail] = useState("");
  const [addDepartment, setAddDepartment] = useState("");
  const [addLoading, setAddLoading] = useState(false);

  // Complete Registration states
  const [showCompleteRegModal, setShowCompleteRegModal] = useState(false);
  const [completeRegData, setCompleteRegData] = useState({
    email: "",
    firstname: "",
    lastname: "",
    contact: "",
    department: "",
    password: "",
  });
  const [completeRegLoading, setCompleteRegLoading] = useState(false);

  // Fetch instructors function
  const fetchInstructors = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.getInstructors();
      const data = res.data;

      // Normalize response: API may return an array or an object { success, instructors }
      if (Array.isArray(data)) {
        setInstructors(data);
      } else if (data && Array.isArray(data.instructors)) {
        setInstructors(data.instructors);
      } else if (data && Array.isArray(data.data)) {
        // Some older endpoints return { data: [...] }
        setInstructors(data.data);
      } else {
        // Fallback: empty array
        setInstructors([]);
      }
    } catch (err) {
      console.error('Error loading instructors', err);
      showToast('Error loading instructors.', 'error');
      setInstructors([]);
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  // Initialize search from URL query (?q=)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get('q');
    if (q) setSearchQuery(q);
  }, []);

  useEffect(() => {
    fetchInstructors();

    socket.connect();

    socket.on("new-alert", (alertData) => {
      console.log("Received new alert via socket", alertData);
      fetchInstructors();
    });

    return () => {
      socket.off("new-alert");
      socket.disconnect();
    };
  }, [fetchInstructors]);

  const showConfirm = (title, message, onConfirm, destructive = false) =>
    setConfirmDialog({
      show: true,
      title,
      message,
      onConfirm: () => {
        onConfirm();
        setConfirmDialog({ show: false, title: "", message: "", onConfirm: null });
      },
      destructive,
    });

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast(`Instructor ID "${text}" copied to clipboard!`, 'success');
    } catch (err) {
      console.error('Failed to copy: ', err);
      showToast("Failed to copy instructor ID to clipboard", 'error');
    }
  };


  const handleSort = (key, direction) => {
    setSortConfig({ key, direction });
  };

  // Get unique departments for filter
  const departments = [...new Set(instructors.map(inst => inst.department).filter(Boolean))].sort();

  let filteredInstructors = instructors.filter((inst) => {
    if (activeTab === "active") return inst.status === "active";
    else if (activeTab === "pending") return inst.status === "pending";
    else if (activeTab === "archived") return inst.status === "archived";
    return true;
  });

  // Filter by search query
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    filteredInstructors = filteredInstructors.filter(inst =>
      (inst.firstname && inst.firstname.toLowerCase().includes(q)) ||
      (inst.lastname && inst.lastname.toLowerCase().includes(q)) ||
      (inst.email && inst.email.toLowerCase().includes(q)) ||
      (inst.instructorId && inst.instructorId.toLowerCase().includes(q)) ||
      (inst.department && inst.department.toLowerCase().includes(q)) ||
      (inst.contact && inst.contact.toLowerCase().includes(q))
    );
  }

  // Filter by department
  if (departmentFilter !== 'all') {
    filteredInstructors = filteredInstructors.filter(inst => inst.department === departmentFilter);
  }

  // Sort instructors
  filteredInstructors = [...filteredInstructors].sort((a, b) => {
    let aValue = a[sortConfig.key];
    let bValue = b[sortConfig.key];

    // Handle name sorting (combine firstname and lastname)
    if (sortConfig.key === 'name') {
      aValue = `${a.firstname || ''} ${a.lastname || ''}`.trim();
      bValue = `${b.firstname || ''} ${b.lastname || ''}`.trim();
    }

    // Handle string sorting
    if (typeof aValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = (bValue || '').toLowerCase();
    }

    // Handle null/undefined values
    if (!aValue && bValue) return 1;
    if (aValue && !bValue) return -1;
    if (!aValue && !bValue) return 0;

    if (aValue < bValue) {
      return sortConfig.direction === 'asc' ? -1 : 1;
    }
    if (aValue > bValue) {
      return sortConfig.direction === 'asc' ? 1 : -1;
    }
    return 0;
  });

  const btnStyle = (bg) => ({
    padding: "8px 14px",
    backgroundColor: bg,
    color: "white",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: 14,
    fontWeight: "600",
    transition: "all 0.2s ease",
  });

  const exportInstructorsToExcel = () => {
    const wb = XLSX.utils.book_new();
    
    const data = [
      ['Instructor ID', 'First Name', 'Last Name', 'Email', 'Contact', 'Department', 'Status'],
      ...filteredInstructors.map(inst => [
        inst.instructorId || '',
        inst.firstname || '',
        inst.lastname || '',
        inst.email || '',
        inst.contact || '',
        inst.department || '',
        inst.status || ''
      ])
    ];

    const ws = XLSX.utils.aoa_to_sheet(data);
    ws['!cols'] = [
      { wch: 20 },
      { wch: 20 },
      { wch: 20 },
      { wch: 30 },
      { wch: 15 },
      { wch: 25 },
      { wch: 15 }
    ];

    // Style header row
    const headerRange = XLSX.utils.decode_range(ws['!ref']);
    for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
      if (!ws[cellAddress]) continue;
      ws[cellAddress].s = {
        fill: { fgColor: { rgb: "0f2c63" } },
        font: { bold: true, color: { rgb: "FFFFFF" } },
        alignment: { horizontal: "center", vertical: "center" }
      };
    }

    XLSX.utils.book_append_sheet(wb, ws, `${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Instructors`);
    XLSX.writeFile(wb, `instructors-${activeTab}-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleArchive = (id) =>
    showConfirm("Archive Instructor", "Are you sure you want to archive this instructor?", async () => {
      try {
        const res = await apiClient.patch(`/api/instructors/${id}/archive`);
        if (res.data.success) {
          setInstructors((prev) => prev.map((i) => (i._id === id ? { ...i, status: 'archived' } : i)));
          showToast('Instructor archived successfully.', 'success');
        }
      } catch (err) {
        console.error('Error archiving instructor', err);
        showToast('Error archiving instructor.', 'error');
      }
    });

  const handleRestore = (id) =>
    showConfirm("Restore Instructor", "Restore this instructor to active?", async () => {
      try {
        const res = await apiClient.patch(`/api/instructors/${id}/restore`);
        if (res.data.success) {
          setInstructors((prev) => prev.map((i) => (i._id === id ? { ...i, status: 'active' } : i)));
          showToast('Instructor restored successfully.', 'success');
        }
      } catch (err) {
        console.error('Error restoring instructor', err);
        showToast('Error restoring instructor.', 'error');
      }
    });

  const handlePermanentDelete = (id) =>
    showConfirm(
      'Delete Permanently',
      'Are you sure you want to permanently delete this instructor? This action cannot be undone.',
      async () => {
        try {
          const res = await apiClient.delete(`/api/instructors/${id}/permanent`);
          const data = res.data;
          if (data.success || data.message === 'Instructor permanently deleted') {
            setInstructors((prev) => prev.filter((i) => i._id !== id));
            showToast('Instructor deleted permanently.', 'success');
          }
        } catch (err) {
          console.error('Error deleting instructor', err);
          showToast('Error deleting instructor.', 'error');
        }
      },
      true
    );

  const handleAddInstructor = (e) => {
    e.preventDefault();
    setAddLoading(true);

    apiClient.post("/api/registration/send-registration", {
      email: addEmail,
      department: addDepartment,
    })
      .then(async (res) => {
        const data = res.data;
        if (!data.success) {
          throw new Error(data.error || data.message || "Failed to send registration email");
        }
        return data;
      })
      .then((data) => {
        setShowAddModal(false);
        setAddEmail("");
        setAddDepartment("");
        const instructorIdMsg = data.instructorId ? ` (Instructor ID: ${data.instructorId})` : '';
        showToast(`Registration link sent successfully to ${addEmail}!${instructorIdMsg}`, 'success');
        fetchInstructors();
      })
      .catch((err) => {
        showToast(err.message || "Error sending registration email. Please try again.", 'error');
      })
      .finally(() => setAddLoading(false));
  };

  const handleCompleteRegChange = (e) => {
    setCompleteRegData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleCompleteRegSubmit = async (e) => {
    e.preventDefault();
    setCompleteRegLoading(true);

    try {
      const response = await apiClient.post("/api/instructors/complete-registration", completeRegData);
      const data = response.data;

      if (!data.success) {
        throw new Error(data.message || "Registration failed");
      }

      setShowCompleteRegModal(false);
      setCompleteRegData({
        email: "",
        firstname: "",
        lastname: "",
        contact: "",
        department: "",
        password: "",
      });
      
      // Show success message with instructor ID if available
      const instructorId = data.instructor?.id ? ` (Instructor ID: ${data.instructor.id})` : '';
      showToast(`Registration completed successfully!${instructorId}`, 'success');
      fetchInstructors();
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setCompleteRegLoading(false);
    }
  };

  // Bulk operations
  const handleToggleSelect = (id) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === filteredInstructors.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredInstructors.map(inst => inst._id)));
    }
  };

  const handleBulkArchive = () => {
    if (selectedIds.size === 0) return;
    showConfirm(
      "Archive Instructors",
      `Are you sure you want to archive ${selectedIds.size} instructor(s)?`,
      async () => {
        const promises = Array.from(selectedIds).map(id =>
          apiClient.patch(`/api/instructors/${id}/archive`)
        );
        try {
          const results = await Promise.allSettled(promises);
          const successful = results.filter(r => r.status === 'fulfilled' && r.value?.data?.success).length;
          showToast(`Successfully archived ${successful} of ${selectedIds.size} instructor(s).`, 'success');
          setSelectedIds(new Set());
          setIsSelectMode(false);
          fetchInstructors();
        } catch (err) {
          showToast("Error archiving instructors.", 'error');
        }
      }
    );
  };

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;
    showConfirm(
      "Delete Permanently",
      `Are you sure you want to permanently delete ${selectedIds.size} instructor(s)? This action cannot be undone.`,
      async () => {
        const promises = Array.from(selectedIds).map(id =>
          apiClient.delete(`/api/instructors/${id}/permanent`)
        );
        try {
          const results = await Promise.allSettled(promises);
          const successful = results.filter(r => r.status === 'fulfilled' && r.value?.data?.success).length;
          showToast(`Successfully deleted ${successful} of ${selectedIds.size} instructor(s).`, 'success');
          setSelectedIds(new Set());
          setIsSelectMode(false);
          fetchInstructors();
        } catch (err) {
          showToast("Error deleting instructors.", 'error');
        }
      },
      true
    );
  };

  return (
    <div className="dashboard-container" style={{ display: "flex", height: "100vh" }}>
      <Sidebar />
      <main className="main-content" style={{ flex: 1, padding: '1rem', overflowY: 'auto' }}>
        <Header title="Faculty Management" />
        <div className="dashboard-content" style={{ marginTop: '140px' }}>
          {/* Welcome Section */}
          <div className="welcome-section" style={{ marginBottom: '30px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
              <FontAwesomeIcon 
                icon={faChalkboardTeacher} 
                style={{ fontSize: 32, color: '#f97316' }}
              />
              <h2 style={{ margin: 0 }}>Faculty Management</h2>
            </div>
            <p style={{ margin: 0 }}>Manage instructors and faculty members</p>
          </div>

          {/* Filters */}
          <div style={{
            background: '#fff',
            padding: '16px',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
            marginBottom: '20px'
          }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                style={{
                  padding: '12px 16px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  minWidth: '180px',
                  background: '#fff',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
                  outline: 'none',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#2563eb';
                  e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.1), 0 2px 8px rgba(0, 0, 0, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e5e7eb';
                  e.target.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.05)';
                }}
              >
                <option value="all">All Departments</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
              {filteredInstructors.length > 0 && (
                <button
                  onClick={exportInstructorsToExcel}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #0f2c63 0%, #1e40af 100%)',
                    color: '#fff',
                    fontWeight: '600',
                    cursor: 'pointer',
                    fontSize: '14px',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = ''}
                >
                  <FontAwesomeIcon icon={faDownload} />
                  Export Excel
                </button>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 30 }}>
            <div style={{ display: "flex", gap: 15 }}>
              <button
                onClick={() => setActiveTab("active")}
                style={{ ...btnStyle(activeTab === "active" ? "#059669" : "#6b7280"), transform: activeTab === "active" ? "scale(1.05)" : "scale(1)" }}
              >
                Active ({instructors.filter(i => i.status === "active").length})
              </button>
              <button
                onClick={() => setActiveTab("pending")}
                style={{ ...btnStyle(activeTab === "pending" ? "#d97706" : "#6b7280"), transform: activeTab === "pending" ? "scale(1.05)" : "scale(1)" }}
              >
                Pending ({instructors.filter(i => i.status === "pending").length})
              </button>
              <button
                onClick={() => setActiveTab("archived")}
                style={{ ...btnStyle(activeTab === "archived" ? "#b91c1c" : "#6b7280"), transform: activeTab === "archived" ? "scale(1.05)" : "scale(1)" }}
              >
                Archived ({instructors.filter(i => i.status === "archived").length})
              </button>
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              {!isSelectMode ? (
                <>
                  <button
                    style={btnStyle("#7c3aed")}
                    onClick={() => setIsSelectMode(true)}
                    onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
                    onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
                  >
                    <FontAwesomeIcon icon={faListCheck} /> Select Multiple
                  </button>
                  <button
                    style={btnStyle("#2563eb")}
                    onClick={() => setShowAddModal(true)}
                    onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
                    onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
                  >
                    <FontAwesomeIcon icon={faPlus} /> Add Instructor
                  </button>
                </>
              ) : (
                <>
                  <button
                    style={btnStyle("#6b7280")}
                    onClick={() => {
                      setIsSelectMode(false);
                      setSelectedIds(new Set());
                    }}
                  >
                    Cancel
                  </button>
                  {selectedIds.size > 0 && (
                    <>
                      {activeTab === "active" && (
                        <button
                          style={btnStyle("#059669")}
                          onClick={handleBulkArchive}
                        >
                          Archive ({selectedIds.size})
                        </button>
                      )}
                      {activeTab === "archived" && (
                        <button
                          style={btnStyle("#dc2626")}
                          onClick={handleBulkDelete}
                        >
                          Delete ({selectedIds.size})
                        </button>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Bulk Selection Header */}
          {isSelectMode && (
            <div style={{
              background: "#fff",
              padding: "12px 16px",
              borderRadius: "10px",
              marginBottom: "16px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            }}>
              <button
                onClick={handleSelectAll}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 14,
                  fontWeight: 600,
                  color: "#374151",
                }}
              >
                <FontAwesomeIcon
                  icon={selectedIds.size === filteredInstructors.length ? faCheckSquare : faSquare}
                  style={{ fontSize: 18, color: "#3b82f6" }}
                />
                {selectedIds.size === filteredInstructors.length ? "Deselect All" : "Select All"}
              </button>
              <span style={{ fontSize: 14, fontWeight: 600, color: "#6b7280" }}>
                {selectedIds.size} selected
              </span>
            </div>
          )}

          {loading ? (
            <div style={{
              background: '#fff',
              padding: '24px',
              borderRadius: '12px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
            }}>
              <SkeletonTable rows={5} cols={7} />
            </div>
          ) : filteredInstructors.length === 0 ? (
            <EmptyState
              icon={faUserPlus}
              title={`No ${activeTab} instructors`}
              message={
                activeTab === "active" 
                  ? "Get started by adding your first instructor to the system."
                  : activeTab === "pending"
                  ? "No instructors are currently pending registration."
                  : "No archived instructors found."
              }
              actionLabel={activeTab === "active" ? "Add Your First Instructor" : undefined}
              onAction={activeTab === "active" ? () => setShowAddModal(true) : undefined}
            />
          ) : (
            <div style={{ overflowX: "auto", borderRadius: 10, boxShadow: "0 4px 15px rgba(0,0,0,0.2)" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", background: "white", borderRadius: 10, overflow: "hidden" }}>
                <thead style={{ background: "#0f2c63", color: "white" }}>
                  <tr>
                    {isSelectMode && (
                      <th style={{ padding: 14, textAlign: "left", fontSize: 14, fontWeight: "700", width: "50px" }}>
                        <FontAwesomeIcon icon={faSquare} style={{ color: "#9ca3af", fontSize: 16 }} />
                      </th>
                    )}
                    <TableSortHeader
                      sortKey="instructorId"
                      currentSort={sortConfig}
                      onSort={handleSort}
                      style={{
                        padding: 14,
                        fontSize: 14,
                        fontWeight: "700",
                        whiteSpace: "nowrap",
                        background: sortConfig.key === 'instructorId' ? 'rgba(255, 255, 255, 0.1)' : 'transparent'
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        Instructor ID
                        <span style={{ 
                          fontSize: "10px", 
                          color: "#f97316", 
                          fontWeight: "500",
                          background: "rgba(249, 115, 22, 0.1)",
                          padding: "2px 6px",
                          borderRadius: "4px"
                        }}>
                          Unique ID
                        </span>
                      </div>
                    </TableSortHeader>
                    <TableSortHeader
                      sortKey="name"
                      currentSort={sortConfig}
                      onSort={handleSort}
                      style={{
                        padding: 14,
                        fontSize: 14,
                        fontWeight: "700",
                        whiteSpace: "nowrap",
                        background: sortConfig.key === 'name' ? 'rgba(255, 255, 255, 0.1)' : 'transparent'
                      }}
                    >
                      Name
                    </TableSortHeader>
                    <TableSortHeader
                      sortKey="email"
                      currentSort={sortConfig}
                      onSort={handleSort}
                      style={{
                        padding: 14,
                        fontSize: 14,
                        fontWeight: "700",
                        whiteSpace: "nowrap",
                        background: sortConfig.key === 'email' ? 'rgba(255, 255, 255, 0.1)' : 'transparent'
                      }}
                    >
                      Email
                    </TableSortHeader>
                    <TableSortHeader
                      sortKey="contact"
                      currentSort={sortConfig}
                      onSort={handleSort}
                      style={{
                        padding: 14,
                        fontSize: 14,
                        fontWeight: "700",
                        whiteSpace: "nowrap",
                        background: sortConfig.key === 'contact' ? 'rgba(255, 255, 255, 0.1)' : 'transparent'
                      }}
                    >
                      Contact Number
                    </TableSortHeader>
                    <TableSortHeader
                      sortKey="department"
                      currentSort={sortConfig}
                      onSort={handleSort}
                      style={{
                        padding: 14,
                        fontSize: 14,
                        fontWeight: "700",
                        whiteSpace: "nowrap",
                        background: sortConfig.key === 'department' ? 'rgba(255, 255, 255, 0.1)' : 'transparent'
                      }}
                    >
                      Department
                    </TableSortHeader>
                    <th style={{ padding: 14, textAlign: "left", fontSize: 14, fontWeight: "700", whiteSpace: "nowrap" }}>
                      Status
                    </th>
                    <th style={{ padding: 14, textAlign: "left", fontSize: 14, fontWeight: "700", whiteSpace: "nowrap" }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInstructors.length === 0 ? (
                    <tr>
                      <td colSpan={isSelectMode ? 8 : 7} style={{ padding: 40, textAlign: "center", color: "#6b7280" }}>
                        No instructors found in this category.
                      </td>
                    </tr>
                  ) : (
                    filteredInstructors.map((inst, index) => (
                      <tr
                        key={inst._id}
                        style={{ 
                          borderBottom: "1px solid #f1f5f9", 
                          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                          background: selectedIds.has(inst._id) ? "#eff6ff" : index % 2 === 0 ? "white" : "#fafafa",
                          cursor: "default",
                          animation: `fadeInUp 0.4s ease-out ${index * 0.03}s both`
                        }}
                        onMouseEnter={(e) => {
                          if (!selectedIds.has(inst._id)) {
                            e.currentTarget.style.background = "#f0f9ff";
                            e.currentTarget.style.transform = "scale(1.01)";
                            e.currentTarget.style.boxShadow = "0 2px 8px rgba(15, 44, 99, 0.1)";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!selectedIds.has(inst._id)) {
                            e.currentTarget.style.background = index % 2 === 0 ? "white" : "#fafafa";
                            e.currentTarget.style.transform = "scale(1)";
                            e.currentTarget.style.boxShadow = "none";
                          }
                        }}
                      >
                        {isSelectMode && (
                          <td style={{ padding: 14 }}>
                            <button
                              onClick={() => handleToggleSelect(inst._id)}
                              style={{
                                background: "transparent",
                                border: "none",
                                cursor: "pointer",
                                padding: 0,
                              }}
                            >
                              <FontAwesomeIcon
                                icon={selectedIds.has(inst._id) ? faCheckSquare : faSquare}
                                style={{ 
                                  fontSize: 18, 
                                  color: selectedIds.has(inst._id) ? "#3b82f6" : "#9ca3af" 
                                }}
                              />
                            </button>
                          </td>
                        )}
                        <td style={{ padding: 14, fontSize: 14, fontWeight: "600", color: "#0f2c63" }}>
                          {inst.instructorId && inst.instructorId.trim() !== "" ? (
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <span style={{
                                background: "linear-gradient(135deg, #0f2c63 0%, #f97316 100%)",
                                color: "white",
                                padding: "4px 8px",
                                borderRadius: "6px",
                                fontSize: "12px",
                                fontWeight: "700",
                                letterSpacing: "0.5px",
                                display: "inline-block",
                                minWidth: "60px",
                                textAlign: "center"
                              }}>
                                ID-{inst.instructorId}
                              </span>
                              <button
                                onClick={() => copyToClipboard(inst.instructorId)}
                                style={{
                                  background: "transparent",
                                  border: "none",
                                  color: "#6b7280",
                                  cursor: "pointer",
                                  padding: "4px",
                                  borderRadius: "4px",
                                  transition: "all 0.2s ease"
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.color = "#0f2c63";
                                  e.currentTarget.style.background = "#f3f4f6";
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.color = "#6b7280";
                                  e.currentTarget.style.background = "transparent";
                                }}
                                title="Copy Instructor ID"
                              >
                                <FontAwesomeIcon icon={faCopy} size="sm" />
                              </button>
                            </div>
                          ) : (
                            <span style={{ 
                              color: "#9ca3af", 
                              fontStyle: "italic",
                              fontSize: "12px"
                            }}>
                              Pending
                            </span>
                          )}
                        </td>
                        <td style={{ padding: 14, fontSize: 14, fontWeight: "600" }}>
                          {(inst.firstname && inst.lastname) ? `${inst.firstname} ${inst.lastname}` : inst.name || <span style={{ color: "#9ca3af", fontStyle: "italic" }}>Pending Registration</span>}
                        </td>
                        <td style={{ padding: 14, fontSize: 14 }}>{inst.email}</td>
                        <td style={{ padding: 14, fontSize: 14 }}>{inst.contact || <span style={{ color: "#9ca3af" }}>---</span>}</td>
                        <td style={{ padding: 14, fontSize: 14 }}>{inst.department || <span style={{ color: "#9ca3af" }}>---</span>}</td>
                        <td style={{ padding: 14 }}>
                          <span
                            style={{
                              padding: "4px 12px",
                              borderRadius: 6,
                              fontSize: 12,
                              fontWeight: "700",
                              textTransform: "uppercase",
                              background: inst.status === "active" ? "#dcfce7" : inst.status === "pending" ? "#fef3c7" : "#fee2e2",
                              color: inst.status === "active" ? "#16a34a" : inst.status === "pending" ? "#d97706" : "#dc2626",
                            }}
                          >
                            {inst.status}
                          </span>
                        </td>
                        <td style={{ padding: 14 }}>
                          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                            {inst.status !== "archived" && (
                              <button
                                onClick={() => handleArchive(inst._id)}
                                style={btnStyle("#dc2626")}
                                onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
                                onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                              >
                                <FontAwesomeIcon icon={faTrash} /> Archive
                              </button>
                            )}
                            {inst.status === "archived" && (
                              <>
                                <button
                                  onClick={() => handleRestore(inst._id)}
                                  style={btnStyle("#10b981")}
                                  onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
                                  onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                                >
                                  <FontAwesomeIcon icon={faUserPlus} /> Restore
                                </button>
                                <button
                                  onClick={() => handlePermanentDelete(inst._id)}
                                  style={btnStyle("#991b1b")}
                                  onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
                                  onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                                >
                                  <FontAwesomeIcon icon={faTrashAlt} /> Delete
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => window.open(`/admin/instructor/${inst._id}/workload`, '_blank')}
                              style={btnStyle("#2563eb")}
                              onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
                              onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                            >
                              <FontAwesomeIcon icon={faListCheck} /> View Workload
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Add Instructor Modal */}
      <Modal
        show={showAddModal}
        onClose={() => !addLoading && setShowAddModal(false)}
        title="Add Instructor"
        actions={
          <>
            <button onClick={() => setShowAddModal(false)} style={btnStyle("#6b7280")} disabled={addLoading}>
              Cancel
            </button>
            <button
              type="submit"
              form="addInstructorForm"
              disabled={addLoading}
              style={{
                ...btnStyle("#2563eb"),
                opacity: addLoading ? 0.7 : 1,
                cursor: addLoading ? "not-allowed" : "pointer",
              }}
            >
              {addLoading ? "Sending..." : "Send Registration Link"}
            </button>
          </>
        }
      >
        <form
          id="addInstructorForm"
          onSubmit={handleAddInstructor}
          style={{ display: "flex", flexDirection: "column", gap: 16 }}
        >
          <p style={{ fontSize: 14, color: "#6b7280", margin: 0, lineHeight: 1.6 }}>
            Enter the instructor's email and department. A registration link will be sent where they can complete their profile.
          </p>

          <div>
            <label style={{ display: "block", marginBottom: 6, fontWeight: "600", fontSize: 14 }}>
              Instructor Email *
            </label>
            <input
              type="email"
              placeholder="instructor@buksu.edu.ph"
              value={addEmail}
              onChange={(e) => setAddEmail(e.target.value)}
              required
              disabled={addLoading}
              style={{
                width: "100%",
                padding: "12px 16px",
                border: "2px solid #e5e7eb",
                borderRadius: 10,
                fontSize: 14,
                outline: "none",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                background: "#fff",
                boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#2563eb";
                e.target.style.boxShadow = "0 0 0 3px rgba(37, 99, 235, 0.1), 0 2px 8px rgba(0, 0, 0, 0.1)";
                e.target.style.transform = "translateY(-1px)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#e5e7eb";
                e.target.style.boxShadow = "0 1px 3px rgba(0, 0, 0, 0.05)";
                e.target.style.transform = "translateY(0)";
              }}
            />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: 6, fontWeight: "600", fontSize: 14 }}>
              Department *
            </label>
            <input
              type="text"
              placeholder="e.g., Computer Science, Mathematics, Engineering"
              value={addDepartment}
              onChange={(e) => setAddDepartment(e.target.value)}
              required
              disabled={addLoading}
              style={{
                width: "100%",
                padding: "12px 16px",
                border: "2px solid #e5e7eb",
                borderRadius: 10,
                fontSize: 14,
                outline: "none",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                background: "#fff",
                boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#2563eb";
                e.target.style.boxShadow = "0 0 0 3px rgba(37, 99, 235, 0.1), 0 2px 8px rgba(0, 0, 0, 0.1)";
                e.target.style.transform = "translateY(-1px)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#e5e7eb";
                e.target.style.boxShadow = "0 1px 3px rgba(0, 0, 0, 0.05)";
                e.target.style.transform = "translateY(0)";
              }}
            />
          </div>
        </form>
      </Modal>

      {/* Complete Registration Modal */}
      <Modal
        show={showCompleteRegModal}
        onClose={() => !completeRegLoading && setShowCompleteRegModal(false)}
        title="Complete Instructor Registration"
        actions={
          <>
            <button onClick={() => setShowCompleteRegModal(false)} disabled={completeRegLoading} style={btnStyle("#6b7280")}>
              Cancel
            </button>
            <button
              form="completeRegForm"
              type="submit"
              disabled={completeRegLoading}
              style={{ ...btnStyle("#10b981"), opacity: completeRegLoading ? 0.7 : 1 }}
            >
              {completeRegLoading ? "Completing..." : "Complete Registration"}
            </button>
          </>
        }
      >
        <form id="completeRegForm" onSubmit={handleCompleteRegSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {['email', 'firstname', 'lastname', 'contact', 'department', 'password'].map((field) => (
            <input
              key={field}
              type={field === 'email' ? 'email' : field === 'password' ? 'password' : 'text'}
              name={field}
              placeholder={field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1')}
              value={completeRegData[field]}
              onChange={handleCompleteRegChange}
              required
              disabled={completeRegLoading}
              minLength={field === 'password' ? 6 : undefined}
              style={{
                width: "100%",
                padding: "12px 16px",
                border: "2px solid #e5e7eb",
                borderRadius: 10,
                fontSize: 14,
                outline: "none",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                background: "#fff",
                boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#2563eb";
                e.target.style.boxShadow = "0 0 0 3px rgba(37, 99, 235, 0.1), 0 2px 8px rgba(0, 0, 0, 0.1)";
                e.target.style.transform = "translateY(-1px)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#e5e7eb";
                e.target.style.boxShadow = "0 1px 3px rgba(0, 0, 0, 0.05)";
                e.target.style.transform = "translateY(0)";
              }}
            />
          ))}
        </form>
      </Modal>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        show={confirmDialog.show}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm || (() => {})}
        onCancel={() => setConfirmDialog({ show: false, title: "", message: "", onConfirm: null, destructive: false })}
        destructive={confirmDialog.destructive}
        confirmText={confirmDialog.destructive ? "Delete" : "Confirm"}
      />
    </div>
  );
};

export default FacultyManagement;
