import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../common/Sidebar.jsx';
import Header from '../common/Header.jsx';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faClipboardList,
  faCheckCircle,
  faTimesCircle,
  faExclamationTriangle,
  faArrowRight,
  faCalendarPlus,
  faTrash,
  faUserPlus,
  faLayerGroup,
  faChalkboardTeacher,
  faCalendarAlt,
  faUsers,
  faChartBar,
} from '@fortawesome/free-solid-svg-icons';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [summaryStats, setSummaryStats] = useState({
    totalInstructors: 0,
    totalSchedules: 0,
    totalRooms: 0,
    totalSections: 0
  });
  const [scheduleByYear, setScheduleByYear] = useState([]);
  const [instructorWorkload, setInstructorWorkload] = useState([]);
  const [roomUsage, setRoomUsage] = useState([]);
  const apiBase = process.env.REACT_APP_API_BASE || 'http://localhost:5000';

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/admin/alerts');
        // Limit to the 3 most recent alerts
        setAlerts(res.data.alerts.slice(0, 3));
      } catch (err) {
        console.error('Failed to load alerts', err);
      }
    };

    const fetchSummaryStats = async () => {
      try {
        // Fetch all data in parallel
        const [instructorsRes, schedulesRes, roomsRes] = await Promise.all([
          axios.get('http://localhost:5000/api/instructors'),
          axios.get('http://localhost:5000/api/schedule/all'),
          axios.get('http://localhost:5000/api/rooms')
        ]);
        
        console.log('Instructors Response:', instructorsRes.data);
        console.log('Schedules Response:', schedulesRes.data);
        console.log('Rooms Response:', roomsRes.data);
        
        // Calculate stats
        let totalSections = 0;
        const scheduleByYearMap = {};
        const instructorWorkloadMap = {};
        const roomUsageMap = {};

        if (Array.isArray(schedulesRes.data)) {
          schedulesRes.data.forEach(schedule => {
            // Count unique sections
            if (schedule.section && schedule.course && schedule.year) {
              totalSections = new Set([...new Array(totalSections).keys()].concat([`${schedule.course}-${schedule.year}-${schedule.section}`])).size;
            }
            
            // Count schedules by year
            const year = schedule.year || 'Unknown';
            scheduleByYearMap[year] = (scheduleByYearMap[year] || 0) + 1;
            
            // Count instructor workload
            const instructor = schedule.instructor || 'Unknown';
            instructorWorkloadMap[instructor] = (instructorWorkloadMap[instructor] || 0) + 1;
            
            // Count room usage
            const room = schedule.room || 'Unknown';
            roomUsageMap[room] = (roomUsageMap[room] || 0) + 1;
          });
        }

        // Convert maps to chart data
        const scheduleByYearData = Object.entries(scheduleByYearMap)
          .map(([year, count]) => ({ year: `Year ${year}`, schedules: count }))
          .sort((a, b) => a.year.localeCompare(b.year));

        const instructorWorkloadData = Object.entries(instructorWorkloadMap)
          .map(([instructor, count]) => ({ name: instructor, classes: count }))
          .sort((a, b) => b.classes - a.classes)
          .slice(0, 8); // Top 8 instructors

        const roomUsageData = Object.entries(roomUsageMap)
          .map(([room, count]) => ({ room, uses: count }))
          .sort((a, b) => b.uses - a.uses);

        setScheduleByYear(scheduleByYearData);
        setInstructorWorkload(instructorWorkloadData);
        setRoomUsage(roomUsageData);
        
        const stats = {
          totalInstructors: Array.isArray(instructorsRes.data) ? instructorsRes.data.length : 0,
          totalSchedules: Array.isArray(schedulesRes.data) ? schedulesRes.data.length : 0,
          totalRooms: roomsRes.data.rooms?.length || 0,
          totalSections: totalSections
        };
        
        console.log('Summary Stats:', stats);
        setSummaryStats(stats);
      } catch (err) {
        console.error('Failed to load summary stats', err);
      }
    };

    fetchAlerts();
    fetchSummaryStats();
  }, []);

  const renderAlertIcon = (type) => {
    switch (type) {
      case 'room-conflict':
        return <FontAwesomeIcon icon={faExclamationTriangle} style={{ color: '#dc2626', fontSize: 18, marginTop: 2 }} />;
      case 'pending-approval':
        return <FontAwesomeIcon icon={faTimesCircle} style={{ color: '#b91c1c', fontSize: 18, marginTop: 2 }} />;
      case 'availability-update':
        return <FontAwesomeIcon icon={faCheckCircle} style={{ color: '#059669', fontSize: 18, marginTop: 2 }} />;
      case 'schedule-created':
        return <FontAwesomeIcon icon={faCalendarPlus} style={{ color: '#16a34a', fontSize: 18, marginTop: 2 }} />;
      case 'schedule-deleted':
        return <FontAwesomeIcon icon={faTrash} style={{ color: '#dc2626', fontSize: 18, marginTop: 2 }} />;
      case 'section-created':
        return <FontAwesomeIcon icon={faLayerGroup} style={{ color: '#2563eb', fontSize: 18, marginTop: 2 }} />;
      case 'yearlevel-added':
        return <FontAwesomeIcon icon={faLayerGroup} style={{ color: '#0ea5e9', fontSize: 18, marginTop: 2 }} />;
      case 'instructor-added':
        return <FontAwesomeIcon icon={faUserPlus} style={{ color: '#4f46e5', fontSize: 18, marginTop: 2 }} />;
      case 'instructor-notification':
        return <FontAwesomeIcon icon={faClipboardList} style={{ color: '#4f46e5', fontSize: 18, marginTop: 2 }} />;
      default:
        return <FontAwesomeIcon icon={faExclamationTriangle} style={{ color: '#dc2626', fontSize: 18, marginTop: 2 }} />;
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="dashboard-container" style={{ display: 'flex' }}>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="main-content" style={{ flex: 1, padding: '1rem' }}>
        <Header title="Admin Dashboard" onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <div className="dashboard-content" style={{ marginTop: '140px' }}>
          <div className="welcome-section">
            <h2>Welcome to the Admin Dashboard</h2>
            <p>Manage your class scheduling system efficiently</p>
          </div>

          {/* Summary Overview */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '16px',
            marginBottom: '24px'
          }}>
            {/* Total Instructors Card */}
            <div style={{
              background: '#fff',
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
              padding: '18px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
              boxShadow: '0 6px 18px rgba(15, 23, 63, 0.06)'
            }}>
              <div>
                <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>Total Instructors</p>
                <h3 style={{ margin: '6px 0 0', fontSize: '22px', color: '#0f172a' }}>{summaryStats.totalInstructors}</h3>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>Active faculty members</span>
              </div>
              <div style={{ 
                padding: '12px', 
                borderRadius: '14px', 
                background: '#f97316',
                color: '#fff', 
                fontSize: '18px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <FontAwesomeIcon icon={faChalkboardTeacher} />
              </div>
            </div>

            {/* Total Schedules Card */}
            <div style={{
              background: '#fff',
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
              padding: '18px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
              boxShadow: '0 6px 18px rgba(15, 23, 63, 0.06)'
            }}>
              <div>
                <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>Total Schedules</p>
                <h3 style={{ margin: '6px 0 0', fontSize: '22px', color: '#0f172a' }}>{summaryStats.totalSchedules}</h3>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>Classes scheduled</span>
              </div>
              <div style={{ 
                padding: '12px', 
                borderRadius: '14px', 
                background: '#0ea5e9',
                color: '#fff', 
                fontSize: '18px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <FontAwesomeIcon icon={faCalendarAlt} />
              </div>
            </div>

            {/* Total Rooms Card */}
            <div style={{
              background: '#fff',
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
              padding: '18px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
              boxShadow: '0 6px 18px rgba(15, 23, 63, 0.06)'
            }}>
              <div>
                <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>Total Rooms</p>
                <h3 style={{ margin: '6px 0 0', fontSize: '22px', color: '#0f172a' }}>{summaryStats.totalRooms}</h3>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>Available facilities</span>
              </div>
              <div style={{ 
                padding: '12px', 
                borderRadius: '14px', 
                background: '#10b981',
                color: '#fff', 
                fontSize: '18px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <FontAwesomeIcon icon={faLayerGroup} />
              </div>
            </div>

            {/* Total Sections Card */}
            <div style={{
              background: '#fff',
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
              padding: '18px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
              boxShadow: '0 6px 18px rgba(15, 23, 63, 0.06)'
            }}>
              <div>
                <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>Total Sections</p>
                <h3 style={{ margin: '6px 0 0', fontSize: '22px', color: '#0f172a' }}>{summaryStats.totalSections}</h3>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>Student groups</span>
              </div>
              <div style={{ 
                padding: '12px', 
                borderRadius: '14px', 
                background: '#1e293b',
                color: '#fff', 
                fontSize: '18px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <FontAwesomeIcon icon={faUsers} />
              </div>
            </div>
          </div>

          {/* Data Visualizations */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '30px', marginTop: '36px' }}>
            {/* Schedule Distribution by Year */}
            <div style={{
              background: '#fff',
              padding: '30px',
              borderRadius: '18px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
              borderLeft: '5px solid #3b82f6',
            }}>
              <h3 style={{
                color: '#1e293b',
                fontSize: '18px',
                fontWeight: '700',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}>
                <FontAwesomeIcon icon={faChartBar} />
                Schedules by Year Level
              </h3>
              {scheduleByYear.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={scheduleByYear}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="schedules" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p style={{ color: '#9ca3af', textAlign: 'center', padding: '40px 0' }}>No data available</p>
              )}
            </div>

            {/* Top Instructors by Workload */}
            <div style={{
              background: '#fff',
              padding: '30px',
              borderRadius: '18px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
              borderLeft: '5px solid #f59e0b',
            }}>
              <h3 style={{
                color: '#1e293b',
                fontSize: '18px',
                fontWeight: '700',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}>
                <FontAwesomeIcon icon={faChalkboardTeacher} />
                Top Instructors by Classes
              </h3>
              {instructorWorkload.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={instructorWorkload} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={120} fontSize={12} />
                    <Tooltip />
                    <Bar dataKey="classes" fill="#f59e0b" radius={[0, 8, 8, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p style={{ color: '#9ca3af', textAlign: 'center', padding: '40px 0' }}>No data available</p>
              )}
            </div>

            {/* Room Usage Distribution */}
            <div style={{
              background: '#fff',
              padding: '30px',
              borderRadius: '18px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
              borderLeft: '5px solid #10b981',
            }}>
              <h3 style={{
                color: '#1e293b',
                fontSize: '18px',
                fontWeight: '700',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}>
                <FontAwesomeIcon icon={faLayerGroup} />
                Room Usage Distribution
              </h3>
              {roomUsage.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={roomUsage}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({ room, uses }) => `${room} (${uses})`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="uses"
                    >
                      {roomUsage.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={['#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'][index % 8]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p style={{ color: '#9ca3af', textAlign: 'center', padding: '40px 0' }}>No data available</p>
              )}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
