import React, { useEffect, useMemo, useState } from 'react';
import Sidebar from '../common/Sidebar.jsx';
import Header from '../common/Header.jsx';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faDoorOpen, faUser, faCalendarAlt, faDownload } from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import XLSX from 'xlsx-js-style';

const Search = () => {
  const apiBase = process.env.REACT_APP_API_BASE || 'http://localhost:5000';
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState({ rooms: [], instructors: [], schedules: [] });
  const [pagination, setPagination] = useState({
    rooms: { page: 1, limit: 10, total: 0, totalPages: 1, hasNext: false, hasPrev: false },
    instructors: { page: 1, limit: 10, total: 0, totalPages: 1, hasNext: false, hasPrev: false },
    schedules: { page: 1, limit: 10, total: 0, totalPages: 1, hasNext: false, hasPrev: false }
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const initial = params.get('q') || '';
    setQ(initial);
    if (initial.trim()) {
      // Reset pagination when new search
      setPagination({
        rooms: { page: 1, limit: 10, total: 0, totalPages: 1, hasNext: false, hasPrev: false },
        instructors: { page: 1, limit: 10, total: 0, totalPages: 1, hasNext: false, hasPrev: false },
        schedules: { page: 1, limit: 10, total: 0, totalPages: 1, hasNext: false, hasPrev: false }
      });
      doSearch(initial);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const doSearch = async (term, pageOverrides = {}) => {
    setLoading(true);
    try {
      const params = {
        q: term,
        roomsPage: pageOverrides.roomsPage || pagination.rooms.page,
        instructorsPage: pageOverrides.instructorsPage || pagination.instructors.page,
        schedulesPage: pageOverrides.schedulesPage || pagination.schedules.page,
        limit: 10
      };
      
      const res = await axios.get(`${apiBase}/api/admin/search`, { params });
      setResults({
        rooms: Array.isArray(res.data?.rooms) ? res.data.rooms : [],
        instructors: Array.isArray(res.data?.instructors) ? res.data.instructors : [],
        schedules: Array.isArray(res.data?.schedules) ? res.data.schedules : [],
      });
      
      if (res.data?.pagination) {
        setPagination(res.data.pagination);
      }
    } catch (_) {
      setResults({ rooms: [], instructors: [], schedules: [] });
    }
    setLoading(false);
  };

  const counts = useMemo(() => ({
    rooms: results.rooms.length,
    instructors: results.instructors.length,
    schedules: results.schedules.length,
  }), [results]);

  const exportSearchResults = () => {
    const wb = XLSX.utils.book_new();
    
    // Export Rooms
    if (results.rooms.length > 0) {
      const roomsData = [
        ['Room', 'Area', 'Status'],
        ...results.rooms.map(r => [r.room || '', r.area || '', r.status || ''])
      ];
      const wsRooms = XLSX.utils.aoa_to_sheet(roomsData);
      wsRooms['!cols'] = [{ wch: 20 }, { wch: 30 }, { wch: 15 }];
      const headerRange = XLSX.utils.decode_range(wsRooms['!ref']);
      for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
        if (!wsRooms[cellAddress]) continue;
        wsRooms[cellAddress].s = {
          fill: { fgColor: { rgb: "0f2c63" } },
          font: { bold: true, color: { rgb: "FFFFFF" } }
        };
      }
      XLSX.utils.book_append_sheet(wb, wsRooms, 'Rooms');
    }

    // Export Instructors
    if (results.instructors.length > 0) {
      const instructorsData = [
        ['Name', 'Email', 'Department', 'Contact'],
        ...results.instructors.map(i => [
          (i.firstname && i.lastname ? `${i.firstname} ${i.lastname}` : (i.name || i.email || '')),
          i.email || '',
          i.department || '',
          i.contact || ''
        ])
      ];
      const wsInstructors = XLSX.utils.aoa_to_sheet(instructorsData);
      wsInstructors['!cols'] = [{ wch: 25 }, { wch: 30 }, { wch: 20 }, { wch: 15 }];
      const headerRange = XLSX.utils.decode_range(wsInstructors['!ref']);
      for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
        if (!wsInstructors[cellAddress]) continue;
        wsInstructors[cellAddress].s = {
          fill: { fgColor: { rgb: "0f2c63" } },
          font: { bold: true, color: { rgb: "FFFFFF" } }
        };
      }
      XLSX.utils.book_append_sheet(wb, wsInstructors, 'Instructors');
    }

    // Export Schedules
    if (results.schedules.length > 0) {
      const schedulesData = [
        ['Subject', 'Course', 'Year', 'Section', 'Day', 'Time', 'Room', 'Instructor'],
        ...results.schedules.map(s => [
          s.subject || '',
          s.course || '',
          s.year || '',
          s.section || '',
          s.day || '',
          s.time || '',
          s.room || '',
          s.instructor || ''
        ])
      ];
      const wsSchedules = XLSX.utils.aoa_to_sheet(schedulesData);
      wsSchedules['!cols'] = [{ wch: 25 }, { wch: 15 }, { wch: 12 }, { wch: 12 }, { wch: 15 }, { wch: 20 }, { wch: 15 }, { wch: 25 }];
      const headerRange = XLSX.utils.decode_range(wsSchedules['!ref']);
      for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
        if (!wsSchedules[cellAddress]) continue;
        wsSchedules[cellAddress].s = {
          fill: { fgColor: { rgb: "0f2c63" } },
          font: { bold: true, color: { rgb: "FFFFFF" } }
        };
      }
      XLSX.utils.book_append_sheet(wb, wsSchedules, 'Schedules');
    }

    const filename = `search-results-${q.replace(/[^a-z0-9]/gi, '_').toLowerCase()}-${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, filename);
  };

  return (
    <div className="dashboard-container" style={{ display: 'flex' }}>
      <Sidebar />
      <main className="main-content" style={{ flex: 1, padding: '1rem' }}>
        <Header title="Search" />
        <div className="dashboard-content">
          <div style={{ background: '#fff', borderRadius: 12, padding: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: 16 }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', flex: 1, minWidth: '300px' }}>
                <FontAwesomeIcon icon={faSearch} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                <input value={q} onChange={(e)=>setQ(e.target.value)} onKeyDown={(e)=>{ if(e.key==='Enter') {
                  setPagination({
                    rooms: { page: 1, limit: 10, total: 0, totalPages: 1, hasNext: false, hasPrev: false },
                    instructors: { page: 1, limit: 10, total: 0, totalPages: 1, hasNext: false, hasPrev: false },
                    schedules: { page: 1, limit: 10, total: 0, totalPages: 1, hasNext: false, hasPrev: false }
                  });
                  doSearch(q);
                }}} placeholder="Search rooms, instructors, schedules..." style={{ width: '100%', padding: '10px 10px 10px 36px', border: '2px solid #e5e7eb', borderRadius: 8 }} />
              </div>
              <button onClick={()=>{
                setPagination({
                  rooms: { page: 1, limit: 10, total: 0, totalPages: 1, hasNext: false, hasPrev: false },
                  instructors: { page: 1, limit: 10, total: 0, totalPages: 1, hasNext: false, hasPrev: false },
                  schedules: { page: 1, limit: 10, total: 0, totalPages: 1, hasNext: false, hasPrev: false }
                });
                doSearch(q);
              }} disabled={loading || !q.trim()} style={{ padding: '10px 16px', borderRadius: 8, border: 'none', background: '#f97316', color: '#fff', fontWeight: 800, cursor: loading?'not-allowed':'pointer' }}>{loading ? 'Searching...' : 'Search'}</button>
              {(counts.rooms > 0 || counts.instructors > 0 || counts.schedules > 0) && (
                <button
                  onClick={exportSearchResults}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 16px',
                    borderRadius: 8,
                    border: 'none',
                    background: 'linear-gradient(135deg, #0f2c63 0%, #1e40af 100%)',
                    color: '#fff',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  <FontAwesomeIcon icon={faDownload} />
                  Export Excel
                </button>
              )}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
            <div style={{ background: '#fff', borderRadius: 12, padding: 16, borderLeft: '5px solid #f97316' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#1f2937', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FontAwesomeIcon icon={faDoorOpen}/> Rooms ({pagination.rooms.total || counts.rooms})
                </h3>
              </div>
              {counts.rooms === 0 ? <div style={{ color: '#6b7280' }}>No matching rooms</div> : (
                <>
                  <div style={{ display: 'grid', gap: 8, marginBottom: pagination.rooms.totalPages > 1 ? 15 : 0 }}>
                    {results.rooms.map((r)=> (
                      <div key={r._id} style={{ padding: 12, border: '1px solid #e5e7eb', borderRadius: 8, display: 'flex', justifyContent: 'space-between' }}>
                        <div style={{ fontWeight: 700 }}>{r.room}</div>
                        <div style={{ color: '#6b7280' }}>{r.area} • {r.status}</div>
                      </div>
                    ))}
                  </div>
                  {pagination.rooms.totalPages > 1 && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, paddingTop: 10, borderTop: '1px solid #e5e7eb' }}>
                      <button
                        onClick={() => doSearch(q, { roomsPage: pagination.rooms.page - 1 })}
                        disabled={!pagination.rooms.hasPrev}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '6px',
                          border: 'none',
                          background: pagination.rooms.hasPrev ? '#0f2c63' : '#e5e7eb',
                          color: pagination.rooms.hasPrev ? 'white' : '#9ca3af',
                          fontSize: '12px',
                          cursor: pagination.rooms.hasPrev ? 'pointer' : 'not-allowed'
                        }}
                      >
                        Prev
                      </button>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>
                        {pagination.rooms.page}/{pagination.rooms.totalPages}
                      </span>
                      <button
                        onClick={() => doSearch(q, { roomsPage: pagination.rooms.page + 1 })}
                        disabled={!pagination.rooms.hasNext}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '6px',
                          border: 'none',
                          background: pagination.rooms.hasNext ? '#f97316' : '#e5e7eb',
                          color: pagination.rooms.hasNext ? 'white' : '#9ca3af',
                          fontSize: '12px',
                          cursor: pagination.rooms.hasNext ? 'pointer' : 'not-allowed'
                        }}
                      >
                        Next
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>

            <div style={{ background: '#fff', borderRadius: 12, padding: 16, borderLeft: '5px solid #f97316' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#1f2937', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FontAwesomeIcon icon={faUser}/> Instructors ({pagination.instructors.total || counts.instructors})
                </h3>
              </div>
              {counts.instructors === 0 ? <div style={{ color: '#6b7280' }}>No matching instructors</div> : (
                <>
                  <div style={{ display: 'grid', gap: 8, marginBottom: pagination.instructors.totalPages > 1 ? 15 : 0 }}>
                    {results.instructors.map((i)=> (
                      <div key={i._id} style={{ padding: 12, border: '1px solid #e5e7eb', borderRadius: 8, display: 'flex', justifyContent: 'space-between' }}>
                        <div style={{ fontWeight: 700 }}>{i.firstname && i.lastname ? `${i.firstname} ${i.lastname}` : (i.name || i.email)}</div>
                        <div style={{ color: '#6b7280' }}>{i.department || '—'}</div>
                      </div>
                    ))}
                  </div>
                  {pagination.instructors.totalPages > 1 && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, paddingTop: 10, borderTop: '1px solid #e5e7eb' }}>
                      <button
                        onClick={() => doSearch(q, { instructorsPage: pagination.instructors.page - 1 })}
                        disabled={!pagination.instructors.hasPrev}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '6px',
                          border: 'none',
                          background: pagination.instructors.hasPrev ? '#0f2c63' : '#e5e7eb',
                          color: pagination.instructors.hasPrev ? 'white' : '#9ca3af',
                          fontSize: '12px',
                          cursor: pagination.instructors.hasPrev ? 'pointer' : 'not-allowed'
                        }}
                      >
                        Prev
                      </button>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>
                        {pagination.instructors.page}/{pagination.instructors.totalPages}
                      </span>
                      <button
                        onClick={() => doSearch(q, { instructorsPage: pagination.instructors.page + 1 })}
                        disabled={!pagination.instructors.hasNext}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '6px',
                          border: 'none',
                          background: pagination.instructors.hasNext ? '#f97316' : '#e5e7eb',
                          color: pagination.instructors.hasNext ? 'white' : '#9ca3af',
                          fontSize: '12px',
                          cursor: pagination.instructors.hasNext ? 'pointer' : 'not-allowed'
                        }}
                      >
                        Next
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>

            <div style={{ background: '#fff', borderRadius: 12, padding: 16, borderLeft: '5px solid #f97316' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#1f2937', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FontAwesomeIcon icon={faCalendarAlt}/> Schedules ({pagination.schedules.total || counts.schedules})
                </h3>
              </div>
              {counts.schedules === 0 ? <div style={{ color: '#6b7280' }}>No matching schedules</div> : (
                <>
                  <div style={{ display: 'grid', gap: 8, marginBottom: pagination.schedules.totalPages > 1 ? 15 : 0 }}>
                    {results.schedules.map((s, idx)=> (
                      <div key={s._id || idx} style={{ padding: 12, border: '1px solid #e5e7eb', borderRadius: 8 }}>
                        <div style={{ fontWeight: 700 }}>{s.subject} • {s.course} {s.year} - {s.section}</div>
                        <div style={{ color: '#6b7280' }}>{s.day} • {s.time} • {s.room}</div>
                      </div>
                    ))}
                  </div>
                  {pagination.schedules.totalPages > 1 && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, paddingTop: 10, borderTop: '1px solid #e5e7eb' }}>
                      <button
                        onClick={() => doSearch(q, { schedulesPage: pagination.schedules.page - 1 })}
                        disabled={!pagination.schedules.hasPrev}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '6px',
                          border: 'none',
                          background: pagination.schedules.hasPrev ? '#0f2c63' : '#e5e7eb',
                          color: pagination.schedules.hasPrev ? 'white' : '#9ca3af',
                          fontSize: '12px',
                          cursor: pagination.schedules.hasPrev ? 'pointer' : 'not-allowed'
                        }}
                      >
                        Prev
                      </button>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>
                        {pagination.schedules.page}/{pagination.schedules.totalPages}
                      </span>
                      <button
                        onClick={() => doSearch(q, { schedulesPage: pagination.schedules.page + 1 })}
                        disabled={!pagination.schedules.hasNext}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '6px',
                          border: 'none',
                          background: pagination.schedules.hasNext ? '#f97316' : '#e5e7eb',
                          color: pagination.schedules.hasNext ? 'white' : '#9ca3af',
                          fontSize: '12px',
                          cursor: pagination.schedules.hasNext ? 'pointer' : 'not-allowed'
                        }}
                      >
                        Next
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Search;


