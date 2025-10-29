import React, { useState, useEffect } from "react";
import Sidebar from "../common/Sidebar.jsx";
import Header from "../common/Header.jsx";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTrash,
  faPlus,
  faUserPlus,
  faTrashAlt,
  faCopy,
} from "@fortawesome/free-solid-svg-icons";
import { io } from "socket.io-client";

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
          background: "white",
          padding: 32,
          borderRadius: 14,
          minWidth: 360,
          maxWidth: "90vw",
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow: "0 20px 40px rgba(0,0,0,0.25)",
          fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {title && <h2 style={{ marginBottom: 16 }}>{title}</h2>}
        <div style={{ marginBottom: 16 }}>{children}</div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
          {actions}
        </div>
      </div>
    </div>
  );
};

const FacultyManagement = () => {
  const [activeTab, setActiveTab] = useState("active");
  const [instructors, setInstructors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alertModal, setAlertModal] = useState({ show: false, message: "" });
  const [confirmModal, setConfirmModal] = useState({
    show: false,
    title: "",
    message: "",
    onConfirm: null,
    onCancel: null,
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
  const fetchInstructors = () => {
    setLoading(true);
    fetch("http://localhost:5000/api/instructors")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch instructors");
        return res.json();
      })
      .then((data) => {
        setInstructors(data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
        showAlert("Error loading instructors.");
      });
  };

  useEffect(() => {
    fetchInstructors();

    socket.connect();

    socket.on("new-alert", (alertData) => {
      console.log("Received new alert via socket", alertData);
      fetchInstructors();
    });

    // Auto-refresh data every 30 seconds
    const autoRefreshInterval = setInterval(() => {
      fetchInstructors();
    }, 30000);

    return () => {
      socket.off("new-alert");
      socket.disconnect();
      clearInterval(autoRefreshInterval);
    };
  }, []);

  const showAlert = (message) => setAlertModal({ show: true, message });
  const showConfirm = (title, message, onConfirm) =>
    setConfirmModal({
      show: true,
      title,
      message,
      onConfirm: () => {
        onConfirm();
        setConfirmModal({ show: false });
      },
      onCancel: () => setConfirmModal({ show: false }),
    });

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      showAlert(`Instructor ID "${text}" copied to clipboard!`);
    } catch (err) {
      console.error('Failed to copy: ', err);
      showAlert("Failed to copy instructor ID to clipboard");
    }
  };


  const filteredInstructors = instructors.filter((inst) => {
    if (activeTab === "active") return inst.status === "active";
    else if (activeTab === "pending") return inst.status === "pending";
    else if (activeTab === "archived") return inst.status === "archived";
    return true;
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

  const handleArchive = (id) =>
    showConfirm("Archive Instructor", "Are you sure you want to archive this instructor?", () => {
      fetch(`http://localhost:5000/api/instructors/${id}/archive`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
      })
        .then((res) =>
          res.ok ? res.json() : Promise.reject(new Error("Failed to archive instructor"))
        )
        .then((data) => {
          if (data.success) {
            setInstructors((prev) =>
              prev.map((i) => (i._id === id ? { ...i, status: "archived" } : i))
            );
            showAlert("Instructor archived successfully.");
          }
        })
        .catch(() => showAlert("Error archiving instructor."));
    });

  const handleRestore = (id) =>
    showConfirm("Restore Instructor", "Restore this instructor to active?", () => {
      fetch(`http://localhost:5000/api/instructors/${id}/restore`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
      })
        .then((res) =>
          res.ok ? res.json() : Promise.reject(new Error("Failed to restore instructor"))
        )
        .then((data) => {
          if (data.success) {
            setInstructors((prev) =>
              prev.map((i) => (i._id === id ? { ...i, status: "active" } : i))
            );
            showAlert("Instructor restored successfully.");
          }
        })
        .catch(() => showAlert("Error restoring instructor."));
    });

  const handlePermanentDelete = (id) =>
    showConfirm(
      "Delete Permanently",
      "Are you sure you want to permanently delete this instructor?",
      () => {
        fetch(`http://localhost:5000/api/instructors/${id}/permanent`, {
          method: "DELETE",
        })
          .then((res) =>
            res.ok ? res.json() : Promise.reject(new Error("Failed to delete instructor"))
          )
          .then((data) => {
            if (data.success || data.message === "Instructor permanently deleted") {
              setInstructors((prev) => prev.filter((i) => i._id !== id));
              showAlert("Instructor deleted permanently.");
            }
          })
          .catch(() => showAlert("Error deleting instructor."));
      }
    );

  const handleAddInstructor = (e) => {
    e.preventDefault();
    setAddLoading(true);

    fetch("http://localhost:5000/api/registration/send-registration", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: addEmail,
        department: addDepartment,
      }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || data.message || "Failed to send registration email");
        }
        return data;
      })
      .then((data) => {
        setShowAddModal(false);
        setAddEmail("");
        setAddDepartment("");
        const instructorIdMsg = data.instructorId ? ` (Instructor ID: ${data.instructorId})` : '';
        showAlert(`Registration link sent successfully to ${addEmail}!${instructorIdMsg} The instructor can now complete their registration.`);
        fetchInstructors();
      })
      .catch((err) => {
        showAlert(err.message || "Error sending registration email. Please try again.");
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
      const response = await fetch("http://localhost:5000/api/instructors/complete-registration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(completeRegData),
      });

      const data = await response.json();

      if (!response.ok) {
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
      showAlert(`Registration completed successfully!${instructorId}`);
      fetchInstructors();
    } catch (error) {
      showAlert(error.message);
    } finally {
      setCompleteRegLoading(false);
    }
  };

  return (
    <div className="dashboard-container" style={{ display: "flex", height: "100vh" }}>
      <Sidebar />
      <main className="main-content" style={{ flex: 1, overflowY: "auto" }}>
        <Header title="Faculty Management" />
        <div
          style={{
            padding: 30,
            background: "linear-gradient(135deg, #0f2c63 0%, #f97316 100%)",
            minHeight: "calc(100vh - 80px)",
          }}
        >
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
            <button
              style={btnStyle("#2563eb")}
              onClick={() => setShowAddModal(true)}
              onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
            >
              <FontAwesomeIcon icon={faPlus} /> Add Instructor
            </button>
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: 40, color: "white", fontSize: 16 }}>
              Loading instructors...
            </div>
          ) : (
            <div style={{ overflowX: "auto", borderRadius: 10, boxShadow: "0 4px 15px rgba(0,0,0,0.2)" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", background: "white", borderRadius: 10, overflow: "hidden" }}>
                <thead style={{ background: "#0f2c63", color: "white" }}>
                  <tr>
                    {["Instructor ID", "Name", "Email", "Contact Number", "Department", "Status", "Actions"].map((h) => (
                      <th key={h} style={{ padding: 14, textAlign: "left", fontSize: 14, fontWeight: "700", whiteSpace: "nowrap" }}>
                        {h === "Instructor ID" ? (
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            {h}
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
                        ) : h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredInstructors.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ padding: 40, textAlign: "center", color: "#6b7280" }}>
                        No instructors found in this category.
                      </td>
                    </tr>
                  ) : (
                    filteredInstructors.map((inst) => (
                      <tr
                        key={inst._id}
                        style={{ borderBottom: "1px solid #f1f5f9", transition: "background 0.2s ease" }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#f9fafb")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "white")}
                      >
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
                padding: "10px 12px",
                border: "2px solid #e5e7eb",
                borderRadius: 8,
                fontSize: 14,
                outline: "none",
                transition: "border-color 0.2s ease",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#2563eb")}
              onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}
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
                padding: "10px 12px",
                border: "2px solid #e5e7eb",
                borderRadius: 8,
                fontSize: 14,
                outline: "none",
                transition: "border-color 0.2s ease",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#2563eb")}
              onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}
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
          <input type="email" name="email" placeholder="Email" value={completeRegData.email} onChange={handleCompleteRegChange} required disabled={completeRegLoading} />
          <input type="text" name="firstname" placeholder="First Name" value={completeRegData.firstname} onChange={handleCompleteRegChange} required disabled={completeRegLoading} />
          <input type="text" name="lastname" placeholder="Last Name" value={completeRegData.lastname} onChange={handleCompleteRegChange} required disabled={completeRegLoading} />
          <input type="text" name="contact" placeholder="Contact" value={completeRegData.contact} onChange={handleCompleteRegChange} required disabled={completeRegLoading} />
          <input type="text" name="department" placeholder="Department" value={completeRegData.department} onChange={handleCompleteRegChange} required disabled={completeRegLoading} />
          <input type="password" name="password" placeholder="Password" value={completeRegData.password} onChange={handleCompleteRegChange} required disabled={completeRegLoading} minLength={6} />
        </form>
      </Modal>

      {/* Confirm Modal */}
      <Modal
        show={confirmModal.show}
        onClose={confirmModal.onCancel}
        title={confirmModal.title}
        actions={
          <>
            <button onClick={confirmModal.onCancel} style={btnStyle("#6b7280")}>
              Cancel
            </button>
            <button onClick={confirmModal.onConfirm} style={btnStyle("#dc2626")}>
              Confirm
            </button>
          </>
        }
      >
        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6 }}>{confirmModal.message}</p>
      </Modal>

      {/* Alert Modal */}
      <Modal
        show={alertModal.show}
        onClose={() => setAlertModal({ show: false, message: "" })}
        title="Notification"
        actions={
          <button onClick={() => setAlertModal({ show: false, message: "" })} style={btnStyle("#2563eb")}>
            OK
          </button>
        }
      >
        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, whiteSpace: "pre-line" }}>{alertModal.message}</p>
      </Modal>
    </div>
  );
};

export default FacultyManagement;
