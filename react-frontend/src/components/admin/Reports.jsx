import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../common/Sidebar.jsx';
import Header from '../common/Header.jsx';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChartBar,
  faDownload,
  faUsers,
  faDoorOpen,
  faGraduationCap,
  faCode,
  faFilter,
  faUser,
} from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import { generateTimeSlots, TIME_SLOT_CONFIGS } from '../../utils/timeUtils.js';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import XLSX from 'xlsx-js-style';

const Reports = () => {
  const navigate = useNavigate();
  const [schedules, setSchedules] = useState([]);
  const [sections, setSections] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('bsit');
  const [selectedYear, setSelectedYear] = useState('1st year');
  const [selectedSection, setSelectedSection] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dayFilter, setDayFilter] = useState('all');

  const timeSlots = generateTimeSlots(
    TIME_SLOT_CONFIGS.DETAILED.startHour,
    TIME_SLOT_CONFIGS.DETAILED.endHour,
    TIME_SLOT_CONFIGS.DETAILED.duration
  );

  // Updated single day per group for per-page PDF generation
  const dayDisplayGroups = [
    { label: 'Monday', day: 'monday', group: 'mon' },
    { label: 'Tuesday', day: 'tuesday', group: 'tue' },
    { label: 'Wednesday', day: 'wednesday', group: 'wed' },
    { label: 'Thursday', day: 'thursday', group: 'thu' },
    { label: 'Friday', day: 'friday', group: 'fri' },
    { label: 'Saturday', day: 'saturday', group: 'sat' },
  ];

  const courses = [
    {
      id: 'bsit',
      name: 'BS Information Technology',
      shortName: 'BSIT',
      icon: faGraduationCap,
      gradient: 'linear-gradient(135deg, #0f2c63 0%, #1e40af 100%)',
    },
    {
      id: 'bsemc-dat',
      name: 'BS Entertainment and Multimedia Computing',
      shortName: 'BSEMC-DAT',
      icon: faCode,
      gradient: 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)',
    },
  ];

  const yearLevels = [
    { id: '1st year', label: '1st Year' },
    { id: '2nd year', label: '2nd Year' },
    { id: '3rd year', label: '3rd Year' },
    { id: '4th year', label: '4th Year' },
  ];

  useEffect(() => {
    fetchData();

    // Auto-refresh every 30 seconds
    const autoRefreshInterval = setInterval(fetchData, 30000);

    return () => {
      clearInterval(autoRefreshInterval);
    };
  }, [selectedCourse, selectedYear]);

  useEffect(() => {
    if (sections.length > 0 && !selectedSection) {
      setSelectedSection(sections[0]);
    }
  }, [sections]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [sectionsRes, schedulesRes] = await Promise.all([
        axios.get(`http://localhost:5000/api/sections?course=${selectedCourse}&year=${selectedYear}`),
        axios.get(`http://localhost:5000/api/schedule?course=${selectedCourse}&year=${selectedYear}`),
      ]);
      const sortedSections = (Array.isArray(sectionsRes.data) ? sectionsRes.data : []).sort((a, b) =>
        a.name.localeCompare(b.name)
      );
      setSections(sortedSections);
      setSchedules(Array.isArray(schedulesRes.data) ? schedulesRes.data : []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const timeStringToMinutes = (timeStr) => {
    if (!timeStr) return -1;
    const cleanTime = timeStr.trim().split(' - ')[0];
    let [time, modifier] = cleanTime.split(' ');
    if (!modifier) return -1;
    let [h, m] = time.split(':').map(Number);
    if (modifier.toLowerCase() === 'pm' && h !== 12) h += 12;
    if (modifier.toLowerCase() === 'am' && h === 12) h = 0;
    return h * 60 + (m || 0);
  };

  const getSectionSchedules = (sectionName) => {
    return schedules.filter((sched) => sched.section === sectionName);
  };

  // PDF palette and dims for timeline
  const TL_COLORS = {
    brand: [30, 64, 175],
    brandLight: [59, 130, 246],
    textDark: [30, 41, 59],
    textMid: [71, 85, 105],
    textLite: [100, 116, 139],
    band: [248, 250, 252],
    grid: [229, 231, 235],
    blockFill: [219, 234, 254],
    blockBorder: [59, 130, 246],
  };

  // PDF Export: timeline-style blocks per day
  const exportToPDFTimeline = () => {
    if (!selectedSection) return;

    const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const totalPages = 1 + dayDisplayGroups.length;

    // Global time bounds from config
    const startHour = TIME_SLOT_CONFIGS.DETAILED.startHour;
    const endHour = TIME_SLOT_CONFIGS.DETAILED.endHour;
    const startMin = startHour * 60;
    const endMin = endHour * 60;
    const totalMinutes = endMin - startMin;

    // Layout
    const margin = 32;
    const headerH = 80;
    const footerH = 28;
    const axisH = 28;
    const contentTop = headerH + axisH + margin;
    const contentBottom = pageHeight - footerH - margin;
    const contentHeight = contentBottom - contentTop;
    const leftX = margin + 8;
    const rightX = pageWidth - margin - 8;
    const contentWidth = rightX - leftX;

    // Cover page
    doc.setFillColor(...TL_COLORS.brand);
    doc.rect(0, 0, pageWidth, 120, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(28);
    doc.text('Class Schedule Timeline', margin, 72);
    doc.setFontSize(14);
    doc.text(`${selectedCourse.toUpperCase()} • ${selectedYear.toUpperCase()} • Section ${selectedSection.name}`, margin, 100);
    doc.setTextColor(...TL_COLORS.textMid);
    doc.setFontSize(12);
    doc.text(`Generated: ${new Date().toLocaleString()}`, margin, 160);
    // cover legend
    const legY = 190;
    doc.setFillColor(...TL_COLORS.blockFill);
    doc.setDrawColor(...TL_COLORS.blockBorder);
    doc.roundedRect(margin, legY, 22, 14, 3, 3, 'FD');
    doc.setTextColor(...TL_COLORS.textMid);
    doc.text('Class block', margin + 30, legY + 11);

    dayDisplayGroups.forEach((dayGroup, idx) => {
      doc.addPage('a4', 'l');

      // Header bar
      doc.setFillColor(...TL_COLORS.brand);
      doc.rect(0, 0, pageWidth, 64, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.text(`${dayGroup.label}`, margin, 38);
      const pg = `Page ${idx + 2} of ${totalPages}`;
      doc.setFontSize(11);
      doc.text(pg, pageWidth - margin - doc.getTextWidth(pg), 38);
      // meta pill
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(255, 255, 255);
      doc.roundedRect(pageWidth - margin - 320, 16, 300, 36, 8, 8, 'F');
      doc.setTextColor(...TL_COLORS.textDark);
      doc.text(`${selectedCourse.toUpperCase()} • ${selectedYear.toUpperCase()} • ${selectedSection.name}`, pageWidth - margin - 310, 38);

      // Time axis (top)
      doc.setDrawColor(...TL_COLORS.grid);
      const axisY = headerH + margin;
      doc.line(leftX, axisY, rightX, axisY);
      doc.setFontSize(10);
      doc.setTextColor(...TL_COLORS.textLite);
      for (let h = startHour; h <= endHour; h++) {
        const m = h * 60;
        const x = leftX + (contentWidth * (m - startMin)) / totalMinutes;
        doc.line(x, axisY - 4, x, axisY + 4);
        const label = `${((h + 11) % 12) + 1}:00 ${h < 12 ? 'AM' : 'PM'}`;
        const tw = doc.getTextWidth(label);
        doc.text(label, x - tw / 2, axisY - 8);
        // half-hour tick
        if (h < endHour) {
          const x30 = leftX + (contentWidth * (m + 30 - startMin)) / totalMinutes;
          doc.setDrawColor(210);
          doc.line(x30, axisY - 2, x30, axisY + 2);
          doc.setDrawColor(...TL_COLORS.grid);
        }
      }

      // Prepare day schedules for lanes
      const daySchedules = schedules
        .filter((s) => s.section === selectedSection.name)
        .filter((s) => {
          const schedDayStrs = String(s.day || '').toLowerCase().replace(/\s/g, '').split('/');
          const daySet = new Set(dayGroup.days.map((d) => d.toLowerCase()));
          return schedDayStrs.some((d) => daySet.has(d));
        })
        .map((s) => {
          const [st, et] = String(s.time || '').split(' - ').map((x) => x.trim());
          const sMin = timeStringToMinutes(st);
          const eMin = timeStringToMinutes(et);
          return { ...s, sMin, eMin };
        })
        .filter((s) => s.sMin >= 0 && s.eMin > s.sMin)
        .sort((a, b) => a.sMin - b.sMin || a.eMin - b.eMin);

      // Assign lanes (greedy non-overlap per lane)
      const lanes = [];
      daySchedules.forEach((item) => {
        let placed = false;
        for (let i = 0; i < lanes.length; i++) {
          const last = lanes[i][lanes[i].length - 1];
          if (last.eMin <= item.sMin) {
            lanes[i].push(item);
            placed = true;
            break;
          }
        }
        if (!placed) lanes.push([item]);
      });

      const laneCount = Math.max(lanes.length, 1);
      const laneGap = 10;
      const laneHeight = Math.max(44, Math.floor((contentHeight - laneGap * (laneCount - 1)) / laneCount));

      // Draw grid rows and alternating hour bands
      doc.setDrawColor(...TL_COLORS.grid);
      for (let i = 0; i < laneCount; i++) {
        const yTop = contentTop + i * (laneHeight + laneGap);
        const yBottom = yTop + laneHeight;
        doc.rect(leftX, yTop, contentWidth, laneHeight);
        // hour bands
        for (let h = startHour; h < endHour; h++) {
          const m0 = h * 60;
          const m1 = (h + 1) * 60;
          const x0 = leftX + (contentWidth * (m0 - startMin)) / totalMinutes;
          const w = (contentWidth * (m1 - m0)) / totalMinutes;
          if ((h - startHour) % 2 === 0) {
            doc.setFillColor(...TL_COLORS.band);
            doc.rect(x0, yTop, w, laneHeight, 'F');
          }
        }
        // vertical hour guides
        doc.setDrawColor(240);
        for (let h = startHour; h <= endHour; h++) {
          const m = h * 60;
          const x = leftX + (contentWidth * (m - startMin)) / totalMinutes;
          doc.line(x, yTop, x, yBottom);
        }
        doc.setDrawColor(...TL_COLORS.grid);
      }

      // Draw blocks
      lanes.forEach((laneItems, laneIdx) => {
        const yTop = contentTop + laneIdx * (laneHeight + laneGap);
        laneItems.forEach((item) => {
          const blockX = leftX + (contentWidth * (item.sMin - startMin)) / totalMinutes;
          const blockW = Math.max(20, (contentWidth * (item.eMin - item.sMin)) / totalMinutes);
          const blockY = yTop + 4;
          const blockH = laneHeight - 8;

          // Block background
          doc.setFillColor(...TL_COLORS.blockFill);
          doc.setDrawColor(...TL_COLORS.blockBorder);
          doc.setLineWidth(1);
          doc.roundedRect(blockX, blockY, blockW, blockH, 4, 4, 'FD');

          // Text inside block
          doc.setTextColor(...TL_COLORS.textDark);
          doc.setFontSize(11);
          const padding = 8;
          const tX = blockX + padding;
          let tY = blockY + 16;
          const lineGap = 14;
          const maxTextWidth = Math.max(10, blockW - padding * 2);
          const subject = String(item.subject || '');
          const instructor = String(item.instructor || '');
          const room = String(item.room || '');
          const timeStr = String(item.time || '');

          const wrapText = (txt) => doc.splitTextToSize(txt, maxTextWidth);
          const drawLines = (lines) => {
            lines.forEach((ln) => {
              doc.text(ln, tX, tY);
              tY += lineGap;
            });
          };

          doc.setFont(undefined, 'bold');
          drawLines(wrapText(subject));
          doc.setFont(undefined, 'normal');
          doc.setTextColor(...TL_COLORS.textMid);
          drawLines(wrapText(`${instructor}`));
          drawLines(wrapText(`Room: ${room}`));
          doc.setTextColor(...TL_COLORS.textLite);
          drawLines(wrapText(timeStr));
        });
      });

      // Legend
      const legendY = pageHeight - footerH - 30;
      const legendX = pageWidth - margin - 180;
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(...TL_COLORS.grid);
      doc.roundedRect(legendX, legendY - 20, 170, 28, 6, 6);
      doc.setFillColor(...TL_COLORS.blockFill);
      doc.setDrawColor(...TL_COLORS.blockBorder);
      doc.roundedRect(legendX + 10, legendY - 14, 22, 14, 3, 3, 'FD');
      doc.setTextColor(...TL_COLORS.textMid);
      doc.setFontSize(10);
      doc.text('Class Block', legendX + 40, legendY - 3);

      // Footer
      doc.setDrawColor(230);
      doc.setLineWidth(0.5);
      doc.line(margin, pageHeight - footerH, pageWidth - margin, pageHeight - footerH);
      doc.setFontSize(10);
      doc.setTextColor(120);
      const footer = `${selectedCourse.toUpperCase()} ${selectedYear.toUpperCase()} • ${selectedSection.name}`;
      doc.text(footer, margin, pageHeight - footerH + 16);
      const p = `Page ${idx + 2} of ${totalPages}`;
      doc.text(p, pageWidth - margin - doc.getTextWidth(p), pageHeight - footerH + 16);
    });

    doc.save(`Schedule_Timeline_${selectedSection.name}.pdf`);
  };
  

  // Excel export unchanged from previous version
  const excelHeaderStyle = {
    fill: { fgColor: { rgb: '1E40AF' } },
    font: { color: { rgb: 'FFFFFF' }, bold: true, sz: 14 },
    border: { bottom: { style: 'thick', color: { rgb: 'F97316' } } },
    alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
  };
  const excelRowStyle = (even) => ({
    fill: { fgColor: { rgb: even ? 'EFF6FF' : 'FFFFFF' } },
    font: { color: { rgb: '1E40AF' }, sz: 12 },
    alignment: { horizontal: 'left', vertical: 'center', wrapText: true },
  });

  const exportToExcel = () => {
    if (!selectedSection) return;
    const wb = XLSX.utils.book_new();

    // Summary sheet
    const summaryData = [
      ['Schedule Report'],
      ['Course', currentCourse.name],
      ['Course (short)', selectedCourse.toUpperCase()],
      ['Year Level', selectedYear.toUpperCase()],
      ['Section', selectedSection.name],
      ['Generated', new Date().toLocaleString()],
    ];
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    wsSummary['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 1 } }];
    wsSummary['A1'].s = { font: { bold: true, sz: 18 }, alignment: { horizontal: 'center' } };
    wsSummary['!cols'] = [{ wch: 20 }, { wch: 40 }];
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

    // Helper to build compact day rows (only classes)
    const buildDayRows = (dayGroup) => {
      const dayRows = schedules
        .filter((s) => s.section === selectedSection.name)
        .filter((s) => {
          const schedDayStrs = String(s.day || '').toLowerCase().replace(/\s/g, '').split('/');
          const daySet = new Set(dayGroup.days.map((d) => d.toLowerCase()));
          return schedDayStrs.some((d) => daySet.has(d));
        })
        .map((s) => ({
          time: s.time,
          subject: s.subject,
          instructor: s.instructor,
          room: s.room,
          startMin: (() => {
            const [st] = String(s.time || '').split(' - ').map((x) => x.trim());
            return timeStringToMinutes(st);
          })(),
        }))
        .sort((a, b) => (a.startMin || 0) - (b.startMin || 0))
        .map((r) => [r.time, r.subject, r.instructor, r.room]);
      return dayRows.length > 0 ? dayRows : [['—', 'No classes scheduled', '—', '—']];
    };

    // Per-day sheets
    dayDisplayGroups.forEach((dayGroup) => {
      const title = `${selectedCourse.toUpperCase()} - ${selectedYear.toUpperCase()} • Section ${selectedSection.name} — ${dayGroup.label}`;
      const ws_data = [
        [title],
        ['Time', 'Subject', 'Instructor', 'Room'],
        ...buildDayRows(dayGroup),
      ];
      const ws = XLSX.utils.aoa_to_sheet(ws_data);
      ws['!cols'] = [{ wch: 20 }, { wch: 44 }, { wch: 30 }, { wch: 16 }];
      ws['!freeze'] = { xSplit: 0, ySplit: 2 };
      ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 3 } }];
      ws['!autofilter'] = { ref: `A2:D${ws_data.length}` };

      // Style title row A1:D1
      ['A1', 'B1', 'C1', 'D1'].forEach((addr) => {
        if (ws[addr]) {
          ws[addr].s = {
            font: { bold: true, sz: 16, color: { rgb: '1E293B' } },
            alignment: { horizontal: 'center', vertical: 'center' },
          };
        }
      });

      // Style header row A2:D2
      ['A2', 'B2', 'C2', 'D2'].forEach((addr) => {
        if (ws[addr]) ws[addr].s = excelHeaderStyle;
      });

      // Body styling (zebra + borders)
      for (let r = 3; r <= ws_data.length; r++) {
        const even = (r % 2) === 0;
        ['A', 'B', 'C', 'D'].forEach((col) => {
          const cellAddr = `${col}${r}`;
          if (ws[cellAddr]) {
            ws[cellAddr].s = {
              ...(ws[cellAddr].s || {}),
              ...(ws_data[r - 1][1] === 'No classes scheduled'
                ? { font: { color: { rgb: '64748B' }, italic: true } }
                : {}),
              fill: { fgColor: { rgb: even ? 'FFFFFF' : 'F8FAFC' } },
              border: {
                left: { style: 'thin', color: { rgb: 'E5E7EB' } },
                right: { style: 'thin', color: { rgb: 'E5E7EB' } },
                top: { style: 'thin', color: { rgb: 'E5E7EB' } },
                bottom: { style: 'thin', color: { rgb: 'E5E7EB' } },
              },
              alignment: { horizontal: col === 'B' ? 'left' : 'center', vertical: 'center', wrapText: true },
              font: { ...(ws[cellAddr].s?.font || {}), color: { rgb: '1E293B' }, sz: 12 },
            };
          }
        });
      }

      XLSX.utils.book_append_sheet(wb, ws, dayGroup.label);
    });

    // All Days sheet
    const allRows = [];
    dayDisplayGroups.forEach((dayGroup) => {
      buildDayRows(dayGroup).forEach((row) => {
        allRows.push([dayGroup.label, ...row]);
      });
    });
    const wsAll = XLSX.utils.aoa_to_sheet([
      [`${selectedCourse.toUpperCase()} - ${selectedYear.toUpperCase()} • Section ${selectedSection.name} — All Days`],
      ['Day', 'Time', 'Subject', 'Instructor', 'Room'],
      ...allRows,
    ]);
    wsAll['!cols'] = [{ wch: 14 }, { wch: 20 }, { wch: 44 }, { wch: 30 }, { wch: 16 }];
    wsAll['!freeze'] = { xSplit: 0, ySplit: 2 };
    wsAll['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 4 } }];
    wsAll['!autofilter'] = { ref: `A2:E${allRows.length + 2}` };

    // Style title & header
    ['A1', 'B1', 'C1', 'D1', 'E1'].forEach((addr) => {
      if (wsAll[addr]) wsAll[addr].s = { font: { bold: true, sz: 16 }, alignment: { horizontal: 'center' } };
    });
    ['A2', 'B2', 'C2', 'D2', 'E2'].forEach((addr) => {
      if (wsAll[addr]) wsAll[addr].s = excelHeaderStyle;
    });
    for (let r = 3; r <= allRows.length + 2; r++) {
      const even = (r % 2) === 0;
      ['A', 'B', 'C', 'D', 'E'].forEach((col) => {
        const cell = `${col}${r}`;
        if (wsAll[cell]) {
          wsAll[cell].s = {
            fill: { fgColor: { rgb: even ? 'FFFFFF' : 'F8FAFC' } },
            border: {
              left: { style: 'thin', color: { rgb: 'E5E7EB' } },
              right: { style: 'thin', color: { rgb: 'E5E7EB' } },
              top: { style: 'thin', color: { rgb: 'E5E7EB' } },
              bottom: { style: 'thin', color: { rgb: 'E5E7EB' } },
            },
            alignment: { horizontal: col === 'C' ? 'left' : 'center', vertical: 'center', wrapText: true },
            font: { color: { rgb: '1E293B' }, sz: 12 },
          };
        }
      });
    }
    XLSX.utils.book_append_sheet(wb, wsAll, 'All Days');

    XLSX.writeFile(wb, `Schedule_Report_${selectedSection.name}.xlsx`);
  };

  const currentCourse = courses.find((c) => c.id === selectedCourse);

  return (
    <div className="dashboard-container" style={{ display: 'flex', height: '100vh' }}>
      <Sidebar />
      <main className="main-content" style={{ flex: 1, padding: '1rem', overflowY: 'auto' }}>
        <Header title="Reports" />
        <div className="dashboard-content">
          {/* Course and Year Selection */}
          <div className="welcome-section" style={{ marginBottom: '30px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
              <FontAwesomeIcon icon={faChartBar} style={{ fontSize: 32, color: '#f97316' }} />
              <h2 style={{ margin: 0 }}>Schedule Reports</h2>
            </div>
            <p style={{ margin: 0 }}>View and download schedule reports by course and year level</p>
          </div>

          {/* Course Selection */}
          <div
            style={{
              background: '#fff',
              padding: '20px',
              borderRadius: '18px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
              borderLeft: '5px solid #f97316',
              marginBottom: '20px',
            }}
          >
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b', marginBottom: '16px' }}>
              Select Course
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
              {courses.map((course) => (
                <button
                  key={course.id}
                  onClick={() => {
                    setSelectedCourse(course.id);
                    setSelectedSection(null);
                  }}
                  style={{
                    padding: '16px 20px',
                    background: selectedCourse === course.id ? course.gradient : '#f9fafb',
                    color: selectedCourse === course.id ? 'white' : '#374151',
                    border: selectedCourse === course.id ? 'none' : '2px solid #e5e7eb',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <FontAwesomeIcon icon={course.icon} style={{ fontSize: 24 }} />
                  <span>{course.shortName}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Year Level Selection */}
          <div
            style={{
              background: '#fff',
              padding: '20px',
              borderRadius: '18px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
              borderLeft: '5px solid #f97316',
              marginBottom: '20px',
            }}
          >
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b', marginBottom: '16px' }}>
              Select Year Level
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
              {yearLevels.map((year) => (
                <button
                  key={year.id}
                  onClick={() => {
                    setSelectedYear(year.id);
                    setSelectedSection(null);
                  }}
                  style={{
                    padding: '12px 16px',
                    background: selectedYear === year.id ? currentCourse.gradient : '#f9fafb',
                    color: selectedYear === year.id ? 'white' : '#374151',
                    border: selectedYear === year.id ? 'none' : '2px solid #e5e7eb',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '15px',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {year.label}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Loading reports...</div>
          ) : sections.length === 0 ? (
            <div
              style={{
                background: '#fff',
                padding: '60px 30px',
                borderRadius: '18px',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                textAlign: 'center',
                borderLeft: '5px solid #f97316',
              }}
            >
              <p style={{ color: '#64748b', fontSize: '16px' }}>
                No sections found for {currentCourse.shortName} {selectedYear}.
              </p>
            </div>
          ) : (
            <>
             {/* Sections Container */}
             <div
                style={{
                  background: '#fff',
                  padding: '24px',
                  borderRadius: '18px',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                  borderLeft: '5px solid #f97316',
                  marginBottom: '24px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '20px',
                    paddingBottom: '16px',
                    borderBottom: '2px solid #f1f5f9',
                  }}
                >
                  <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b', margin: 0 }}>Select Section</h3>
                  <span
                    style={{
                      background: '#e0e7ff',
                      color: '#4f46e5',
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '13px',
                      fontWeight: '700',
                    }}
                  >
                    {sections.length} section(s)
                  </span>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                    gap: '12px',
                  }}
                >
                  {sections.map((section) => (
                    <button
                      key={section._id}
                      onClick={() => setSelectedSection(section)}
                      style={{
                        background: selectedSection?._id === section._id ? '#eff6ff' : '#f9fafb',
                        border: selectedSection?._id === section._id ? '2px solid #3b82f6' : '2px solid transparent',
                        padding: '16px',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.2s ease',
                      }}
                      onMouseOver={(e) => {
                        if (selectedSection?._id !== section._id) {
                          e.currentTarget.style.background = '#f3f4f6';
                        }
                      }}
                      onMouseOut={(e) => {
                        if (selectedSection?._id !== section._id) {
                          e.currentTarget.style.background = '#f9fafb';
                        }
                      }}
                    >
                      <div style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937', marginBottom: '4px' }}>
                        {selectedCourse.toUpperCase()}-{selectedYear.charAt(0).toUpperCase()}
                        {section.name}
                      </div>
                      <div style={{ fontSize: '13px', color: '#6b7280' }}>
                        {getSectionSchedules(section.name).length} schedule(s)
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Schedule Report */}
              {selectedSection && (
                <div
                  style={{
                    background: '#fff',
                    padding: '30px',
                    borderRadius: '18px',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                    borderLeft: '5px solid #f97316',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '24px',
                      paddingBottom: '20px',
                      borderBottom: '2px solid #f1f5f9',
                    }}
                  >
                    <div>
                      <h3
                        style={{
                          fontSize: '24px',
                          fontWeight: '700',
                          color: '#1e293b',
                          margin: '0 0 4px 0',
                        }}
                      >
                        {selectedCourse.toUpperCase()}-{selectedYear.charAt(0).toUpperCase()}
                        {selectedSection.name} Report
                      </h3>
                      <p style={{ fontSize: '15px', color: '#64748b', margin: 0 }}>
                        {getSectionSchedules(selectedSection.name).length} schedule(s) • {currentCourse.name}
                      </p>
                    </div>

                    {/* Download Buttons */}
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={exportToPDFTimeline}
                        style={{
                          padding: '14px 20px',
                          background: 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '10px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          fontSize: '16px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                        }}
                      >
                        <FontAwesomeIcon icon={faDownload} />
                        Download PDF (Timeline)
                      </button>
                      <button
                        onClick={exportToExcel}
                        style={{
                          padding: '14px 20px',
                          background: 'linear-gradient(135deg, #22d3ee 0%, #0e7490 100%)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '10px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          fontSize: '16px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                        }}
                      >
                        <FontAwesomeIcon icon={faDownload} />
                        Excel
                      </button>
                    </div>
                  </div>

                  {/* Filter */}
                  <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <FontAwesomeIcon icon={faFilter} style={{ color: '#6b7280', fontSize: '18px' }} />
                    <select
                      value={dayFilter}
                      onChange={(e) => setDayFilter(e.target.value)}
                      style={{
                        padding: '12px 16px',
                        border: '2px solid #e5e7eb',
                        borderRadius: '10px',
                        fontSize: '15px',
                        fontWeight: '500',
                      }}
                    >
                      <option value="all">All Days</option>
                      <option value="mon">Monday</option>
                      <option value="tue">Tuesday</option>
                      <option value="wed">Wednesday</option>
                      <option value="thu">Thursday</option>
                      <option value="fri">Friday</option>
                      <option value="sat">Saturday</option>
                    </select>
                  </div>

                  {/* Scrollable Table Container */}
                  <div
                    style={{
                      width: '100%',
                      maxHeight: '600px',
                      overflowY: 'auto',
                      overflowX: 'auto',
                      border: '2px solid #e5e7eb',
                      borderRadius: '14px',
                    }}
                  >
                    <table
                      style={{
                        width: '100%',
                        borderCollapse: 'collapse',
                        tableLayout: 'fixed',
                        fontSize: '17px',
                      }}
                    >
                      <colgroup>
                        <col style={{ width: '20%' }} />
                        <col style={{ width: '25%' }} />
                        <col style={{ width: '55%' }} />
                      </colgroup>
                      <thead
                        style={{
                          position: 'sticky',
                          top: 0,
                          zIndex: 10,
                          background: currentCourse.gradient,
                          color: 'white',
                        }}
                      >
                        <tr>
                          <th
                            style={{
                              padding: '22px 28px',
                              textAlign: 'left',
                              fontWeight: '700',
                              fontSize: '16px',
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px',
                            }}
                          >
                            Day
                          </th>
                          <th
                            style={{
                              padding: '22px 28px',
                              textAlign: 'left',
                              fontWeight: '700',
                              fontSize: '16px',
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px',
                            }}
                          >
                            Time
                          </th>
                          <th
                            style={{
                              padding: '22px 28px',
                              textAlign: 'left',
                              fontWeight: '700',
                              fontSize: '16px',
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px',
                            }}
                          >
                            {selectedCourse.toUpperCase()}-{selectedYear.charAt(0).toUpperCase()}
                            {selectedSection.name}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                          {dayDisplayGroups
                            .filter((dayGroup) => dayFilter === 'all' || dayFilter === dayGroup.group)
                            .map((dayGroup) =>
                            timeSlots.map((time, timeIndex) => {
                              const schedule = schedules.find((sched) => {
                                if (sched.section !== selectedSection.name) return false;
                                  const schedDayStrs = sched.day.toLowerCase().replace(/\s/g, '').split('/');
                                  const matchesDay = schedDayStrs.includes(dayGroup.day);
                                  if (!matchesDay) return false;
                                const [schedStart, schedEnd] = sched.time.split(' - ').map((x) => x.trim());
                                const schedStartMin = timeStringToMinutes(schedStart);
                                const schedEndMin = timeStringToMinutes(schedEnd);
                                const [slotStart, slotEnd] = time.split(' - ').map((x) => x.trim());
                                const slotStartMin = timeStringToMinutes(slotStart);
                                const slotEndMin = timeStringToMinutes(slotEnd);
                                return schedStartMin <= slotStartMin && slotEndMin <= schedEndMin;
                              });

                              if (schedule) {
                                const [schedStartStr, schedEndStr] = schedule.time.split(' - ').map((s) => s.trim());
                                const schedStartMin = timeStringToMinutes(schedStartStr);
                                const schedEndMin = timeStringToMinutes(schedEndStr);

                                let firstMatchingSlotIndex = -1;
                                for (let i = 0; i < timeSlots.length; i++) {
                                  const [slotStart, slotEnd] = timeSlots[i].split(' - ').map((s) => s.trim());
                                  const slotStartMin = timeStringToMinutes(slotStart);
                                  const slotEndMin = timeStringToMinutes(slotEnd);

                                  if (schedStartMin <= slotStartMin && slotEndMin <= schedEndMin) {
                                    if (firstMatchingSlotIndex === -1) {
                                      firstMatchingSlotIndex = i;
                                    }
                                  }
                                }

                                const isFirstSlot = firstMatchingSlotIndex === timeIndex;

                                if (!isFirstSlot) {
                                  return (
                                    <tr key={`${dayGroup.label}-${timeIndex}`} style={{ borderBottom: '1px solid #e5e7eb' }}>
                                      <td
                                        style={{
                                          padding: '20px 28px',
                                          color: '#374151',
                                          fontWeight: '500',
                                          fontSize: '16px',
                                        }}
                                      >
                                        {dayGroup.label}
                                      </td>
                                      <td style={{ padding: '20px 28px', color: '#374151', fontSize: '16px' }}>{time}</td>
                                    </tr>
                                  );
                                }

                                let rowSpan = 0;
                                for (let i = timeIndex; i < timeSlots.length; i++) {
                                  const [slotStart, slotEnd] = timeSlots[i].split(' - ').map((s) => s.trim());
                                  const slotStartMin = timeStringToMinutes(slotStart);
                                  const slotEndMin = timeStringToMinutes(slotEnd);

                                  if (slotStartMin >= schedStartMin && slotEndMin <= schedEndMin) {
                                    rowSpan++;
                                  } else {
                                    break;
                                  }
                                }

                                return (
                                  <tr key={`${dayGroup.label}-${timeIndex}`} style={{ borderBottom: '1px solid #e5e7eb' }}>
                                    <td
                                      style={{
                                        padding: '20px 28px',
                                        color: '#374151',
                                        fontWeight: '500',
                                        fontSize: '16px',
                                      }}
                                    >
                                      {dayGroup.label}
                                    </td>
                                    <td style={{ padding: '20px 28px', color: '#374151', fontSize: '16px' }}>{time}</td>
                                    <td
                                      rowSpan={rowSpan}
                                      style={{
                                        background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
                                        borderLeft: '5px solid #3b82f6',
                                        color: '#1e40af',
                                        padding: '24px 28px',
                                        verticalAlign: 'top',
                                      }}
                                    >
                                      <div style={{ textAlign: 'left' }}>
                                        <div
                                          style={{
                                            fontWeight: '700',
                                            fontSize: '18px',
                                            marginBottom: '14px',
                                            color: '#1e40af',
                                          }}
                                        >
                                          {schedule.subject}
                                        </div>
                                        <div
                                          style={{
                                            fontSize: '16px',
                                            marginBottom: '10px',
                                            color: '#1e40af',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '12px',
                                          }}
                                        >
                                          <FontAwesomeIcon icon={faUser} style={{ fontSize: 16 }} />
                                          <span>{schedule.instructor}</span>
                                        </div>
                                        <div
                                          style={{
                                            fontSize: '16px',
                                            color: '#1e40af',
                                            fontStyle: 'italic',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '12px',
                                          }}
                                        >
                                          <FontAwesomeIcon icon={faDoorOpen} style={{ fontSize: 16 }} />
                                          <span>Room: {schedule.room}</span>
                                        </div>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              } else {
                                return (
                                  <tr key={`${dayGroup.label}-${timeIndex}`} style={{ borderBottom: '1px solid #e5e7eb' }}>
                                    <td
                                      style={{
                                        padding: '20px 28px',
                                        color: '#374151',
                                        fontWeight: '500',
                                        fontSize: '16px',
                                      }}
                                    >
                                      {dayGroup.label}
                                    </td>
                                    <td style={{ padding: '20px 28px', color: '#374151', fontSize: '16px' }}>{time}</td>
                                    <td
                                      style={{
                                        background: '#ffffff',
                                        padding: '20px 28px',
                                        border: '1px solid #f1f5f9',
                                      }}
                                    >
                                      {/* Empty cell */}
                                    </td>
                                  </tr>
                                );
                              }
                            })
                          )}
                        {getSectionSchedules(selectedSection.name).length === 0 && (
                          <tr>
                            <td
                              colSpan="3"
                              style={{ padding: '40px', textAlign: 'center', color: '#6b7280', fontSize: '17px' }}
                            >
                              No schedules for this section yet
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default Reports;

