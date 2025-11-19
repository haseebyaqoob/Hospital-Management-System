import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../Dashboard.css';

const API_URL = 'http://localhost:8080/api';

function DoctorDashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('appointments');
  const [appointments, setAppointments] = useState([]);
  const [wallet, setWallet] = useState({ balance: 0, transactions: [] });
  const [loading, setLoading] = useState(false);
  const [doctorProfile, setDoctorProfile] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [queueStatus, setQueueStatus] = useState(0);
  const [dsaInfo, setDsaInfo] = useState(null);
  
  const [scheduleForm, setScheduleForm] = useState({
    weekday: '9:00 AM - 5:00 PM',
    saturday: '9:00 AM - 1:00 PM',
    sunday: 'Closed'
  });

  const [profileForm, setProfileForm] = useState({
    department: '',
    specialization: '',
    experience: 0
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

  const fetchDoctorProfile = async () => {
    try {
      const response = await axios.get(`${API_URL}/doctors`);
      const doctor = response.data.doctors.find(d => d.userId === user.userId);
      if (doctor) {
        setDoctorProfile(doctor);
        
        // Set profile form
        setProfileForm({
          department: doctor.department || '',
          specialization: doctor.specialization || '',
          experience: doctor.experience || 0
        });
        
        // Set schedule form
        if (doctor.schedule && doctor.schedule.length > 0) {
          const scheduleMap = {};
          doctor.schedule.forEach(item => {
            scheduleMap[item.day] = item.hours;
          });
          setScheduleForm({
            weekday: scheduleMap['weekday'] || '9:00 AM - 5:00 PM',
            saturday: scheduleMap['saturday'] || '9:00 AM - 1:00 PM',
            sunday: scheduleMap['sunday'] || 'Closed'
          });
        }
      }
    } catch (error) {
      console.error('Error fetching doctor profile:', error);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'appointments') {
        const response = await axios.get(`${API_URL}/appointments`);
        const doctorAppointments = response.data.appointments.filter(
          apt => apt.doctorUserId === user.userId
        );
        setAppointments(doctorAppointments);
        setDsaInfo(`DSA: ${response.data.dsaUsed || 'MergeSort + Queue'}`);
      } else if (activeTab === 'wallet') {
        const response = await axios.get(`${API_URL}/wallet/${user.userId}`);
        setWallet(response.data);
        setDsaInfo(`DSA: ${response.data.dsaUsed || 'HashMap lookup'}`);
      } else if (activeTab === 'schedule' || activeTab === 'profile') {
        await fetchDoctorProfile();
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSchedule = async (e) => {
    e.preventDefault();
    
    if (!doctorProfile) {
      alert('Error: Doctor profile not found');
      return;
    }

    try {
      const scheduleData = {
        schedule: [
          { day: 'weekday', hours: scheduleForm.weekday },
          { day: 'saturday', hours: scheduleForm.saturday },
          { day: 'sunday', hours: scheduleForm.sunday }
        ]
      };

      await axios.put(`${API_URL}/doctors/${doctorProfile.id}/schedule`, scheduleData);
      alert('Schedule updated successfully!');
      fetchDoctorProfile();
    } catch (error) {
      console.error('Error updating schedule:', error);
      alert('Error updating schedule: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    
    if (!doctorProfile) {
      alert('Error: Doctor profile not found');
      return;
    }

    try {
      await axios.put(`${API_URL}/doctors/${doctorProfile.id}`, profileForm);
      alert('Profile updated successfully!');
      await fetchDoctorProfile();
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Error updating profile: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleApproveAppointment = async (appointmentId) => {
    if (window.confirm('Are you sure you want to approve this appointment?')) {
      try {
        await axios.put(`${API_URL}/appointments/${appointmentId}`, {
          status: 'approved',
          rejectionReason: ''
        });
        alert('Appointment approved successfully! (Processed from Queue)');
        fetchData();
        fetchQueueStatus();
      } catch (error) {
        alert('Error approving appointment: ' + (error.response?.data?.error || error.message));
      }
    }
  };

  const handleRejectClick = (appointment) => {
    setSelectedAppointment(appointment);
    setShowRejectModal(true);
  };

  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    
    if (!rejectionReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    try {
      await axios.put(`${API_URL}/appointments/${selectedAppointment.id}`, {
        status: 'rejected',
        rejectionReason: rejectionReason
      });
      alert('Appointment rejected successfully! (Processed from Queue)');
      setShowRejectModal(false);
      setRejectionReason('');
      setSelectedAppointment(null);
      fetchData();
      fetchQueueStatus();
    } catch (error) {
      alert('Error rejecting appointment: ' + (error.response?.data?.error || error.message));
    }
  };

  const getPendingAppointments = () => {
    return appointments.filter(apt => apt.status === 'pending')
      .sort((a, b) => new Date(a.date + ' ' + a.time) - new Date(b.date + ' ' + b.time));
  };

  const getApprovedAppointments = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return appointments.filter(apt => {
      const aptDate = new Date(apt.date);
      return apt.status === 'approved' && aptDate >= today;
    }).sort((a, b) => new Date(a.date + ' ' + a.time) - new Date(b.date + ' ' + b.time));
  };

  const getPastAppointments = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return appointments.filter(apt => {
      const aptDate = new Date(apt.date);
      return (aptDate < today && apt.status === 'approved') || apt.status === 'rejected' || apt.status === 'completed';
    }).sort((a, b) => new Date(b.date + ' ' + b.time) - new Date(a.date + ' ' + a.time));
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Doctor Dashboard</h1>
        <div className="header-actions">
          <span>Welcome, Dr. {user.name}</span>
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
          <span>📋 Pending Queue: {queueStatus} appointments</span>
        </div>
      )}

      <div className="dashboard-tabs">
        <button 
          className={activeTab === 'appointments' ? 'active' : ''} 
          onClick={() => setActiveTab('appointments')}
        >
          Appointments
        </button>
        <button 
          className={activeTab === 'schedule' ? 'active' : ''} 
          onClick={() => setActiveTab('schedule')}
        >
          My Schedule
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
            {activeTab === 'appointments' && (
              <div className="appointments-view">
                <div style={{
                  padding: '15px',
                  background: 'rgba(234, 179, 8, 0.1)',
                  borderRadius: '8px',
                  marginBottom: '20px',
                  border: '1px solid rgba(234, 179, 8, 0.2)'
                }}>
                  <p style={{ color: 'rgba(255,255,255,0.9)', margin: 0, fontSize: '14px' }}>
                    <strong>DSA Used:</strong> Queue (FIFO) for processing pending appointments + MergeSort for date/time sorting
                  </p>
                </div>

                <div className="section">
                  <h3>Pending Appointments ({getPendingAppointments().length}) 🔄</h3>
                  <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px', marginBottom: '15px' }}>
                    Process appointments in First-In-First-Out (FIFO) order using Queue data structure
                  </p>
                  {getPendingAppointments().length === 0 ? (
                    <div className="empty-state">No pending appointments</div>
                  ) : (
                    <div className="data-table">
                      <table>
                        <thead>
                          <tr>
                            <th>Patient Name</th>
                            <th>Date</th>
                            <th>Time</th>
                            <th>Reason</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {getPendingAppointments().map(appointment => (
                            <tr key={appointment.id}>
                              <td>{appointment.patientName}</td>
                              <td>{appointment.date}</td>
                              <td>{appointment.time}</td>
                              <td>{appointment.reason}</td>
                              <td>
                                <button 
                                  onClick={() => handleApproveAppointment(appointment.id)}
                                  className="btn-success"
                                  style={{marginRight: '8px'}}
                                >
                                  ✓ Approve
                                </button>
                                <button 
                                  onClick={() => handleRejectClick(appointment)}
                                  className="btn-danger"
                                >
                                  ✗ Reject
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                <div className="section">
                  <h3>Approved Upcoming Appointments ({getApprovedAppointments().length})</h3>
                  {getApprovedAppointments().length === 0 ? (
                    <div className="empty-state">No approved upcoming appointments</div>
                  ) : (
                    <div className="data-table">
                      <table>
                        <thead>
                          <tr>
                            <th>Patient Name</th>
                            <th>Date</th>
                            <th>Time</th>
                            <th>Reason</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {getApprovedAppointments().map(appointment => (
                            <tr key={appointment.id}>
                              <td>{appointment.patientName}</td>
                              <td>{appointment.date}</td>
                              <td>{appointment.time}</td>
                              <td>{appointment.reason}</td>
                              <td>
                                <span className="status completed">
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
                            <th>Patient Name</th>
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
                              <td>{appointment.patientName}</td>
                              <td>{appointment.date}</td>
                              <td>{appointment.time}</td>
                              <td>{appointment.reason}</td>
                              <td>
                                <span className={`status ${appointment.status}`}>
                                  {appointment.status}
                                </span>
                              </td>
                              <td>
                                {appointment.status === 'rejected' ? appointment.rejectionReason : '-'}
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

            {activeTab === 'schedule' && (
              <div className="schedule-view">
                <div className="wallet-manager">
                  <h3>Manage Work Schedule</h3>
                  <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '25px', fontSize: '15px' }}>
                    Set your availability for patients to book appointments
                  </p>
                  <form onSubmit={handleUpdateSchedule} className="form">
                    <div className="form-group">
                      <label>Monday - Friday</label>
                      <input 
                        type="text" 
                        value={scheduleForm.weekday}
                        onChange={(e) => setScheduleForm({...scheduleForm, weekday: e.target.value})}
                        placeholder="e.g., 9:00 AM - 5:00 PM"
                      />
                    </div>
                    <div className="form-group">
                      <label>Saturday</label>
                      <input 
                        type="text" 
                        value={scheduleForm.saturday}
                        onChange={(e) => setScheduleForm({...scheduleForm, saturday: e.target.value})}
                        placeholder="e.g., 9:00 AM - 1:00 PM"
                      />
                    </div>
                    <div className="form-group">
                      <label>Sunday</label>
                      <input 
                        type="text" 
                        value={scheduleForm.sunday}
                        onChange={(e) => setScheduleForm({...scheduleForm, sunday: e.target.value})}
                        placeholder="e.g., Closed or 10:00 AM - 2:00 PM"
                      />
                    </div>
                    <button type="submit" className="btn-primary">Update Schedule</button>
                  </form>
                  
                  {doctorProfile && doctorProfile.schedule && doctorProfile.schedule.length > 0 && (
                    <div style={{
                      marginTop: '30px', 
                      padding: '20px', 
                      background: 'rgba(102, 126, 234, 0.1)', 
                      borderRadius: '12px',
                      border: '1px solid rgba(102, 126, 234, 0.2)'
                    }}>
                      <h4 style={{ color: 'white', marginBottom: '15px' }}>Current Schedule:</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {doctorProfile.schedule.map((item, index) => (
                          <div key={index} style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            padding: '10px 15px',
                            background: 'rgba(255,255,255,0.05)',
                            borderRadius: '8px'
                          }}>
                            <strong style={{ color: 'rgba(255,255,255,0.9)' }}>
                              {item.day === 'weekday' ? 'Mon-Fri' : item.day.charAt(0).toUpperCase() + item.day.slice(1)}:
                            </strong>
                            <span style={{ color: 'rgba(255,255,255,0.7)' }}>{item.hours}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'wallet' && (
              <div className="wallet-view">
                <div style={{
                  padding: '15px',
                  background: 'rgba(34, 197, 94, 0.1)',
                  borderRadius: '8px',
                  marginBottom: '20px',
                  border: '1px solid rgba(34, 197, 94, 0.2)'
                }}>
                  <p style={{ color: 'rgba(255,255,255,0.9)', margin: 0, fontSize: '14px' }}>
                     <strong>DSA Used:</strong> HashMap for O(1) fast wallet lookup + Stack for undo operations
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
                    Update your professional information
                  </p>

                  {doctorProfile && (
                    <div style={{
                      background: 'rgba(102, 126, 234, 0.1)',
                      padding: '15px',
                      borderRadius: '8px',
                      marginBottom: '20px',
                      border: '1px solid rgba(102, 126, 234, 0.2)'
                    }}>
                      <p style={{ color: 'white', marginBottom: '5px' }}>
                        <strong>Name:</strong> Dr. {doctorProfile.name}
                      </p>
                      <p style={{ color: 'white', margin: 0 }}>
                        <strong>Email:</strong> {doctorProfile.email}
                      </p>
                    </div>
                  )}

                  <form onSubmit={handleUpdateProfile} className="form">
                    <div className="form-group">
                      <label>Department *</label>
                      <input 
                        type="text" 
                        value={profileForm.department}
                        onChange={(e) => setProfileForm({...profileForm, department: e.target.value})}
                        required
                        placeholder="e.g., Cardiology, Neurology"
                      />
                    </div>
                    <div className="form-group">
                      <label>Specialization *</label>
                      <input 
                        type="text" 
                        value={profileForm.specialization}
                        onChange={(e) => setProfileForm({...profileForm, specialization: e.target.value})}
                        required
                        placeholder="e.g., Heart Surgery, Brain Surgery"
                      />
                    </div>
                    <div className="form-group">
                      <label>Experience (years) *</label>
                      <input 
                        type="number" 
                        value={profileForm.experience}
                        onChange={(e) => setProfileForm({...profileForm, experience: parseInt(e.target.value)})}
                        required
                        min="0"
                        placeholder="Years of experience"
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

      {/* Rejection Modal */}
      {showRejectModal && (
        <div className="modal">
          <div className="modal-content">
            <h2>Reject Appointment</h2>
            <div style={{ 
              background: 'rgba(239, 68, 68, 0.1)', 
              padding: '15px', 
              borderRadius: '12px', 
              marginBottom: '20px',
              border: '1px solid rgba(239, 68, 68, 0.2)'
            }}>
              <p style={{ color: 'rgba(255,255,255,0.9)', marginBottom: '5px' }}>
                <strong>Patient:</strong> {selectedAppointment?.patientName}
              </p>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px' }}>
                <strong>Scheduled:</strong> {selectedAppointment?.date} at {selectedAppointment?.time}
              </p>
            </div>
            <form onSubmit={handleRejectSubmit} className="form">
              <div className="form-group">
                <label>Reason for Rejection *</label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  required
                  placeholder="Please provide a clear reason for rejecting this appointment..."
                  rows="4"
                />
              </div>
              <div className="modal-actions">
                <button type="submit" className="btn-danger">Reject Appointment</button>
                <button 
                  type="button" 
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectionReason('');
                    setSelectedAppointment(null);
                  }} 
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default DoctorDashboard;