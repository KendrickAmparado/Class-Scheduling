import React, { useState, useEffect } from "react";
import Sidebar from "../common/Sidebar.jsx";
import Header from "../common/Header.jsx";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTrash,
  faPlus,
  faEye,
  faEdit,
  faTrashAlt,
  faUserPlus,
} from "@fortawesome/free-solid-svg-icons";

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
  const [addName, setAddName] = useState("");
  const [addEmail, setAddEmail] = useState("");
  const [addContact, setAddContact] = useState("");
  const [addDepartment, setAddDepartment] = useState("");
  const [addLoading, setAddLoading] = useState(false);

  useEffect(() => {
    fetch("http://localhost:5000/api/instructors")
      .then((res) =>
        res.ok ? res.json() : Promise.reject(new Error("Failed to fetch instructors"))
      )
      .then((data) => {
        setInstructors(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
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

  // Archive instructor
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

  // Restore instructor
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

  // Permanent delete
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

  // Add Instructor handler
  const handleAddInstructor = (e) => {
    e.preventDefault();
    setAddLoading(true);
    fetch("http://localhost:5000/api/registration/send-registration    ", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: addName,
        email: addEmail,
        contact: addContact,
        department: addDepartment,
      }),
    })
      .then((res) =>
        res.ok ? res.json() : Promise.reject(new Error("Failed to send registration email"))
      )
      .then(() => {
        setShowAddModal(false);
        setAddName("");
        setAddEmail("");
        setAddContact("");
        setAddDepartment("");
        showAlert("Registration link sent via email.");
        // optionally, refresh list:
        fetch("http://localhost:5000/api/instructors")
          .then((r) => r.json())
          .then((data) => setInstructors(data));
      })
      .catch((err) => {
        showAlert(err.message);
      })
      .finally(() => setAddLoading(false));
  };

  const filteredInstructors = instructors.filter((inst) => {
    if (activeTab === "active") return inst.status === "active";
    if (activeTab === "archived" || activeTab === "deleted")
      return inst.status === "archived";
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
  });

  return (
    <div className="dashboard-container">
      <Sidebar />
      <main className="main-content">
        <Header title="Faculty Management" />
        <div style={{
          padding: 30,
          background: "linear-gradient(135deg, #0f2c63 0%, #f97316 100%)",
          minHeight: "calc(100vh - 80px)",
        }}>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 30,
          }}>
            <div style={{ display: "flex", gap: 15 }}>
              <button
                onClick={() => setActiveTab("active")}
                style={btnStyle("#059669")}
              >
                Active ({instructors.filter((i) => i.status === "active").length})
              </button>
              <button
                onClick={() => setActiveTab("archived")}
                style={btnStyle("#b91c1c")}
              >
                Archived ({instructors.filter((i) => i.status === "archived").length})
              </button>
            </div>
            <button style={btnStyle("#2563eb")} onClick={() => setShowAddModal(true)}>
              <FontAwesomeIcon icon={faPlus} /> Add Instructor
            </button>
          </div>

          {loading ? (
            <p>Loading instructors...</p>
          ) : (
            <table style={{
              width: "100%",
              borderCollapse: "collapse",
              background: "white",
              borderRadius: 10,
            }}>
              <thead style={{ background: "#0f2c63", color: "white" }}>
                <tr>
                  {[
                    "Instructor ID",
                    "Name",
                    "Email",
                    "Department",
                    "Status",
                    "Actions",
                  ].map((h) => (
                    <th key={h} style={{ padding: 14, textAlign: "left" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredInstructors.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: 20, textAlign: "center" }}>
                      No instructors found.
                    </td>
                  </tr>
                ) : (
                  filteredInstructors.map((inst) => (
                    <tr key={inst._id}>
                      <td style={{ padding: 14 }}>{inst.instructorId}</td>
                      <td style={{ padding: 14 }}>{inst.name}</td>
                      <td style={{ padding: 14 }}>{inst.email}</td>
                      <td style={{ padding: 14 }}>{inst.department || "-"}</td>
                      <td style={{ padding: 14 }}>{inst.status}</td>
                      <td style={{ padding: 14 }}>
                        <div style={{ display: "flex", gap: 10 }}>
                          {/* Archive button only if NOT archived */}
                          {inst.status !== "archived" && (
                            <button
                              onClick={() => handleArchive(inst._id)}
                              style={btnStyle("#dc2626")}
                            >
                              <FontAwesomeIcon icon={faTrash} /> Archive
                            </button>
                          )}
                          {/* Restore and Delete only if archived */}
                          {inst.status === "archived" && (
                            <>
                              <button
                                onClick={() => handleRestore(inst._id)}
                                style={btnStyle("#10b981")}
                              >
                                <FontAwesomeIcon icon={faUserPlus} /> Restore
                              </button>
                              <button
                                onClick={() => handlePermanentDelete(inst._id)}
                                style={btnStyle("#991b1b")}
                              >
                                <FontAwesomeIcon icon={faTrashAlt} /> Delete Permanently
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
          )}

        </div>
      </main>

      {/* Add Instructor Modal */}
      <Modal
        show={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add Instructor"
        actions={
          <>
            <button onClick={() => setShowAddModal(false)}>Cancel</button>
            <button
              type="submit"
              form="addInstructorForm"
              disabled={addLoading}
              style={btnStyle("#2563eb")}
            >
              {addLoading ? "Sending..." : "Add"}
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
            placeholder="Name"
            value={addName}
            onChange={e => setAddName(e.target.value)}
            required
            disabled={addLoading}
          />
          <input
            type="email"
            placeholder="Email"
            value={addEmail}
            onChange={e => setAddEmail(e.target.value)}
            required
            disabled={addLoading}
          />
          <input
            type="tel"
            placeholder="Contact"
            value={addContact}
            onChange={e => setAddContact(e.target.value)}
            required
            disabled={addLoading}
          />
          <input
            type="text"
            placeholder="Department"
            value={addDepartment}
            onChange={e => setAddDepartment(e.target.value)}
            required
            disabled={addLoading}
          />
        </form>
      </Modal>

      {/* Confirm Modal */}
      <Modal
        show={confirmModal.show}
        onClose={confirmModal.onCancel}
        title={confirmModal.title}
        actions={
          <>
            <button onClick={confirmModal.onCancel}>Cancel</button>
            <button onClick={confirmModal.onConfirm}>Confirm</button>
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
          <button onClick={() => setAlertModal({ show: false, message: "" })}>
            OK
          </button>
        }
      >
        {alertModal.message}
      </Modal>
    </div>
  );
};

export default FacultyManagement;
