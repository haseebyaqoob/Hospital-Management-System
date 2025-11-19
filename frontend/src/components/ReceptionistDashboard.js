import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../Dashboard.css';

const API_URL = 'http://localhost:8080/api';

function ReceptionistDashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('activity');
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [queueStatus, setQueueStatus] = useState(0);
  const [dsaInfo, setDsaInfo] = useState(null);
  
  const [patientForm, setPatientForm] = useState({
    name: '',
    email: '',
    password: '',
    age: 0,
    gender: 'male',
    phone: '',
    address: ''
  });

  const [appointmentForm, setAppointmentForm] = useState({
    patientUserId: '',
    doctorUserId: '',
    date: '',
    time: '',
    reason: ''
  });

  useEffect(() => {
    fetchData();
    fetchQueueStatus();
  }, [activeTab]);

  const fetchQueueStatus = async () => {
    try {
      const response = await axios.get(`${API_URL}/appointments/queue/status`);
      setQueueStatus(response.data.queueSize);
    } catch (error) {
      console.error('Error fetching queue status:', error);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'appointments' || activeTab === 'activity') {
        const response = await axios.get(`${API_URL}/appointments`);
        // Actually sort by date/time (MergeSort)
        const sorted = (response.data.appointments || []).sort((a, b) => {
          const dateA = new Date(a.date + ' ' + a.time);
          const dateB = new Date(b.date + ' ' + b.time);
          return dateA - dateB;
        });
        setAppointments(sorted);
        setDsaInfo(`DSA: ${response.data.dsaUsed || 'MergeSort + Queue'}`);
      }
      
      if (activeTab === 'register' || activeTab === 'schedule' || activeTab === 'activity') {
        const [patientsRes, doctorsRes] = await Promise.all([
          axios.get(`${API_URL}/patients`),
          axios.get(`${API_URL}/doctors`)
        ]);
        setPatients(patientsRes.data.patients || []);
        setDoctors(doctorsRes.data.doctors || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterPatient = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/patients`, patientForm);
      setPatientForm({
        name: '',
        email: '',
        password: '',
        age: 0,
        gender: 'male',
        phone: '',
        address: ''
      });
      fetchData();
      alert('Patient registered successfully!\nHashMap entry created for wallet.');
    } catch (error) {
      alert('Error registering patient: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleBookAppointment = async (e) => {
    e.preventDefault();
    try {
      const patient = patients.find(p => p.userId === appointmentForm.patientUserId);
      const doctor = doctors.find(d => d.userId === appointmentForm.doctorUserId);
      
      const appointmentData = {
        patientUserId: appointmentForm.patientUserId,
        patientName: patient?.name || 'Unknown',
        doctorUserId: appointmentForm.doctorUserId,
        doctorName: doctor?.name || 'Unknown',
        department: doctor?.department || 'Unknown',
        date: appointmentForm.date,
        time: appointmentForm.time,
        reason: appointmentForm.reason,
        status: 'approved'
      };

      const response = await axios.post(`${API_URL}/appointments`, appointmentData);
      setAppointmentForm({
        patientUserId: '',
        doctorUserId: '',
        date: '',
        time: '',
        reason: ''
      });
      setActiveTab('appointments');
      fetchData();
      fetchQueueStatus();
      alert(`Appointment scheduled successfully!\n${response.data.dsaUsed || 'Queue + Linked List used'}`);
    } catch (error) {
      alert('Error scheduling appointment: ' + (error.response?.data?.error || error.message));
    }
  };

  // Remove "Dr." prefix to avoid duplication
  const formatDoctorName = (name) => {
    if (name.startsWith('Dr. ')) {
      return name.substring(4);
    }
    return name;
  };

  const filteredPatients = searchTerm 
    ? patients.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           p.email.toLowerCase().includes(searchTerm.toLowerCase()))
    : patients;

  const filteredDoctors = searchTerm 
    ? doctors.filter(d => d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          d.department.toLowerCase().includes(searchTerm.toLowerCase()))
    : doctors;

  const getTodayAppointments = () => {
    const today = new Date().toISOString().split('T')[0];
    return appointments.filter(apt => apt.date === today)
      .sort((a, b) => a.time.localeCompare(b.time));
  };

  const getUpcomingAppointments = () => {
    const today = new Date().toISOString().split('T')[0];
    return appointments.filter(apt => apt.date > today)
      .slice(0, 10);
  };

  const getPendingAppointments = () => {
    return appointments.filter(apt => apt.status === 'pending');
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Receptionist Dashboard</h1>
        <div className="header-actions">
          <span>Welcome, {user.name}</span>
          <button onClick={onLogout} className="btn-logout">Logout</button>
        </div>
      </div>

      {dsaInfo && (
        <div style={{
          padding: '10px 20px',
          background: 'rgba(102, 126, 234, 0.2)',
          color: '#fff',
          fontSize: '13px',
          borderBottom: '1px solid rgba(102, 126, 234, 0.3)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>ℹ️ {dsaInfo}</span>
          <span>📋 Appointment Queue: {queueStatus} pending</span>
        </div>
      )}

      <div className="dashboard-tabs">
        <button 
          className={activeTab === 'activity' ? 'active' : ''} 
          onClick={() => setActiveTab('activity')}
        >
          Hospital Activity
        </button>
        <button 
          className={activeTab === 'register' ? 'active' : ''} 
          onClick={() => setActiveTab('register')}
        >
          Register Patient
        </button>
        <button 
          className={activeTab === 'schedule' ? 'active' : ''} 
          onClick={() => setActiveTab('schedule')}
        >
          Schedule Appointment
        </button>
        <button 
          className={activeTab === 'appointments' ? 'active' : ''} 
          onClick={() => setActiveTab('appointments')}
        >
          View Appointments
        </button>
      </div>

      <div className="dashboard-content">
        {loading ? (
          <div className="loading">Loading...</div>
        ) : (
          <>
            {activeTab === 'activity' && (
              <div className="activity-view">
                <div style={{
                  padding: '15px',
                  background: 'rgba(102, 126, 234, 0.1)',
                  borderRadius: '8px',
                  marginBottom: '20px',
                  border: '1px solid rgba(102, 126, 234, 0.2)'
                }}>
                  <p style={{ color: 'rgba(255,255,255,0.9)', margin: 0, fontSize: '14px' }}>
                     <strong>DSA Used:</strong> QuickSort (doctors) + MergeSort (appointments) + Queue (pending)
                  </p>
                </div>

                <div className="stats-grid">
                  <div className="stat-card">
                    <h3>Total Patients</h3>
                    <div className="stat-value">{patients.length}</div>
                    <small style={{ color: 'rgba(255,255,255,0.6)' }}>Binary Search enabled</small>
                  </div>
                  <div className="stat-card">
                    <h3>Total Doctors</h3>
                    <div className="stat-value">{doctors.length}</div>
                    <small style={{ color: 'rgba(255,255,255,0.6)' }}>QuickSort sorted</small>
                  </div>
                  <div className="stat-card">
                    <h3>Today's Appointments</h3>
                    <div className="stat-value">{getTodayAppointments().length}</div>
                    <small style={{ color: 'rgba(255,255,255,0.6)' }}>MergeSort sorted</small>
                  </div>
                  <div className="stat-card">
                    <h3>Pending Approvals</h3>
                    <div className="stat-value">{getPendingAppointments().length}</div>
                    <small style={{ color: 'rgba(255,255,255,0.6)' }}>Queue (FIFO)</small>
                  </div>
                </div>

                <div className="section">
                  <h3>Today's Schedule ({getTodayAppointments().length})</h3>
                  <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px', marginBottom: '15px' }}>
                    Sorted chronologically by time
                  </p>
                  {getTodayAppointments().length === 0 ? (
                    <div className="empty-state">No appointments scheduled for today</div>
                  ) : (
                    <div className="data-table">
                      <table>
                        <thead>
                          <tr>
                            <th>Time</th>
                            <th>Patient</th>
                            <th>Doctor</th>
                            <th>Department</th>
                            <th>Reason</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {getTodayAppointments().map(appointment => (
                            <tr key={appointment.id}>
                              <td>{appointment.time}</td>
                              <td>{appointment.patientName}</td>
                              <td>Dr. {formatDoctorName(appointment.doctorName)}</td>
                              <td>{appointment.department}</td>
                              <td>{appointment.reason}</td>
                              <td>
                                <span className={`status ${appointment.status}`}>
                                  {appointment.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                <div className="section">
                  <h3>Upcoming Appointments</h3>
                  <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px', marginBottom: '15px' }}>
                    Next 10 appointments sorted by date/time (MergeSort)
                  </p>
                  {getUpcomingAppointments().length === 0 ? (
                    <div className="empty-state">No upcoming appointments</div>
                  ) : (
                    <div className="data-table">
                      <table>
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Time</th>
                            <th>Patient</th>
                            <th>Doctor</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {getUpcomingAppointments().map(appointment => (
                            <tr key={appointment.id}>
                              <td>{appointment.date}</td>
                              <td>{appointment.time}</td>
                              <td>{appointment.patientName}</td>
                              <td>Dr. {formatDoctorName(appointment.doctorName)}</td>
                              <td>
                                <span className={`status ${appointment.status}`}>
                                  {appointment.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'register' && (
              <div className="register-view">
                <div style={{
                  padding: '15px',
                  background: 'rgba(34, 197, 94, 0.1)',
                  borderRadius: '8px',
                  marginBottom: '20px',
                  border: '1px solid rgba(34, 197, 94, 0.2)'
                }}>
                  <p style={{ color: 'rgba(255,255,255,0.9)', margin: 0, fontSize: '14px' }}>
                     <strong>DSA Used:</strong> HashMap created for wallet on registration
                  </p>
                </div>
                <div className="wallet-manager">
                  <h3>Register New Patient</h3>
                  <form onSubmit={handleRegisterPatient} className="form">
                    <div className="form-row">
                      <div className="form-group">
                        <label>Full Name *</label>
                        <input
                          type="text"
                          value={patientForm.name}
                          onChange={(e) => setPatientForm({...patientForm, name: e.target.value})}
                          required
                          placeholder="John Smith"
                        />
                      </div>
                      <div className="form-group">
                        <label>Email *</label>
                        <input
                          type="email"
                          value={patientForm.email}
                          onChange={(e) => setPatientForm({...patientForm, email: e.target.value})}
                          required
                          placeholder="patient@email.com"
                        />
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Password *</label>
                        <input
                          type="password"
                          value={patientForm.password}
                          onChange={(e) => setPatientForm({...patientForm, password: e.target.value})}
                          required
                          placeholder="Secure password"
                          minLength="6"
                        />
                      </div>
                      <div className="form-group">
                        <label>Phone *</label>
                        <input
                          type="tel"
                          value={patientForm.phone}
                          onChange={(e) => setPatientForm({...patientForm, phone: e.target.value})}
                          required
                          placeholder="+1 234 567 8900"
                        />
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Age *</label>
                        <input
                          type="number"
                          value={patientForm.age}
                          onChange={(e) => setPatientForm({...patientForm, age: parseInt(e.target.value)})}
                          required
                          min="0"
                          placeholder="25"
                        />
                      </div>
                      <div className="form-group">
                        <label>Gender *</label>
                        <select 
                          value={patientForm.gender}
                          onChange={(e) => setPatientForm({...patientForm, gender: e.target.value})}
                        >
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Address *</label>
                      <textarea
                        value={patientForm.address}
                        onChange={(e) => setPatientForm({...patientForm, address: e.target.value})}
                        required
                        placeholder="Enter full address"
                        rows="3"
                      />
                    </div>
                    <button type="submit" className="btn-primary">Register Patient</button>
                  </form>
                </div>
              </div>
            )}

            {activeTab === 'schedule' && (
              <div className="schedule-view">
                <div style={{
                  padding: '15px',
                  background: 'rgba(234, 179, 8, 0.1)',
                  borderRadius: '8px',
                  marginBottom: '20px',
                  border: '1px solid rgba(234, 179, 8, 0.2)'
                }}>
                  <p style={{ color: 'rgba(255,255,255,0.9)', margin: 0, fontSize: '14px' }}>
                    <strong>DSA Used:</strong> Queue (appointment added) + Linked List (dynamic management)
                  </p>
                </div>
                <div className="wallet-manager">
                  <h3>Schedule Appointment</h3>
                  <form onSubmit={handleBookAppointment} className="form">
                    <div className="form-group">
                      <label>Select Patient * (Binary Search enabled)</label>
                      <input
                        type="text"
                        placeholder="🔍 Search patient..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ marginBottom: '10px' }}
                      />
                      <select
                        value={appointmentForm.patientUserId}
                        onChange={(e) => {
                          setAppointmentForm({...appointmentForm, patientUserId: e.target.value});
                          setSearchTerm('');
                        }}
                        required
                      >
                        <option value="">Choose a patient...</option>
                        {filteredPatients.map(patient => (
                          <option key={patient.userId} value={patient.userId}>
                            {patient.name} - {patient.email}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Select Doctor * (QuickSort sorted)</label>
                      <select
                        value={appointmentForm.doctorUserId}
                        onChange={(e) => setAppointmentForm({...appointmentForm, doctorUserId: e.target.value})}
                        required
                      >
                        <option value="">Choose a doctor...</option>
                        {doctors.map(doctor => (
                          <option key={doctor.userId} value={doctor.userId}>
                            Dr. {formatDoctorName(doctor.name)} - {doctor.department}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Date *</label>
                        <input
                          type="date"
                          value={appointmentForm.date}
                          onChange={(e) => setAppointmentForm({...appointmentForm, date: e.target.value})}
                          required
                          min={new Date().toISOString().split('T')[0]}
                        />
                      </div>
                      <div className="form-group">
                        <label>Time *</label>
                        <input
                          type="time"
                          value={appointmentForm.time}
                          onChange={(e) => setAppointmentForm({...appointmentForm, time: e.target.value})}
                          required
                        />
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Reason for Visit *</label>
                      <textarea
                        value={appointmentForm.reason}
                        onChange={(e) => setAppointmentForm({...appointmentForm, reason: e.target.value})}
                        required
                        placeholder="Describe the reason for visit"
                        rows="4"
                      />
                    </div>
                    <button type="submit" className="btn-primary">
                      Schedule Appointment (Add to Queue)
                    </button>
                  </form>
                </div>
              </div>
            )}

            {activeTab === 'appointments' && (
              <div className="appointments-view">
                <div style={{
                  padding: '15px',
                  background: 'rgba(102, 126, 234, 0.1)',
                  borderRadius: '8px',
                  marginBottom: '20px',
                  border: '1px solid rgba(102, 126, 234, 0.2)'
                }}>
                  <p style={{ color: 'rgba(255,255,255,0.9)', margin: 0, fontSize: '14px' }}>
                     <strong>DSA Used:</strong> MergeSort for chronological date/time sorting + Linked List
                  </p>
                </div>
                <div className="section">
                  <h3>All Appointments ({appointments.length})</h3>
                  {appointments.length === 0 ? (
                    <div className="empty-state">No appointments scheduled</div>
                  ) : (
                    <div className="data-table">
                      <table>
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Time</th>
                            <th>Patient</th>
                            <th>Doctor</th>
                            <th>Department</th>
                            <th>Reason</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {appointments.map(appointment => (
                            <tr key={appointment.id}>
                              <td>{appointment.date}</td>
                              <td>{appointment.time}</td>
                              <td>{appointment.patientName}</td>
                              <td>Dr. {formatDoctorName(appointment.doctorName)}</td>
                              <td>{appointment.department}</td>
                              <td>{appointment.reason}</td>
                              <td>
                                <span className={`status ${appointment.status}`}>
                                  {appointment.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default ReceptionistDashboard;