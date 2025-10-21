import React, { useState, useEffect } from "react";
import Sidebar from "../common/Sidebar.jsx";
import Header from "../common/Header.jsx";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faClock,
  faTrash,
  faPlus,
  faEye,
  faEdit,
  faTrashAlt,
  faUserPlus,
  faCheck,
  faTimes,
} from "@fortawesome/free-solid-svg-icons";

const Modal = ({ show, onClose, title, children, actions }) => {
  if (!show) return null;
  return (
    <>
      <div
        style={{
          position: "fixed",
          zIndex: 1000,
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          background: "rgba(0,0,0,0.5)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
        onClick={onClose}
      >
        <div
          style={{
            position: "relative",
            zIndex: 1001,
            background: "white",
            padding: 32,
            borderRadius: 14,
            minWidth: 360,
            maxWidth: "90vw",
            maxHeight: "90vh",
            overflowY: "auto",
            boxShadow: "0 20px 40px rgba(0,0,0,0.25)",
            fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
            display: "flex",
            flexDirection: "column",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {title && <h2 style={{ margin: "0 0 16px 0", fontWeight: 700 }}>{title}</h2>}
          <div style={{ marginBottom: 16 }}>{children}</div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>{actions}</div>
        </div>
      </div>
    </>
  );
};

const FacultyManagement = () => {
  const [activeTab, setActiveTab] = useState("active");
  const [instructors, setInstructors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newInstructorName, setNewInstructorName] = useState("");
  const [newInstructorEmail, setNewInstructorEmail] = useState("");
  const [newInstructorContact, setNewInstructorContact] = useState("");
  const [newInstructorDepartment, setNewInstructorDepartment] = useState("");

  const [showEditModal, setShowEditModal] = useState(false);
  const [editInstructor, setEditInstructor] = useState(null);
  const [editEmail, setEditEmail] = useState("");
  const [editContact, setEditContact] = useState("");

  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedInstructor, setSelectedInstructor] = useState(null);

  const [confirmModal, setConfirmModal] = useState({
    show: false,
    title: "",
    message: "",
    onConfirm: null,
    onCancel: null,
    confirmText: "Confirm",
    cancelText: "Cancel",
  });

  const [alertModal, setAlertModal] = useState({ show: false, message: "" });

  useEffect(() => {
    setLoading(true);
    fetch("http://localhost:5000/api/instructors")
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("Network response was not ok"))))
      .then((data) => {
        setInstructors(data);
        setLoading(false);
      })
      .catch((e) => {
        setError("Failed to fetch instructors: " + e.message);
        setLoading(false);
      });
  }, []);

  const filteredInstructors = instructors.filter((inst) => {
    if (activeTab === "active") return inst.status === "active";
    if (activeTab === "pending") return inst.status === "pending";
    if (activeTab === "trash") return inst.status === "deleted";
    return true;
  });

  const openAddModal = () => setShowAddModal(true);
  const closeAddModal = () => setShowAddModal(false);

  const openEditModal = (instructor) => {
    setEditInstructor(instructor);
    setEditEmail(instructor.email);
    setEditContact(instructor.contact || "");
    setShowEditModal(true);
  };
  const closeEditModal = () => setShowEditModal(false);

  const openScheduleModal = (instructor) => {
    setSelectedInstructor(instructor);
    setShowScheduleModal(true);
  };
  const closeScheduleModal = () => setShowScheduleModal(false);

  const showConfirmDialog = (title, message, onConfirm) => {
    setConfirmModal({
      show: true,
      title,
      message,
      onConfirm: () => {
        onConfirm();
        setConfirmModal((s) => ({ ...s, show: false }));
      },
      onCancel: () => setConfirmModal((s) => ({ ...s, show: false })),
      confirmText: "Yes",
      cancelText: "No",
    });
  };

  const showAlert = (message) => setAlertModal({ show: true, message });

  const handleAddInstructor = (e) => {
    e.preventDefault();
    const payload = {
      name: newInstructorName,
      email: newInstructorEmail,
      contact: newInstructorContact,
      department: newInstructorDepartment,
      status: "active",
    };
    fetch("http://localhost:5000/api/instructors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("Failed to add instructor"))))
      .then((newInstructor) => {
        setInstructors((prev) => [...prev, newInstructor]);
        closeAddModal();
        setNewInstructorName("");
        setNewInstructorEmail("");
        setNewInstructorContact("");
        setNewInstructorDepartment("");
        showAlert("Instructor added and activated by admin.");
      })
      .catch((err) => {
        if (err.message.includes("duplicate key")) {
          showAlert("An instructor with this email already exists.");
        } else {
          showAlert(err.message);
        }
      });
  };

  const handleEditSave = () => {
    fetch(`http://localhost:5000/api/instructors/${editInstructor._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: editEmail, contact: editContact }),
    })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("Failed to update instructor"))))
      .then((updatedInstructor) => {
        setInstructors((prev) =>
          prev.map((inst) => (inst._id === updatedInstructor._id ? updatedInstructor : inst))
        );
        closeEditModal();
        showAlert("Instructor updated successfully.");
      })
      .catch((err) => {
        showAlert(err.message);
      });
  };

  const handleApprove = (id) =>
    showConfirmDialog("Approve Instructor", "Approve this instructor?", () => {
      setInstructors((prev) =>
        prev.map((i) => (i._id === id ? { ...i, status: "active" } : i))
      );
      showAlert("Instructor approved.");
    });

  const handleReject = (id) =>
    showConfirmDialog("Reject Instructor", "Reject this instructor?", () => {
      setInstructors((prev) =>
        prev.map((i) =>
          i._id === id ? { ...i, status: "deleted", deletedDate: new Date().toISOString().split("T")[0] } : i
        )
      );
      showAlert("Instructor rejected.");
    });

  const handleDelete = (id) =>
    showConfirmDialog("Move to Trash", "Move this instructor to trash?", () => {
      setInstructors((prev) =>
        prev.map((i) =>
          i._id === id ? { ...i, status: "deleted", deletedDate: new Date().toISOString().split("T")[0] } : i
        )
      );
      showAlert("Instructor moved to trash.");
    });

    const handleViewSchedule = (instructorId) => {
      const instructor = instructors.find((inst) => inst._id === instructorId);
      setSelectedInstructor(instructor);
      setShowScheduleModal(true);
    };
    

  const handlePermanentDelete = (id) =>
    showConfirmDialog("Delete Permanently", "Permanently delete this instructor?", () => {
      setInstructors((prev) => prev.filter((i) => i._id !== id));
      showAlert("Instructor permanently deleted.");
    });

  // Reusable styled button for actions with icon + text
  const ActionButton = ({ onClick, bg, hover, title, icon, text }) => {
    const [hovered, setHovered] = useState(false);
    return (
      <button
        onClick={onClick}
        title={title}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          padding: "8px 14px",
          borderRadius: 6,
          border: "none",
          cursor: "pointer",
          backgroundColor: hovered ? hover : bg,
          color: "white",
          fontSize: 14,
          display: "flex",
          alignItems: "center",
          gap: 6,
          minHeight: 36,
          userSelect: "none",
          outline: "none",
          whiteSpace: "nowrap",
        }}
      >
        <FontAwesomeIcon icon={icon} />
        {text}
      </button>
    );
  };

  return (
    <div className="dashboard-container">
      <Sidebar />
      <main className="main-content">
        <Header title="Faculty Management" />
        <div
          style={{
            padding: 30,
            background: "linear-gradient(135deg, #0f2c63 0%, #f97316 100%)",
            minHeight: "calc(100vh - 80px)",
            overflowY: "auto",
          }}
        >
          <div
            style={{
              background: "#dedede",
              padding: 30,
              borderRadius: 15,
              boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
              marginBottom: 30,
              borderLeft: "5px solid #0f2c63",
            }}
          >
            <h2 style={{ margin: 0, color: "#1e293b", fontSize: 28, fontWeight: 700 }}>
              <FontAwesomeIcon icon={faUserPlus} style={{ marginRight: 15, color: "#0f2c63" }} />
              Faculty Management
            </h2>
            <p style={{ margin: 0, color: "#64748b", fontSize: 16 }}>
              Manage instructors and faculty members
            </p>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 30 }}>
            <div style={{ display: "flex", gap: 15 }}>
              <button
                onClick={() => setActiveTab("active")}
                style={{
                  padding: "12px 24px",
                  background: activeTab === "active" ? "linear-gradient(135deg, #10b981 0%, #059669 100%)" : "#f1f5f9",
                  color: activeTab === "active" ? "white" : "#64748b",
                  border: "none",
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  boxShadow: activeTab === "active" ? "0 4px 15px rgba(16, 185, 129, 0.3)" : "none",
                }}
              >
                Active ({instructors.filter((i) => i.status === "active").length})
              </button>
              <button
                onClick={() => setActiveTab("pending")}
                style={{
                  padding: "12px 24px",
                  background: activeTab === "pending" ? "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)" : "#f1f5f9",
                  color: activeTab === "pending" ? "white" : "#64748b",
                  border: "none",
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  boxShadow: activeTab === "pending" ? "0 4px 15px rgba(245, 158, 11, 0.3)" : "none",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <FontAwesomeIcon icon={faClock} />
                Pending ({instructors.filter((i) => i.status === "pending").length})
              </button>
              <button
                onClick={() => setActiveTab("trash")}
                style={{
                  padding: "12px 24px",
                  background: activeTab === "trash" ? "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)" : "#f1f5f9",
                  color: activeTab === "trash" ? "white" : "#64748b",
                  border: "none",
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  boxShadow: activeTab === "trash" ? "0 4px 15px rgba(220, 38, 38, 0.3)" : "none",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <FontAwesomeIcon icon={faTrash} />
                Trash ({instructors.filter((i) => i.status === "deleted").length})
              </button>
            </div>

            <button
              onClick={openAddModal}
              style={{
                padding: "12px 24px",
                background: "linear-gradient(135deg, #2563eb 0%, #1e40af 100%)",
                color: "white",
                border: "none",
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                boxShadow: "0 4px 15px rgba(37, 99, 235, 0.15)",
              }}
            >
              <FontAwesomeIcon icon={faPlus} style={{ marginRight: 8 }} />
              Add Instructor
            </button>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "separate",
                borderSpacing: "0 10px",
                fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
                minWidth: 900,
                boxShadow: "0 8px 20px rgba(0,0,0,0.12)",
                borderRadius: 14,
                overflow: "hidden",
                backgroundColor: "white",
              }}
            >
              <thead
                style={{
                  backgroundColor: "#0f2c63",
                  color: "white",
                  userSelect: "none",
                  fontSize: 16,
                }}
              >
                <tr>
                  {[
                    "Instructor ID",
                    "Name",
                    "Email",
                    "Contact Number",
                    "Department",
                    "Status",
                    "Actions",
                  ].map((header) => (
                    <th
                      key={header}
                      style={{
                        padding: "18px 24px",
                        fontWeight: 700,
                        borderBottom: "2px solid #164e94",
                        textAlign: "left",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody style={{ fontSize: 15 }}>
                {filteredInstructors.length === 0 && !loading ? (
                  <tr>
                    <td
                      colSpan={7}
                      style={{ padding: 30, textAlign: "center", color: "#64748b" }}
                    >
                      No instructors found.
                    </td>
                  </tr>
                ) : (
                  filteredInstructors.map((inst, idx) => (
                    <tr
                      key={inst._id}
                      style={{
                        backgroundColor: idx % 2 === 0 ? "white" : "#f7f9fc",
                        cursor: "default",
                        transition: "background-color 0.2s",
                        boxShadow: "inset 0 -1px 0 #dadde1",
                        userSelect: "none",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#e4edff")}
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.backgroundColor =
                          idx % 2 === 0 ? "white" : "#f7f9fc")
                      }
                    >
                      <td
                        style={{
                          padding: "16px 24px",
                          fontWeight: 600,
                          color: "#0f2c63",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {inst.instructorId || "-"}
                      </td>
                      <td style={{ padding: "16px 24px", fontWeight: 600, color: "#0f2c63" }}>
                        {inst.name}
                      </td>
                      <td style={{ padding: "16px 24px", color: "#212529" }}>
                        {inst.email}
                      </td>
                      <td style={{ padding: "16px 24px", color: "#212529" }}>
                        {inst.contact || "-"}
                      </td>
                      <td style={{ padding: "16px 24px", color: "#212529" }}>
                        {inst.department || "-"}
                      </td>
                      <td
                        style={{
                          padding: "16px 24px",
                          fontWeight: 700,
                          fontSize: 14,
                          color:
                            inst.status === "active"
                              ? "#059669"
                              : inst.status === "pending"
                              ? "#d97706"
                              : inst.status === "deleted"
                              ? "#b91c1c"
                              : "#444",
                        }}
                      >
                        {inst.status.charAt(0).toUpperCase() + inst.status.slice(1)}
                      </td>
                      <td style={{ padding: "12px 20px" }}>
                        <div
                          style={{
                            display: "flex",
                            gap: 12,
                            flexWrap: "wrap",
                            justifyContent: "flex-start",
                            alignItems: "center",
                          }}
                        >
                          <button
                            onClick={() => handleViewSchedule(inst._id)}
                            title="View Schedule"
                            style={{
                              padding: "8px 14px",
                              backgroundColor: "#0f2c63",
                              color: "white",
                              border: "none",
                              borderRadius: 6,
                              cursor: "pointer",
                              fontSize: 14,
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
                            }}
                          >
                            <FontAwesomeIcon icon={faEye} />
                            View
                          </button>

                          <button
                            onClick={() => openEditModal(inst)}
                            title="Edit Instructor"
                            style={{
                              padding: "8px 14px",
                              backgroundColor: "#2563eb",
                              color: "white",
                              border: "none",
                              borderRadius: 6,
                              cursor: "pointer",
                              fontSize: 14,
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
                            }}
                          >
                            <FontAwesomeIcon icon={faEdit} />
                            Edit
                          </button>

                          {activeTab === "pending" && (
                            <>
                              <button
                                onClick={() => handleApprove(inst._id)}
                                title="Approve Instructor"
                                style={{
                                  padding: "8px 14px",
                                  backgroundColor: "#16a34a",
                                  color: "white",
                                  border: "none",
                                  borderRadius: 6,
                                  cursor: "pointer",
                                  fontSize: 14,
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 6,
                                }}
                              >
                                <FontAwesomeIcon icon={faCheck} />
                                Approve
                              </button>
                              <button
                                onClick={() => handleReject(inst._id)}
                                title="Reject Instructor"
                                style={{
                                  padding: "8px 14px",
                                  backgroundColor: "#dc2626",
                                  color: "white",
                                  border: "none",
                                  borderRadius: 6,
                                  cursor: "pointer",
                                  fontSize: 14,
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 6,
                                }}
                              >
                                <FontAwesomeIcon icon={faTimes} />
                                Reject
                              </button>
                            </>
                          )}
                          {activeTab === "trash" && (
                            <button
                              onClick={() => handlePermanentDelete(inst._id)}
                              title="Delete Permanently"
                              style={{
                                padding: "8px 14px",
                                backgroundColor: "#b91c1c",
                                color: "white",
                                border: "none",
                                borderRadius: 6,
                                cursor: "pointer",
                                fontSize: 14,
                                display: "flex",
                                alignItems: "center",
                                gap: 6,
                              }}
                            >
                              <FontAwesomeIcon icon={faTrashAlt} />
                              Delete Permanently
                            </button>
                          )}
                          {activeTab === "active" && (
                            <button
                              onClick={() => handleDelete(inst._id)}
                              title="Move to Trash"
                              style={{
                                padding: "8px 14px",
                                backgroundColor: "#dc2626",
                                color: "white",
                                border: "none",
                                borderRadius: 6,
                                cursor: "pointer",
                                fontSize: 14,
                                display: "flex",
                                alignItems: "center",
                                gap: 6,
                              }}
                            >
                              <FontAwesomeIcon icon={faTrash} />
                              Archive
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Add Instructor Modal */}
          {showAddModal && (
            <Modal
              show={showAddModal}
              onClose={closeAddModal}
              title="Add Instructor"
              actions={
                <>
                  <button onClick={closeAddModal}>Cancel</button>
                  <button
                    type="submit"
                    form="addInstructorForm"
                    style={{
                      backgroundColor: "#2563eb",
                      color: "white",
                      border: "none",
                      padding: "10px 20px",
                      borderRadius: 6,
                      cursor: "pointer",
                    }}
                  >
                    Add
                  </button>
                </>
              }
            >
              <form
                id="addInstructorForm"
                onSubmit={handleAddInstructor}
                style={{ display: "flex", flexDirection: "column", gap: 16 }}
              >
                <input
                  type="text"
                  value={newInstructorName}
                  onChange={(e) => setNewInstructorName(e.target.value)}
                  placeholder="Instructor Name"
                  required
                  style={{
                    padding: 14,
                    borderRadius: 10,
                    border: "1.5px solid #ddd",
                    fontSize: 18,
                    outline: "none",
                    boxShadow: "inset 1px 1px 6px #ccc",
                    transition: "border-color 0.3s ease",
                  }}
                />
                <input
                  type="email"
                  value={newInstructorEmail}
                  onChange={(e) => setNewInstructorEmail(e.target.value)}
                  placeholder="Instructor Email"
                  required
                  style={{
                    padding: 14,
                    borderRadius: 10,
                    border: "1.5px solid #ddd",
                    fontSize: 18,
                    outline: "none",
                    boxShadow: "inset 1px 1px 6px #ccc",
                    transition: "border-color 0.3s ease",
                  }}
                />
                <input
                  type="tel"
                  value={newInstructorContact}
                  onChange={(e) => setNewInstructorContact(e.target.value)}
                  placeholder="Contact Number"
                  required
                  style={{
                    padding: 14,
                    borderRadius: 10,
                    border: "1.5px solid #ddd",
                    fontSize: 18,
                    outline: "none",
                    boxShadow: "inset 1px 1px 6px #ccc",
                    transition: "border-color 0.3s ease",
                  }}
                />
                <input
                  type="text"
                  value={newInstructorDepartment}
                  onChange={(e) => setNewInstructorDepartment(e.target.value)}
                  placeholder="Department"
                  required
                  style={{
                    padding: 14,
                    borderRadius: 10,
                    border: "1.5px solid #ddd",
                    fontSize: 18,
                    outline: "none",
                    boxShadow: "inset 1px 1px 6px #ccc",
                    transition: "border-color 0.3s ease",
                  }}
                />
              </form>
            </Modal>
          )}

          {/* Edit Instructor Modal */}
          {showEditModal && (
            <div
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                width: "100vw",
                height: "100vh",
                background: "rgba(0,0,0,0.5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 999,
              }}
            >
              <div
                style={{
                  background: "white",
                  padding: "40px 48px",
                  borderRadius: 16,
                  minWidth: 400,
                  maxWidth: "90vw",
                  boxShadow: "0 10px 40px rgba(0,0,0,0.15)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 24,
                }}
              >
                <h3
                  style={{
                    margin: 0,
                    fontWeight: "bold",
                    fontSize: 24,
                    color: "#0f2c63",
                  }}
                >
                  Edit Instructor
                </h3>

                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  placeholder="Instructor Email"
                  required
                  style={{
                    padding: 14,
                    borderRadius: 10,
                    border: "1.5px solid #ddd",
                    fontSize: 18,
                    outline: "none",
                    boxShadow: "inset 1px 1px 6px #ccc",
                    transition: "border-color 0.3s ease",
                  }}
                />

                <input
                  type="tel"
                  value={editContact}
                  onChange={(e) => setEditContact(e.target.value)}
                  placeholder="Contact Number"
                  required
                  style={{
                    padding: 14,
                    borderRadius: 10,
                    border: "1.5px solid #ddd",
                    fontSize: 18,
                    outline: "none",
                    boxShadow: "inset 1px 1px 6px #ccc",
                    transition: "border-color 0.3s ease",
                  }}
                />

                <div style={{ display: "flex", gap: 16, marginTop: 16 }}>
                  <button
                    onClick={handleEditSave}
                    style={{
                      flex: 1,
                      padding: "14px 0",
                      background: "#2563eb",
                      color: "white",
                      border: "none",
                      borderRadius: 10,
                      fontWeight: "700",
                      fontSize: 18,
                      cursor: "pointer",
                      boxShadow: "0 6px 15px rgba(37, 99, 235, 0.5)",
                      transition: "background-color 0.3s ease",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "#1d4ed8")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "#2563eb")
                    }
                  >
                    Save
                  </button>

                  <button
                    onClick={() => setShowEditModal(false)}
                    style={{
                      flex: 1,
                      padding: "14px 0",
                      background: "#f3f4f6",
                      color: "#374151",
                      borderRadius: 10,
                      fontWeight: "700",
                      fontSize: 18,
                      cursor: "pointer",
                      border: "none",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "#e5e7eb")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "#f3f4f6")
                    }
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Schedule Modal */}
          {showScheduleModal && (
            <Modal
              show={showScheduleModal}
              onClose={closeScheduleModal}
              title={`Schedule for ${selectedInstructor?.name || ""}`}
              actions={<button onClick={closeScheduleModal}>Close</button>}
            >
              <p>Schedule details will appear here.</p>
            </Modal>
          )}

          {/* Confirm Modal */}
          <Modal
            show={confirmModal.show}
            onClose={confirmModal.onCancel}
            title={confirmModal.title}
            actions={
              <>
                <button
                  onClick={confirmModal.onCancel}
                  style={{
                    padding: "10px 20px",
                    background: "#f3f4f6",
                    borderRadius: 6,
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  {confirmModal.cancelText}
                </button>
                <button
                  onClick={confirmModal.onConfirm}
                  style={{
                    padding: "10px 20px",
                    background: "#dc2626",
                    color: "white",
                    borderRadius: 6,
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  {confirmModal.confirmText}
                </button>
              </>
            }
          >
            {confirmModal.message}
          </Modal>

          {/* Alert Modal */}
          <Modal
            show={alertModal.show}
            onClose={() => setAlertModal({ show: false, message: "" })}
            title="Message"
            actions={
              <button
                onClick={() => setAlertModal({ show: false, message: "" })}
                style={{
                  padding: "10px 20px",
                  background: "#2563eb",
                  color: "white",
                  borderRadius: 6,
                  border: "none",
                  cursor: "pointer",
                }}
              >
                OK
              </button>
            }
          >
            {alertModal.message}
          </Modal>
        </div>
      </main>
    </div>
  );
};

export default FacultyManagement;
