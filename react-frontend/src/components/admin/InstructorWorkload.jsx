import React, { useEffect, useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart as ReBarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as ReTooltip,
  PieChart as RePieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../common/Sidebar.jsx';
import Header from '../common/Header.jsx';

// Helper: parse duration minutes from schedule.time like "08:00 AM - 09:30 AM"
const parseDurationMinutes = (timeStr) => {
  if (!timeStr || !timeStr.includes('-')) return 0;
  const [startRaw, endRaw] = timeStr.split('-').map(s => s.trim());
  const toMinutes = (t) => {
    if (!t) return 0;
    const parts = t.split(' ');
    let hm = parts[0];
    let ampm = parts[1] || '';
    const [h, m] = hm.split(':').map(n => parseInt(n, 10));
    let H = Number.isNaN(h) ? 0 : h;
    if (ampm.toLowerCase() === 'pm' && H !== 12) H += 12;
    if (ampm.toLowerCase() === 'am' && H === 12) H = 0;
    return H * 60 + (Number.isNaN(m) ? 0 : m);
  };
  const s = toMinutes(startRaw);
  const e = toMinutes(endRaw);
  if (e <= s) return 0;
  return e - s;
};

const dayOrder = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];

const InstructorWorkload = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [instructor, setInstructor] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    const fetchData = async () => {
      try {
        setLoading(true);
        // fetch instructors and find by id
        const instRes = await fetch('http://localhost:5000/api/instructors');
        if (!instRes.ok) throw new Error('Failed to load instructors');
        const instList = await instRes.json();
        const found = instList.find(i => String(i._id) === String(id));
        if (!found) {
          throw new Error('Instructor not found');
        }
        if (!mounted) return;
        setInstructor(found);

        // fetch schedules (use the existing /api/schedule/all endpoint)
        const schedulesRes = await fetch('http://localhost:5000/api/schedule/all');
        if (!schedulesRes.ok) throw new Error('Failed to load schedules');
        const schedulesBody = await schedulesRes.json();
        const allSchedules = Array.isArray(schedulesBody) ? schedulesBody : (schedulesBody.schedules || []);

        // match by instructor email when possible, otherwise fall back to name matching
        const email = (found.email || '').toLowerCase();
        const fullName = ((found.firstname || '') + ' ' + (found.lastname || '')).trim().toLowerCase();

        const matched = allSchedules.filter(s => {
          if (!s) return false;
          if (s.instructorEmail && String(s.instructorEmail).toLowerCase() === email && email) return true;
          if (s.instructor && String(s.instructor).toLowerCase().includes(fullName) && fullName) return true;
          return false;
        });

        if (!mounted) return;
        setSchedules(matched);
        setLoading(false);
      } catch (err) {
        console.error(err);
        if (!mounted) return;
        setError(err.message);
        setLoading(false);
      }
    };
    fetchData();
    return () => { mounted = false; };
  }, [id]);

  const stats = useMemo(() => {
    const totalClasses = schedules.length;
    const totalMinutes = schedules.reduce((sum, s) => sum + parseDurationMinutes(s.time), 0);
    const totalHours = +(totalMinutes / 60).toFixed(2);
    const avgHoursPerClass = totalClasses ? +(totalHours / totalClasses).toFixed(2) : 0;
    const daysSet = new Set(schedules.map(s => (s.day || '').toLowerCase()));
    const classesByDay = dayOrder.map(d => schedules.filter(s => (s.day || '').toLowerCase() === d).length);

    // subject distribution
    const subjectCounts = {};
    schedules.forEach(s => {
      const key = (s.subject || 'Unknown').trim();
      subjectCounts[key] = (subjectCounts[key] || 0) + 1;
    });

    return { totalClasses, totalHours, avgHoursPerClass, daysTeaching: daysSet.size, classesByDay, subjectCounts };
  }, [schedules]);

  // Convert classesByDay into chart friendly data
  const classesByDayData = stats.classesByDay.map((count, i) => ({ name: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][i], count }));

  const subjectPieData = Object.entries(stats.subjectCounts || {}).sort((a,b) => b[1]-a[1]).slice(0,6).map(([name, value]) => ({ name, value }));
  const PIE_COLORS = ['#0f2c63','#1e40af','#0ea5a0','#f97316','#d97706','#ef4444'];

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <main style={{ flex: 1, padding: 20 }}>
        <Header title={instructor ? `${instructor.firstname || ''} ${instructor.lastname || ''}`.trim() || 'Instructor Workload' : 'Instructor Workload'} />
        <div style={{ marginTop: 120 }}>
          <button onClick={() => navigate(-1)} style={{ marginBottom: 12, padding: '8px 12px', borderRadius: 8, background: '#e5e7eb', border: 'none', cursor: 'pointer' }}>← Back</button>

          {loading ? (
            <div style={{ padding: 24, background: '#fff', borderRadius: 12 }}>Loading...</div>
          ) : error ? (
            <div style={{ padding: 24, background: '#fee2e2', borderRadius: 12 }}>{error}</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 16 }}>
              <div style={{ background: '#fff', padding: 18, borderRadius: 12, boxShadow: '0 6px 20px rgba(2,6,23,0.06)' }}>
                <h3 style={{ marginTop: 0 }}>Summary</h3>
                <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
                  <div style={{ flex: 1, background: '#f8fafc', padding: 12, borderRadius: 8 }}>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>Total Classes</div>
                    <div style={{ fontSize: 20, fontWeight: 800 }}>{stats.totalClasses}</div>
                  </div>
                  <div style={{ flex: 1, background: '#f8fafc', padding: 12, borderRadius: 8 }}>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>Total Hours</div>
                    <div style={{ fontSize: 20, fontWeight: 800 }}>{stats.totalHours}</div>
                  </div>
                  <div style={{ flex: 1, background: '#f8fafc', padding: 12, borderRadius: 8 }}>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>Days Teaching</div>
                    <div style={{ fontSize: 20, fontWeight: 800 }}>{stats.daysTeaching}</div>
                  </div>
                </div>

                <div style={{ marginBottom: 8 }}>
                  <h4 style={{ margin: '6px 0' }}>Classes by Day</h4>
                    <div style={{ background: '#fff', padding: 12, borderRadius: 10 }}>
                      <ResponsiveContainer width="100%" height={160}>
                        <ReBarChart data={classesByDayData} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
                          <XAxis dataKey="name" tick={{ fill: '#334155', fontSize: 12 }} />
                          <YAxis allowDecimals={false} tick={{ fill: '#334155', fontSize: 12 }} />
                          <ReTooltip />
                          <Bar dataKey="count" fill="#0f2c63" radius={[6,6,0,0]} />
                        </ReBarChart>
                      </ResponsiveContainer>
                    </div>
                </div>

                <div style={{ marginTop: 14 }}>
                  <h4 style={{ margin: '6px 0' }}>Top Subjects</h4>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <div style={{ width: 140, height: 140 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <RePieChart>
                          <Pie data={subjectPieData} dataKey="value" nameKey="name" innerRadius={28} outerRadius={56} paddingAngle={4} label={(entry) => entry.name.length > 10 ? entry.name.slice(0,10)+'...' : entry.name}>
                            {subjectPieData.map((entry, idx) => (
                              <Cell key={`cell-${idx}`} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                            ))}
                          </Pie>
                          <Legend verticalAlign="bottom" height={24} wrapperStyle={{ fontSize: 12 }} />
                          <ReTooltip />
                        </RePieChart>
                      </ResponsiveContainer>
                    </div>
                    <div style={{ flex: 1 }}>
                      {Object.entries(stats.subjectCounts).sort((a,b) => b[1]-a[1]).slice(0,6).map(([subj, count]) => (
                        <div key={subj} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '4px 0' }}>
                          <div style={{ color: '#0f1724' }}>{subj}</div>
                          <div style={{ color: '#6b7280' }}>{count}</div>
                        </div>
                      ))}
                      {Object.keys(stats.subjectCounts).length === 0 && <div style={{ color: '#6b7280' }}>No subjects found</div>}
                    </div>
                  </div>
                </div>
              </div>

              <aside style={{ background: '#fff', padding: 18, borderRadius: 12, boxShadow: '0 6px 20px rgba(2,6,23,0.06)' }}>
                <h4 style={{ marginTop: 0 }}>Details</h4>
                <div style={{ fontSize: 14, marginBottom: 8 }}><strong>Name:</strong> {instructor.firstname} {instructor.lastname}</div>
                <div style={{ fontSize: 14, marginBottom: 8 }}><strong>Email:</strong> {instructor.email}</div>
                <div style={{ fontSize: 14, marginBottom: 8 }}><strong>Department:</strong> {instructor.department || '—'}</div>
                <div style={{ fontSize: 14, marginBottom: 8 }}><strong>Average Hours / Class:</strong> {stats.avgHoursPerClass}</div>

                <div style={{ marginTop: 12 }}>
                  <h5 style={{ margin: '6px 0' }}>Recent Schedules</h5>
                  <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                    {schedules.length === 0 ? (
                      <div style={{ color: '#6b7280' }}>No schedules available</div>
                    ) : (
                      schedules.slice(0, 20).map((s) => (
                        <div key={s._id} style={{ padding: 8, borderBottom: '1px solid #f1f5f9' }}>
                          <div style={{ fontWeight: 700 }}>{s.subject || 'Untitled'}</div>
                          <div style={{ fontSize: 13, color: '#6b7280' }}>{s.course} {s.year} • {s.section} • {s.day} • {s.time} • {s.room}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </aside>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default InstructorWorkload;
