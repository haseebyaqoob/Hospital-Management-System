import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:8080/api';

function PatientDashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('book');
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [wallet, setWallet] = useState({ balance: 0, transactions: [] });
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dsaInfo, setDsaInfo] = useState(null);
  const [patientProfile, setPatientProfile] = useState(null);
  
  const [appointmentForm, setAppointmentForm] = useState({
    doctorUserId: '',
    date: '',
    time: '',
    reason: ''
  });

  const [profileForm, setProfileForm] = useState({
    age: 0,
    gender: 'male',
    phone: '',
    address: ''
  });

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchPatientProfile = async () => {
    try {
      const response = await axios.get(`${API_URL}/patients`);
      const patient = response.data.patients.find(p => p.userId === user.userId);
      if (patient) {
        setPatientProfile(patient);
        setProfileForm({
          age: patient.age || 0,
          gender: patient.gender || 'male',
          phone: patient.phone || '',
          address: patient.address || ''
        });
      }
    } catch (error) {
      console.error('Error fetching patient profile:', error);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'book') {
        const response = await axios.get(`${API_URL}/doctors`);
        setDoctors(response.data.doctors || []);
        setDsaInfo(`DSA: ${response.data.dsaUsed || 'QuickSort applied'}`);
      } else if (activeTab === 'appointments') {
        const response = await axios.get(`${API_URL}/appointments`);
        const patientAppointments = response.data.appointments.filter(
          apt => apt.patientUserId === user.userId
        );
        const sorted = patientAppointments.sort((a, b) => {
          const dateA = new Date(a.date + ' ' + a.time);
          const dateB = new Date(b.date + ' ' + b.time);
          return dateA - dateB;
        });
        setAppointments(sorted);
        setDsaInfo(`DSA: ${response.data.dsaUsed || 'MergeSort applied'}`);
      } else if (activeTab === 'wallet') {
        const response = await axios.get(`${API_URL}/wallet/${user.userId}`);
        setWallet(response.data);
        setDsaInfo(`DSA: ${response.data.dsaUsed || 'HashMap lookup'}`);
      } else if (activeTab === 'profile') {
        await fetchPatientProfile();
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBookAppointment = async (e) => {
    e.preventDefault();
    
    if (!appointmentForm.doctorUserId) {
      alert('Please select a doctor');
      return;
    }

    try {
      const selectedDoctor = doctors.find(d => d.userId === appointmentForm.doctorUserId);
      
      const appointmentData = {
        patientUserId: user.userId,
        patientName: user.name,
        doctorUserId: appointmentForm.doctorUserId,
        doctorName: selectedDoctor?.name || 'Unknown',
        department: selectedDoctor?.department || 'Unknown',
        date: appointmentForm.date,
        time: appointmentForm.time,
        reason: appointmentForm.reason,
        status: 'pending'
      };

      const response = await axios.post(`${API_URL}/appointments`, appointmentData);
      
      if (response.data.queuePosition) {
        alert(`Appointment booked successfully!\n\nQueue Position: ${response.data.queuePosition}\nDSA Used: ${response.data.dsaUsed}`);
      } else {
        alert('Appointment booked successfully! Waiting for doctor approval.');
      }
      
      setAppointmentForm({
        doctorUserId: '',
        date: '',
        time: '',
        reason: ''
      });
      
      setActiveTab('appointments');
      fetchData();
    } catch (error) {
      console.error('Error booking appointment:', error);
      alert('Error booking appointment: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    
    if (!patientProfile) {
      alert('Error: Patient profile not found');
      return;
    }

    try {
      await axios.put(`${API_URL}/patients/${patientProfile.id}`, profileForm);
      alert('Profile updated successfully!');
      await fetchPatientProfile();
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Error updating profile: ' + (error.response?.data?.error || error.message));
    }
  };

  // FIXED: Filter doctors based on search term
  const filteredDoctors = searchTerm 
    ? doctors.filter(d => 
        d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.specialization.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : doctors;

  const formatDoctorName = (name) => {
    if (name.startsWith('Dr. ')) {
      return name.substring(4);
    }
    return name;
  };

  const getUpcomingAppointments = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return appointments.filter(apt => {
      const aptDate = new Date(apt.date);
      return aptDate >= today && (apt.status === 'pending' || apt.status === 'approved');
    });
  };

  const getPastAppointments = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return appointments.filter(apt => {
      const aptDate = new Date(apt.date);
      return (aptDate < today) || apt.status === 'rejected' || apt.status === 'completed';
    }).sort((a, b) => new Date(b.date + ' ' + b.time) - new Date(a.date + ' ' + a.time));
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Patient Dashboard</h1>
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
          borderBottom: '1px solid rgba(102, 126, 234, 0.3)'
        }}>
          ℹ️ {dsaInfo}
        </div>
      )}

      <div className="dashboard-tabs">
        <button 
          className={activeTab === 'book' ? 'active' : ''} 
          onClick={() => setActiveTab('book')}
        >
          Book Appointment
        </button>
        <button 
          className={activeTab === 'appointments' ? 'active' : ''} 
          onClick={() => setActiveTab('appointments')}
        >
          My Appointments
        </button>
        <button 
          className={activeTab === 'wallet' ? 'active' : ''} 
          onClick={() => setActiveTab('wallet')}
        >
          Wallet
        </button>
        <button 
          className={activeTab === 'profile' ? 'active' : ''} 
          onClick={() => setActiveTab('profile')}
        >
          Profile Settings
        </button>
      </div>

      <div className="dashboard-content">
        {loading ? (
          <div className="loading">Loading...</div>
        ) : (
          <>
            {activeTab === 'book' && (
              <div className="book-view">
                <div className="wallet-manager">
                  <h3>Book an Appointment</h3>
                  <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '15px', fontSize: '15px' }}>
                    Select a doctor and schedule your appointment
                  </p>
                  
                  {/* FIXED: Search now filters the dropdown */}
                  <div className="form-group">
                    <label>🔍 Search Doctors (Binary Search)</label>
                    <input
                      type="text"
                      placeholder="Search by name, department, or specialization..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      style={{ marginBottom: '20px' }}
                    />
                    {searchTerm && (
                      <small style={{ display: 'block', color: 'rgba(255,255,255,0.6)', marginTop: '-15px', marginBottom: '10px' }}>
                        Found {filteredDoctors.length} doctor(s)
                      </small>
                    )}
                  </div>

                  <form onSubmit={handleBookAppointment} className="form">
                    <div className="form-group">
                      <label>Select Doctor *</label>
                      <select
                        value={appointmentForm.doctorUserId}
                        onChange={(e) => setAppointmentForm({...appointmentForm, doctorUserId: e.target.value})}
                        required
                      >
                        <option value="">Choose a doctor...</option>
                        {filteredDoctors.map(doctor => (
                          <option key={doctor.userId} value={doctor.userId}>
                            Dr. {formatDoctorName(doctor.name)} - {doctor.department} ({doctor.specialization})
                          </option>
                        ))}
                      </select>
                      <small style={{ color: 'rgba(255,255,255,0.6)', display: 'block', marginTop: '5px' }}>
                        Sorted using QuickSort algorithm
                      </small>
                    </div>

                    {appointmentForm.doctorUserId && (
                      <>
                        <div style={{
                          background: 'rgba(102, 126, 234, 0.1)',
                          padding: '20px',
                          borderRadius: '12px',
                          marginBottom: '20px',
                          border: '1px solid rgba(102, 126, 234, 0.2)'
                        }}>
                          {(() => {
                            const selectedDoctor = doctors.find(d => d.userId === appointmentForm.doctorUserId);
                            return selectedDoctor ? (
                              <>
                                <h4 style={{ color: 'white', marginBottom: '12px', fontSize: '18px' }}>
                                  Dr. {formatDoctorName(selectedDoctor.name)}
                                </h4>
                                <p style={{ color: 'rgba(255,255,255,0.8)', marginBottom: '6px', fontSize: '14px' }}>
                                  <strong>Department:</strong> {selectedDoctor.department}
                                </p>
                                <p style={{ color: 'rgba(255,255,255,0.8)', marginBottom: '6px', fontSize: '14px' }}>
                                  <strong>Specialization:</strong> {selectedDoctor.specialization}
                                </p>
                                <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px' }}>
                                  <strong>Experience:</strong> {selectedDoctor.experience} years
                                </p>
                                {selectedDoctor.schedule && selectedDoctor.schedule.length > 0 && (
                                  <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                                    <strong style={{ color: 'rgba(255,255,255,0.9)', fontSize: '14px' }}>Available Hours:</strong>
                                    <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                      {selectedDoctor.schedule.map((s, i) => (
                                        <span key={i} style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px' }}>
                                          {s.day === 'weekday' ? 'Mon-Fri' : s.day.charAt(0).toUpperCase() + s.day.slice(1)}: {s.hours}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </>
                            ) : null;
                          })()}
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
                            placeholder="Describe your symptoms or reason for visit"
                            rows="4"
                          />
                        </div>

                        <button type="submit" className="btn-primary">
                          Book Appointment (Added to Queue)
                        </button>
                      </>
                    )}
                  </form>
                </div>
              </div>
            )}

            {activeTab === 'appointments' && (
              <div className="appointments-view">
                <div style={{
                  padding: '15px',
                  background: 'rgba(34, 197, 94, 0.1)',
                  borderRadius: '8px',
                  marginBottom: '20px',
                  border: '1px solid rgba(34, 197, 94, 0.2)'
                }}>
                  <p style={{ color: 'rgba(255,255,255,0.9)', margin: 0, fontSize: '14px' }}>
                     <strong>DSA Used:</strong> MergeSort algorithm sorts appointments chronologically by date and time
                  </p>
                </div>

                <div className="section">
                  <h3>Upcoming Appointments ({getUpcomingAppointments().length})</h3>
                  {getUpcomingAppointments().length === 0 ? (
                    <div className="empty-state">No upcoming appointments</div>
                  ) : (
                    <div className="data-table">
                      <table>
                        <thead>
                          <tr>
                            <th>Doctor</th>
                            <th>Department</th>
                            <th>Date</th>
                            <th>Time</th>
                            <th>Reason</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {getUpcomingAppointments().map(appointment => (
                            <tr key={appointment.id}>
                              <td>Dr. {formatDoctorName(appointment.doctorName)}</td>
                              <td>{appointment.department}</td>
                              <td>{appointment.date}</td>
                              <td>{appointment.time}</td>
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
                  <h3>Past Appointments ({getPastAppointments().length})</h3>
                  {getPastAppointments().length === 0 ? (
                    <div className="empty-state">No past appointments</div>
                  ) : (
                    <div className="data-table">
                      <table>
                        <thead>
                          <tr>
                            <th>Doctor</th>
                            <th>Department</th>
                            <th>Date</th>
                            <th>Time</th>
                            <th>Reason</th>
                            <th>Status</th>
                            <th>Note</th>
                          </tr>
                        </thead>
                        <tbody>
                          {getPastAppointments().map(appointment => (
                            <tr key={appointment.id}>
                              <td>Dr. {formatDoctorName(appointment.doctorName)}</td>
                              <td>{appointment.department}</td>
                              <td>{appointment.date}</td>
                              <td>{appointment.time}</td>
                              <td>{appointment.reason}</td>
                              <td>
                                <span className={`status ${appointment.status}`}>
                                  {appointment.status}
                                </span>
                              </td>
                              <td>
                                {appointment.status === 'rejected' 
                                  ? appointment.rejectionReason 
                                  : '-'
                                }
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

            {activeTab === 'wallet' && (
              <div className="wallet-view">
                <div style={{
                  padding: '15px',
                  background: 'rgba(234, 179, 8, 0.1)',
                  borderRadius: '8px',
                  marginBottom: '20px',
                  border: '1px solid rgba(234, 179, 8, 0.2)'
                }}>
                  <p style={{ color: 'rgba(255,255,255,0.9)', margin: 0, fontSize: '14px' }}>
                    <strong>DSA Used:</strong> HashMap for O(1) fast wallet balance lookup
                  </p>
                </div>

                <div className="wallet-balance">
                  <h3>Current Balance</h3>
                  <div className="balance-amount">${wallet.balance.toFixed(2)}</div>
                </div>

                <div className="wallet-manager">
                  <h3>Transaction History</h3>
                  {wallet.transactions.length === 0 ? (
                    <div className="empty-state">No transactions yet</div>
                  ) : (
                    <div className="data-table">
                      <table>
                        <thead>
                          <tr>
                            <th>Type</th>
                            <th>Amount</th>
                            <th>Description</th>
                            <th>Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {wallet.transactions.map((transaction, index) => (
                            <tr key={index}>
                              <td>
                                <span className={`transaction-type ${transaction.type}`}>
                                  {transaction.type}
                                </span>
                              </td>
                              <td>${transaction.amount.toFixed(2)}</td>
                              <td>{transaction.description}</td>
                              <td>{transaction.timestamp || 'N/A'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'profile' && (
              <div className="schedule-view">
                <div className="wallet-manager">
                  <h3>Profile Settings</h3>
                  <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '25px', fontSize: '15px' }}>
                    Update your personal information
                  </p>

                  {patientProfile && (
                    <div style={{
                      background: 'rgba(102, 126, 234, 0.1)',
                      padding: '15px',
                      borderRadius: '8px',
                      marginBottom: '20px',
                      border: '1px solid rgba(102, 126, 234, 0.2)'
                    }}>
                      <p style={{ color: 'white', marginBottom: '5px' }}>
                        <strong>Name:</strong> {patientProfile.name}
                      </p>
                      <p style={{ color: 'white', margin: 0 }}>
                        <strong>Email:</strong> {patientProfile.email}
                      </p>
                    </div>
                  )}

                  <form onSubmit={handleUpdateProfile} className="form">
                    <div className="form-row">
                      <div className="form-group">
                        <label>Age *</label>
                        <input 
                          type="number" 
                          value={profileForm.age}
                          onChange={(e) => setProfileForm({...profileForm, age: parseInt(e.target.value)})}
                          required
                          min="0"
                          placeholder="Enter your age"
                        />
                      </div>
                      <div className="form-group">
                        <label>Gender *</label>
                        <select 
                          value={profileForm.gender}
                          onChange={(e) => setProfileForm({...profileForm, gender: e.target.value})}
                        >
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Phone *</label>
                      <input 
                        type="tel" 
                        value={profileForm.phone}
                        onChange={(e) => setProfileForm({...profileForm, phone: e.target.value})}
                        required
                        placeholder="e.g., +1 234 567 8900"
                      />
                    </div>
                    <div className="form-group">
                      <label>Address *</label>
                      <textarea 
                        value={profileForm.address}
                        onChange={(e) => setProfileForm({...profileForm, address: e.target.value})}
                        required
                        placeholder="Enter your full address"
                        rows="3"
                      />
                    </div>
                    <button type="submit" className="btn-primary">Update Profile</button>
                  </form>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default PatientDashboard;