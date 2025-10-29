import React, { useState, useEffect, useContext, useCallback, useMemo } from "react";
import InstructorSidebar from "../common/InstructorSidebar.jsx";
import InstructorHeader from "../common/InstructorHeader.jsx";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faDownload, faFileAlt, faCalendarAlt, faClock, faUser,
  faSearch, faPrint, faFilter, faDoorOpen, faGraduationCap,
} from "@fortawesome/free-solid-svg-icons";
import { AuthContext } from "../../context/AuthContext.jsx";
import {
  generateTimeSlots,
  timeStringToMinutes,
  TIME_SLOT_CONFIGS,
} from "../../utils/timeUtils.js";

const InstructorReports = () => {
  const { userEmail } = useContext(AuthContext);

  const [instructorData, setInstructorData] = useState({
    instructorId: "", firstname: "", lastname: "", email: "", department: "",
  });

  const [instructorSchedule, setInstructorSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: "day", direction: "asc" });
  const [filterDay, setFilterDay] = useState("All Days");
  const [filteredSchedule, setFilteredSchedule] = useState([]);
  const [viewMode, setViewMode] = useState("grid"); // grid or table

  // Generate time slots for the weekly grid view
  const timeSlots = useMemo(() => generateTimeSlots(
    TIME_SLOT_CONFIGS.DETAILED.startHour,
    TIME_SLOT_CONFIGS.DETAILED.endHour,
    TIME_SLOT_CONFIGS.DETAILED.duration,
  ), []);

  // Days of the week for the grid
  const weekDays = [
    { key: "Monday", label: "Monday", short: "Mon" },
    { key: "Tuesday", label: "Tuesday", short: "Tue" },
    { key: "Wednesday", label: "Wednesday", short: "Wed" },
    { key: "Thursday", label: "Thursday", short: "Thu" },
    { key: "Friday", label: "Friday", short: "Fri" },
  ];

  // Normalize a time range into minutes and a consistent display
  const normalizeTimeRange = useCallback((timeRange) => {
    const raw = String(timeRange || "");
    // Accept formats like "7:30 AM - 9:00 AM" or "7:30AM-9:00AM" or "07:30-09:00"
    const parts = raw.split(/\s*-\s*/);
    const startPart = (parts[0] || "").trim();
    const endPart = (parts[1] || "").trim();
    const startMinutes = timeStringToMinutes(startPart);
    const endMinutes = timeStringToMinutes(endPart);
    return {
      display: endPart ? `${startPart} - ${endPart}` : startPart,
      startMinutes,
      endMinutes,
    };
  }, []);

  // Normalize a single schedule item into a consistent shape for rendering
  const normalizeScheduleItem = useCallback((raw) => {
    if (!raw || typeof raw !== "object") return null;
    const subject = String(raw.subject || raw.Subject || "").trim();
    const timeRaw = String(raw.time || raw.Time || "").trim();
    const room = String(raw.room || raw.Room || "").trim();
    const section = String(raw.section || raw.Section || "").trim();
    // course could be string or object; year could be on raw or inside course
    let courseVal = raw.course;
    let yearVal = raw.year || raw.Year;
    if (courseVal && typeof courseVal === "object") {
      // common variants: { name, code, year }
      courseVal = courseVal.name || courseVal.code || "";
      yearVal = yearVal || courseVal?.year;
    }
    const course = String(courseVal || "").trim();
    const year = String(yearVal || "").trim();
    const day = String(raw.day || raw.Day || "").trim();
    const { display: time, startMinutes, endMinutes } = normalizeTimeRange(timeRaw);
    return { day, time, timeDisplay: time, startMinutes, endMinutes, subject, course, year, section, room, _id: raw._id };
  }, [normalizeTimeRange]);

  // Normalize day tokens for different formats (e.g., mon, monday)
  const normalizeDayTokens = (value) => {
    if (!value) return [];
    const alias = {
      mon: "monday", monday: "monday",
      tue: "tuesday", tues: "tuesday", tuesday: "tuesday",
      wed: "wednesday", weds: "wednesday", wednesday: "wednesday",
      thu: "thursday", thur: "thursday", thurs: "thursday", thursday: "thursday",
      fri: "friday", friday: "friday",
      sat: "saturday", saturday: "saturday",
      sun: "sunday", sunday: "sunday",
    };
    return value
      .toLowerCase()
      .split(/[^a-z]/)
      .map((t) => alias[t])
      .filter(Boolean);
  };

  // Fetch instructor data and schedule
  useEffect(() => {
    const fetchInstructorData = async () => {
      if (!userEmail) {
        console.log("No userEmail available yet");
        return;
      }

      try {
        setLoading(true);
        setError(null);
        // Fetch instructor profile data
        const profileResponse = await fetch(
          `/api/instructors/profile/by-email/${encodeURIComponent(userEmail)}`
        );
        if (!profileResponse.ok) throw new Error("Failed to fetch instructor profile");
        const profileData = await profileResponse.json();
        setInstructorData({
          instructorId: profileData.instructorId,
          firstname: profileData.firstname,
          lastname: profileData.lastname,
          email: profileData.email,
          department: profileData.department,
        });

        // Fetch schedule by email, then fallback by name and merge unique
        const instructorEmail = profileData.email;
        let merged = [];
        const normalize = (data) => Array.isArray(data) ? data : (data?.schedules || []);

        if (instructorEmail && instructorEmail.trim()) {
          const scheduleResponse = await fetch(`/api/schedule/instructor/${encodeURIComponent(instructorEmail)}`);
          if (scheduleResponse.ok) {
            const scheduleData = await scheduleResponse.json();
            merged = normalize(scheduleData);
          }
        }

        const fullName = `${profileData.firstname || ''} ${profileData.lastname || ''}`.trim();
        if (fullName.length > 0) {
          try {
            const byNameRes = await fetch(`/api/schedule/instructor/by-name/${encodeURIComponent(fullName)}`);
            if (byNameRes.ok) {
              const byNameData = await byNameRes.json();
              const byName = normalize(byNameData);
              const keyOf = (s) => `${s._id || ''}|${s.day}|${s.time}|${s.subject}`;
              const map = new Map(merged.map((s) => [keyOf(s), s]));
              byName.forEach((s) => { if (s) map.set(keyOf(s), s); });
              merged = Array.from(map.values());
            }
          } catch (e) {
            console.log('Fallback by-name fetch failed', e);
          }
        }

        // Normalize all schedule entries for consistent rendering in both views
        const normalized = merged
          .filter(Boolean)
          .map((s) => normalizeScheduleItem(s))
          .filter(Boolean);
        setInstructorSchedule(normalized);
      } catch (error) {
        console.error("Error fetching instructor data:", error);
        setError(error.message);
        setInstructorSchedule([]);
      } finally {
        setLoading(false);
      }
    };
    fetchInstructorData();
    const interval = setInterval(fetchInstructorData, 30000);
    return () => clearInterval(interval);
  }, [userEmail, normalizeScheduleItem]);

  // Utility to get day order for sorting
  const getDayOrder = (day) => {
    const dayOrder = {
      Monday: 1, Tuesday: 2, Wednesday: 3,
      Thursday: 4, Friday: 5, Saturday: 6, Sunday: 7,
    };
    return dayOrder[day] || 999;
  };

  // Sort schedule data
  const sortSchedule = useCallback((schedules, key, direction) => {
    return [...schedules].sort((a, b) => {
      let aValue, bValue;
      switch (key) {
        case "day":
          aValue = getDayOrder(a.day);
          bValue = getDayOrder(b.day);
          break;
        case "time":
          {
            const getStart = (s) =>
              typeof s?.startMinutes === "number"
                ? s.startMinutes
                : timeStringToMinutes(String(s?.time || ""));
            aValue = getStart(a);
            bValue = getStart(b);
          }
          break;
        case "subject":
          aValue = a.subject?.toLowerCase() || "";
          bValue = b.subject?.toLowerCase() || "";
          break;
        case "course":
          aValue = `${a.course || ""} ${a.year || ""}`.trim().toLowerCase();
          bValue = `${b.course || ""} ${b.year || ""}`.trim().toLowerCase();
          break;
        case "room":
          aValue = a.room?.toLowerCase() || "";
          bValue = b.room?.toLowerCase() || "";
          break;
        default:
          return 0;
      }
      if (aValue < bValue) return direction === "asc" ? -1 : 1;
      if (aValue > bValue) return direction === "asc" ? 1 : -1;
      return 0;
    });
  }, []);

  // Utility: check if a schedule includes a specific day
  const scheduleIncludesDay = useCallback((scheduleDay, dayLabel) => {
    if (!scheduleDay || !dayLabel) return false;
    const tokens = normalizeDayTokens(scheduleDay);
    return tokens.includes(String(dayLabel).toLowerCase());
  }, []);

  // Filter and sort schedule data on changes
  useEffect(() => {
    let filtered = instructorSchedule;

    // Search filter
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      filtered = filtered.filter((s) => {
        const courseYear = `${s.course || ""} ${s.year || ""}`.toLowerCase();
        return (
          (s.subject || "").toLowerCase().includes(q) ||
          courseYear.includes(q) ||
          (s.room || "").toLowerCase().includes(q) ||
          (s.section || "").toLowerCase().includes(q) ||
          (s.day || "").toLowerCase().includes(q)
        );
      });
    }

    // Day filter (supports multi-day entries)
    if (filterDay !== "All Days") {
      filtered = filtered.filter((schedule) =>
        scheduleIncludesDay(schedule.day, filterDay)
      );
    }

    // Sorting
    filtered = sortSchedule(filtered, sortConfig.key, sortConfig.direction);
    setFilteredSchedule(filtered);
  }, [instructorSchedule, searchTerm, filterDay, sortConfig, sortSchedule, scheduleIncludesDay]);

  // removed old tableSchedules (not used in admin-style table)

  // removed dayHasSchedules (not used)

  // Download CSV report
  const downloadReport = () => {
    const properLabel = {
      monday: "Monday",
      tuesday: "Tuesday",
      wednesday: "Wednesday",
      thursday: "Thursday",
      friday: "Friday",
      saturday: "Saturday",
      sunday: "Sunday",
    };
    // Expand multi-day entries into separate rows with full labels
    const expanded = [];
    filteredSchedule.forEach((s) => {
      const days = normalizeDayTokens(s.day);
      if (days.length === 0) {
        expanded.push({ ...s, day: s.day });
      } else {
        days.forEach((d) => expanded.push({ ...s, day: properLabel[d] || s.day }));
      }
    });
    const reportData = expanded.map((schedule) => ({
      Day: schedule.day,
      Time: schedule.timeDisplay || schedule.time,
      Subject: schedule.subject,
      Course: schedule.course + " " + schedule.year,
      Section: schedule.section,
      Room: schedule.room,
    }));
    const csvContent = [
      ["Day", "Time", "Subject", "Course", "Section", "Room"],
      ...reportData.map((row) => [
        row.Day, row.Time, row.Subject, row.Course, row.Section, row.Room,
      ]),
    ]
      .map((e) => e.join(","))
      .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${instructorData.firstname}${instructorData.lastname}ScheduleReport.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print report
  const printReport = () => {
    const printWindow = window.open("", "_blank");
    const properLabel = {
      monday: "Monday",
      tuesday: "Tuesday",
      wednesday: "Wednesday",
      thursday: "Thursday",
      friday: "Friday",
      saturday: "Saturday",
      sunday: "Sunday",
    };
    const expanded = [];
    filteredSchedule.forEach((s) => {
      const days = normalizeDayTokens(s.day);
      if (days.length === 0) {
        expanded.push({ ...s, day: s.day });
      } else {
        days.forEach((d) => expanded.push({ ...s, day: properLabel[d] || s.day }));
      }
    });
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head><title>Schedule Report - ${instructorData.firstname} ${instructorData.lastname}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1 { color: #0f2c63; text-align: center; }
        h2 { color: #64748b; text-align: center; margin-bottom: 30px; }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
        }
        th, td {
          padding: 12px;
          text-align: left;
          border: 1px solid #ddd;
        }
        th {
          background-color: #0f2c63;
          color: white;
        }
        tr:nth-child(even) {
          background-color: #f8fafc;
        }
        .summary {
          margin-top: 30px;
          text-align: center;
        }
      </style>
      </head>
      <body>
        <h1>Teaching Schedule Report</h1>
        <h2>${instructorData.firstname} ${instructorData.lastname} - ${instructorData.department}</h2>
        <table>
          <thead>
            <tr>
              <th>Day</th><th>Time</th><th>Subject</th><th>Course Section</th><th>Room</th>
            </tr>
          </thead>
          <tbody>
            ${expanded.map((schedule) => `
              <tr>
                <td>${schedule.day}</td>
                <td>${schedule.timeDisplay || schedule.time}</td>
                <td>${schedule.subject}</td>
                <td>${schedule.course} ${schedule.year} - ${schedule.section}</td>
                <td>${schedule.room}</td>
              </tr>`).join("")}
          </tbody>
        </table>
        <div class="summary">
          <p>Total Classes: ${filteredSchedule.length}</p>
          <p>Teaching Days: ${new Set(filteredSchedule.map(s => s.day)).size}</p>
          <p>Unique Subjects: ${new Set(filteredSchedule.map(s => s.subject)).size}</p>
          <p>Rooms Used: ${new Set(filteredSchedule.map(s => s.room)).size}</p>
          <p>Generated on: ${new Date().toLocaleDateString()}</p>
        </div>
      </body>
      </html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      <InstructorSidebar />
      <main style={{ flex: 1, background: "linear-gradient(to right, #0f2c63 0%, #f97316 100%)", overflowY: "auto" }}>
        <InstructorHeader />
        <div style={{ padding: 30, background: "#ffffffcc", borderRadius: 15, boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)", marginBottom: 30, borderLeft: "5px solid #f97316" }}>
          <h2 style={{ color: "#1e293b", fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Reports</h2>
          <p style={{ color: "#64748b", fontSize: 16, margin: 0 }}>View and generate reports for your classes.</p>
          <div style={{ marginTop: 15, padding: 15, background: "#f8fafc", borderRadius: 8, border: "1px solid #e2e8f0" }}>
            <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 8 }}>
              <FontAwesomeIcon icon={faUser} style={{ color: "#f97316", fontSize: 16 }} />
              <span style={{ fontWeight: 600, color: "#1e293b" }}>{instructorData.firstname} {instructorData.lastname}</span>
              {instructorData.instructorId && (
                <span style={{
                  background: "linear-gradient(135deg, #0f2c63 0%, #f97316 100%)",
                  color: "white", padding: "2px 8px", borderRadius: 4,
                  fontSize: 12, fontWeight: 600,
                }}>ID-{instructorData.instructorId}</span>
              )}
            </div>
            {instructorData.department && (
              <div style={{ color: "#64748b", fontSize: 14 }}>Department: {instructorData.department}</div>
            )}
          </div>
        </div>

        {/* View Mode Toggle and Buttons */}
        <div style={{ marginBottom: 25, display: "flex", gap: 15, alignItems: "center" }}>
          <button
            onClick={() => setViewMode("grid")}
            style={{
              padding: "8px 16px",
              background: viewMode === "grid" ? "linear-gradient(135deg, #0f2c63 0%, #1e40af 100%)" : "transparent",
              color: viewMode === "grid" ? "white" : "#64748b",
              border: "none",
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
              transition: "all 0.2s ease",
            }}
          >
            <FontAwesomeIcon icon={faCalendarAlt} />
            Grid View
          </button>
          {/* Table View merged into Grid View */}

          <button
            onClick={() => setViewMode("cards")}
            style={{
              padding: "8px 16px",
              background: viewMode === "cards" ? "linear-gradient(135deg, #0f2c63 0%, #1e40af 100%)" : "transparent",
              color: viewMode === "cards" ? "white" : "#64748b",
              border: "none",
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
              transition: "all 0.2s ease",
            }}
          >
            <FontAwesomeIcon icon={faCalendarAlt} />
            Cards
          </button>

          <button
            onClick={printReport}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "12px 20px",
              background: "linear-gradient(135deg, #059669 0%, #10b981 100%)",
              color: "white",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
              fontSize: 14,
              fontWeight: 600,
              transition: "all 0.3s ease",
              boxShadow: "0 4px 15px rgba(5, 150, 105, 0.3)",
            }}
          >
            <FontAwesomeIcon icon={faPrint} />
            Print Report
          </button>

          <button
            onClick={downloadReport}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "12px 20px",
              background: "linear-gradient(135deg, #0f2c63 0%, #1e40af 100%)",
              color: "white",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
              fontSize: 14,
              fontWeight: 600,
              transition: "all 0.3s ease",
              boxShadow: "0 4px 15px rgba(15, 44, 99, 0.3)",
            }}
          >
            <FontAwesomeIcon icon={faDownload} />
            Download CSV
          </button>
        </div>

        {/* Search and Filter Controls */}
        <div style={{ display: "flex", gap: 15, marginBottom: 25, padding: 20, background: "#f8fafc", borderRadius: 12, border: "1px solid #e2e8f0", flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ flex: 1, minWidth: 250, position: "relative" }}>
            <FontAwesomeIcon icon={faSearch} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#64748b", fontSize: 14 }} />
            <input
              type="text"
              placeholder="Search by subject, course, room, or section..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: "100%",
                padding: "12px 12px 12px 40px",
                border: "2px solid #e2e8f0",
                borderRadius: 8,
                fontSize: 14,
                background: "white",
                transition: "all 0.2s ease",
                outline: "none",
              }}
              onFocus={(e) => e.target.style.borderColor = "#f97316"}
              onBlur={(e) => e.target.style.borderColor = "#e2e8f0"}
            />
          </div>
          <div style={{ minWidth: 180, position: "relative" }}>
            <FontAwesomeIcon icon={faFilter} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#64748b", fontSize: 14 }} />
            <select
              value={filterDay}
              onChange={(e) => setFilterDay(e.target.value)}
              style={{
                width: "100%",
                padding: "12px 12px 12px 40px",
                border: "2px solid #e2e8f0",
                borderRadius: 8,
                fontSize: 14,
                background: "white",
                cursor: "pointer",
                outline: "none",
              }}
            >
              <option value="All Days">All Days</option>
              {weekDays.map((day) => (
                <option key={day.key} value={day.key}>{day.label}</option>
              ))}
            </select>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, color: "#64748b", fontSize: 14, fontWeight: 500 }}>
            <span>Showing</span>
            <span style={{
              background: "linear-gradient(135deg, #0f2c63 0%, #f97316 100%)",
              color: "white", padding: "4px 8px", borderRadius: 4, fontWeight: 600,
            }}>{filteredSchedule.length}</span>
            <span>of</span>
            <span>{instructorSchedule.length}</span>
          </div>
        </div>

        {/* Loading, Error, or No Data */}
        {loading && (
          <div style={{ textAlign: "center", padding: 40, color: "#64748b" }}>
            <FontAwesomeIcon icon={faCalendarAlt} style={{ fontSize: 48, opacity: 0.5, marginBottom: 15 }} />
            <p style={{ fontSize: 18, margin: 0 }}>Loading schedule data...</p>
          </div>
        )}

        {viewMode === "cards" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
            {(() => {
              const properLabel = {
                monday: "Monday",
                tuesday: "Tuesday",
                wednesday: "Wednesday",
                thursday: "Thursday",
                friday: "Friday",
                saturday: "Saturday",
              };
              // Expand multi-day schedules into separate entries per day
              const expanded = [];
              filteredSchedule.forEach((s) => {
                const days = normalizeDayTokens(s.day);
                if (days.length === 0) return;
                days.forEach((d) => expanded.push({ ...s, dayKey: d, dayLabel: properLabel[d] || s.day }));
              });
              // Group by day and sort by start time
              const groups = expanded.reduce((acc, s) => {
                const key = s.dayKey;
                if (!acc[key]) acc[key] = [];
                acc[key].push(s);
                return acc;
              }, {});
              const dayOrder = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
              const sortedDayKeys = Object.keys(groups).sort((a, b) => dayOrder.indexOf(a) - dayOrder.indexOf(b));
              const selectedDayKey = filterDay !== "All Days" ? filterDay.toLowerCase() : null;
              const dayKeysToRender = selectedDayKey ? sortedDayKeys.filter((k) => k === selectedDayKey) : sortedDayKeys;

              return dayKeysToRender.map((dayKey) => {
                const items = groups[dayKey]
                  .slice()
                  .sort((a, b) => (a.startMinutes || 0) - (b.startMinutes || 0));
                const dayLabel = properLabel[dayKey] || dayKey;
                return (
                  <div key={dayKey} style={{ background: "#fff", border: "2px solid #e5e7f0", borderRadius: 12, overflow: "hidden", boxShadow: "0 4px 12px rgba(0,0,0,0.06)" }}>
                    <div style={{ background: "linear-gradient(135deg, #0f2c63 0%, #1e40af 100%)", color: "#fff", padding: "10px 14px", fontWeight: 700 }}>{dayLabel}</div>
                    <div style={{ padding: 12, display: "grid", gap: 10 }}>
                      {items.map((s, idx) => (
                        <div key={idx} style={{
                          background: "linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)",
                          borderLeft: "5px solid #3b82f6",
                          borderRadius: 10,
                          padding: 14,
                          color: "#1e40af",
                          display: "grid",
                          gap: 6,
                        }}>
                          <div style={{ fontWeight: 800, fontSize: 16 }}>{s.subject}</div>
                          <div style={{ fontSize: 13 }}>{s.timeDisplay || s.time}</div>
                          <div style={{ fontSize: 13, fontWeight: 600 }}>{`${(s.course || "").toUpperCase()} ${s.year} - ${s.section}`}</div>
                          <div style={{ fontSize: 13, fontStyle: "italic" }}>Room: {s.room}</div>
                        </div>
                      ))}
                      {items.length === 0 && (
                        <div style={{ color: "#64748b", fontSize: 13 }}>No classes</div>
                      )}
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        )}
        {error && (
          <div style={{ textAlign: "center", padding: 40, color: "#dc2626" }}>
            <FontAwesomeIcon icon={faCalendarAlt} style={{ fontSize: 48, opacity: 0.5, marginBottom: 15 }} />
            <p style={{ fontSize: 18, margin: 0 }}>Error loading schedule: {error}</p>
          </div>
        )}
        {!loading && !error && instructorSchedule.length === 0 && (
          <div style={{ textAlign: "center", padding: 40, color: "#64748b" }}>
            <FontAwesomeIcon icon={faCalendarAlt} style={{ fontSize: 48, opacity: 0.5, marginBottom: 15 }} />
            <p style={{ fontSize: 18, margin: 0 }}>No schedule data found</p>
            <p style={{ fontSize: 14, margin: "5px 0 0 0" }}>Please contact the administrator to assign classes.</p>
          </div>
        )}

        {/* Schedule View */}
        {viewMode === "grid" && (
          <div style={{ overflowX: "auto", overflowY: "hidden" }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "120px repeat(5, 1fr)",
                minWidth: 900,
                background: "white",
                borderRadius: 12,
                overflow: "hidden",
                boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
                border: "2px solid #e2e8f0",
              }}
            >
              {/* Header Row */}
              <div
                style={{
                  background: "linear-gradient(135deg, #0f2c63 0%, #1e40af 100%)",
                  color: "white",
                  padding: 15,
                  textAlign: "center",
                  fontWeight: 700,
                  fontSize: 14,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <FontAwesomeIcon icon={faClock} style={{ marginRight: 8 }} />
                TIME
              </div>
              {weekDays.map((day) => (
                <div
                  key={day.key}
                  style={{
                    background: "linear-gradient(135deg, #0f2c63 0%, #1e40af 100%)",
                    color: "white",
                    padding: 15,
                    textAlign: "center",
                    fontWeight: 700,
                    fontSize: 14,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    position: "relative",
                  }}
                >
                  <div>{day.short}</div>
                  <div style={{ fontSize: 11, opacity: 0.8, marginTop: 2 }}>{day.label}</div>
                </div>
              ))}

              {/* Time Slot Rows */}
              {/* Coverage map to avoid overlapping blocks per day */}
              {(() => { const dayCovered = {}; return timeSlots.map((timeSlot, slotIndex) => {
                return (
                  <React.Fragment key={timeSlot}>
                    {/* Time label cell */}
                    <div
                      style={{
                        padding: 8,
                        backgroundColor: slotIndex % 2 === 0 ? "#f8fafc" : "#ffffff",
                        borderRight: "2px solid #e2e8f0",
                        borderBottom: "1px solid #e2e8f0",
                        fontSize: 12,
                        fontWeight: 600,
                        color: "#64748b",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        textAlign: "center",
                      }}
                    >
                      {timeSlot}
                    </div>

                    {/* Day columns for each time slot */}
                    {weekDays.map((day) => {
                      const dayKey = day.key;
                      const covered = dayCovered[dayKey] || (dayCovered[dayKey] = new Set());
                      if (covered.has(slotIndex)) {
                        return (
                          <div
                            key={`${day.key}-${timeSlot}`}
                            style={{
                              backgroundColor: slotIndex % 2 === 0 ? "#f8fafc" : "#ffffff",
                              borderBottom: "1px solid #f1f5f9",
                              borderRight: "1px solid #f1f5f9",
                              minHeight: 40,
                            }}
                          />
                        );
                      }
                      // Only render a block at the schedule's START slot to avoid duplicates
                      const dayToken = day.key.toLowerCase();
                      const candidates = filteredSchedule.filter((s) =>
                        normalizeDayTokens(s.day).includes(dayToken)
                      );
                      const schedule = candidates.find((s) => {
                        const slotStartMin = timeStringToMinutes(timeSlot);
                        const step = TIME_SLOT_CONFIGS.DETAILED.duration || 30;
                        const startMin = typeof s.startMinutes === 'number' ? s.startMinutes : timeStringToMinutes(String(s.time || '').split('-')[0] || '');
                        const startRounded = Math.floor(startMin / step) * step;
                        return slotStartMin === startRounded;
                      });

                      if (schedule) {
                        // compute row span to cover the whole duration across slots
                        let rowSpan = 1;
                        const step = TIME_SLOT_CONFIGS.DETAILED.duration || 30;
                        const schedStartMin = typeof schedule.startMinutes === 'number' ? schedule.startMinutes : timeStringToMinutes(String(schedule.time || '').split('-')[0] || '');
                        const schedEndMin = typeof schedule.endMinutes === 'number' ? schedule.endMinutes : timeStringToMinutes(String(schedule.time || '').split('-')[1] || '');
                        const startRounded = Math.floor(schedStartMin / step) * step;
                        const endRounded = Math.ceil(schedEndMin / step) * step;
                        const durationSteps = Math.max(1, Math.ceil((endRounded - startRounded) / step));
                        rowSpan = durationSteps;
                        // mark covered slots so we don't render cells under the spanning block
                        for (let i = slotIndex + 1; i < slotIndex + rowSpan; i++) {
                          covered.add(i);
                        }

                        return (
                          <div
                            key={`${day.key}-${timeSlot}`}
                            style={{
                              gridRowEnd: `span ${rowSpan}`,
                              background: "linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)",
                              border: "3px solid #3b82f6",
                              borderRadius: 8,
                              padding: 12,
                              margin: 4,
                              position: "relative",
                              minHeight: 60,
                              display: "flex",
                              flexDirection: "column",
                              justifyContent: "center",
                              textAlign: "center",
                            }}
                          >
                            <div style={{ fontWeight: 700, fontSize: 14, color: "#1e40af", marginBottom: 4 }}>
                              {schedule.subject}
                            </div>
                            <div style={{ fontSize: 11, color: "#3730a3", marginBottom: 6, display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                              <FontAwesomeIcon icon={faGraduationCap} style={{ fontSize: 10 }} />
                              {`${schedule.course?.toUpperCase() || ""} ${schedule.year} - ${schedule.section}`}
                            </div>
                            <div style={{ fontSize: 11, color: "#3730a3", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                              <FontAwesomeIcon icon={faDoorOpen} style={{ fontSize: 10 }} />
                              {schedule.room}
                            </div>
                            <div style={{
                              position: "absolute",
                              top: 2,
                              right: 2,
                              background: "#1e40af",
                              color: "white",
                              padding: "2px 6px",
                              borderRadius: 4,
                              fontSize: 9,
                              fontWeight: 600,
                            }}>
                              {schedule.timeDisplay || schedule.time}
                            </div>
                          </div>
                        );
                      } else {
                        // Empty slot cell (neutral, no highlight)
                        return (
                          <div
                            key={`${day.key}-${timeSlot}`}
                            style={{
                              backgroundColor: slotIndex % 2 === 0 ? "#f8fafc" : "#ffffff",
                              borderBottom: "1px solid #f1f5f9",
                              borderRight: "1px solid #f1f5f9",
                              minHeight: 40,
                            }}
                          />
                        );
                      }
                    })}
                  </React.Fragment>
                );
              }); })()}
            </div>

            {/* Combined: Admin-style table appended below grid */}
            <div style={{ marginTop: 24, width: "100%", maxHeight: 600, overflowY: "auto", overflowX: "auto", border: "2px solid #e5e7eb", borderRadius: 14 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed", fontSize: 16 }}>
                <colgroup>
                  <col style={{ width: "20%" }} />
                  <col style={{ width: "25%" }} />
                  <col style={{ width: "55%" }} />
                </colgroup>
                <thead style={{ position: "sticky", top: 0, zIndex: 10, background: "linear-gradient(135deg, #0f2c63 0%, #1e40af 100%)", color: "white" }}>
                  <tr>
                    <th style={{ padding: "22px 28px", textAlign: "left", fontWeight: 700, fontSize: 16, textTransform: "uppercase", letterSpacing: "0.5px" }}>Day</th>
                    <th style={{ padding: "22px 28px", textAlign: "left", fontWeight: 700, fontSize: 16, textTransform: "uppercase", letterSpacing: "0.5px" }}>Time</th>
                    <th style={{ padding: "22px 28px", textAlign: "left", fontWeight: 700, fontSize: 16, textTransform: "uppercase", letterSpacing: "0.5px" }}>Classes</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const dayDisplayGroups = [
                      { label: "Monday", day: "monday", group: "mon" },
                      { label: "Tuesday", day: "tuesday", group: "tue" },
                      { label: "Wednesday", day: "wednesday", group: "wed" },
                      { label: "Thursday", day: "thursday", group: "thu" },
                      { label: "Friday", day: "friday", group: "fri" },
                      { label: "Saturday", day: "saturday", group: "sat" },
                    ];
                    const coversSlot = (sched, slot) => {
                      const [slotStart, slotEnd] = slot.split(" - ").map((s) => s.trim());
                      const slotStartMin = timeStringToMinutes(slotStart);
                      const slotEndMin = timeStringToMinutes(slotEnd);
                      const sStart = typeof sched.startMinutes === 'number' ? sched.startMinutes : timeStringToMinutes(String(sched.time || '').split('-')[0] || '');
                      const sEnd = typeof sched.endMinutes === 'number' ? sched.endMinutes : timeStringToMinutes(String(sched.time || '').split('-')[1] || '');
                      return sStart <= slotStartMin && slotEndMin <= sEnd;
                    };
                    return dayDisplayGroups.flatMap((dayGroup) =>
                      timeSlots.map((time, timeIndex) => {
                        const schedule = filteredSchedule.find((sched) => {
                          const tokens = new Set(normalizeDayTokens(sched.day));
                          if (!tokens.has(dayGroup.day)) return false;
                          return coversSlot(sched, time);
                        });

                        if (schedule) {
                          // compute first matching slot for rowSpan
                          let firstIndex = -1;
                          for (let i = 0; i < timeSlots.length; i++) {
                            if (coversSlot(schedule, timeSlots[i])) {
                              firstIndex = i; break;
                            }
                          }
                          const isFirst = firstIndex === timeIndex;
                          if (!isFirst) {
                            return (
                              <tr key={`${dayGroup.label}-${timeIndex}`} style={{ borderBottom: '1px solid #e5e7eb' }}>
                                <td style={{ padding: '20px 28px', color: '#374151', fontWeight: 500, fontSize: 16 }}>{dayGroup.label}</td>
                                <td style={{ padding: '20px 28px', color: '#374151', fontSize: 16 }}>{time}</td>
                              </tr>
                            );
                          }
                          // rowSpan length
                          let rowSpan = 0;
                          for (let i = timeIndex; i < timeSlots.length; i++) {
                            if (coversSlot(schedule, timeSlots[i])) rowSpan++; else break;
                          }
                          return (
                            <tr key={`${dayGroup.label}-${timeIndex}`} style={{ borderBottom: '1px solid #e5e7eb' }}>
                              <td style={{ padding: '20px 28px', color: '#374151', fontWeight: 500, fontSize: 16 }}>{dayGroup.label}</td>
                              <td style={{ padding: '20px 28px', color: '#374151', fontSize: 16 }}>{time}</td>
                              <td rowSpan={rowSpan} style={{ background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)', borderLeft: '5px solid #3b82f6', color: '#1e40af', padding: '24px 28px', verticalAlign: 'top' }}>
                                <div style={{ textAlign: 'left' }}>
                                  <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 14, color: '#1e40af' }}>{schedule.subject}</div>
                                  <div style={{ fontSize: 16, marginBottom: 10, color: '#1e40af' }}>
                                    {`${(schedule.course || '').toUpperCase()} ${schedule.year} - ${schedule.section}`}
                                  </div>
                                  <div style={{ fontSize: 16, color: '#1e40af', fontStyle: 'italic' }}>Room: {schedule.room}</div>
                                </div>
                              </td>
                            </tr>
                          );
                        }
                        return (
                          <tr key={`${dayGroup.label}-${timeIndex}`} style={{ borderBottom: '1px solid #e5e7eb' }}>
                            <td style={{ padding: '20px 28px', color: '#374151', fontWeight: 500, fontSize: 16 }}>{dayGroup.label}</td>
                            <td style={{ padding: '20px 28px', color: '#374151', fontSize: 16 }}>{time}</td>
                            <td style={{ background: '#ffffff', padding: '20px 28px', border: '1px solid #f1f5f9' }} />
                          </tr>
                        );
                      })
                    );
                  })()}
                  {filteredSchedule.length === 0 && (
                    <tr>
                      <td colSpan="3" style={{ padding: 40, textAlign: 'center', color: '#6b7280', fontSize: 16 }}>No schedules found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Table View removed; combined into Grid View */}

        {/* Schedule Statistics and Summary */}
        <div style={{ marginTop: 20, paddingTop: 20, borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "space-around", flexWrap: "wrap", gap: 15 }}>
          <div style={{ textAlign: "center", minWidth: 140 }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: "#1e293b" }}>
              {filteredSchedule.length}
            </div>
            <div style={{ fontSize: 12, color: "#64748b" }}>Classes Shown</div>
            <div style={{ fontSize: 11, color: "#94a3b8" }}>of {instructorSchedule.length} total</div>
          </div>
          <div style={{ textAlign: "center", minWidth: 140 }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: "#1e293b" }}>
              {new Set(filteredSchedule.map(s => s.day)).size}
            </div>
            <div style={{ fontSize: 12, color: "#64748b" }}>Teaching Days</div>
          </div>
          <div style={{ textAlign: "center", minWidth: 140 }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: "#1e293b" }}>
              {new Set(filteredSchedule.map(s => s.subject)).size}
            </div>
            <div style={{ fontSize: 12, color: "#64748b" }}>Unique Subjects</div>
          </div>
          <div style={{ textAlign: "center", minWidth: 140 }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: "#1e293b" }}>
              {new Set(filteredSchedule.map(s => s.room)).size}
            </div>
            <div style={{ fontSize: 12, color: "#64748b" }}>Rooms Used</div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default InstructorReports;
