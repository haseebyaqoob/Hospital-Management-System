import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:8080/api';

function AdminDashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [walletHistory, setWalletHistory] = useState([]);
  
  const [doctorForm, setDoctorForm] = useState({
    name: '',
    email: '',
    password: '',
    department: '',
    specialization: '',
    experience: 0
  });

  const [patientForm, setPatientForm] = useState({
    name: '',
    email: '',
    password: '',
    age: 0,
    gender: 'male',
    phone: '',
    address: ''
  });

  const [walletForm, setWalletForm] = useState({
    userId: '',
    amount: 0,
    type: 'credit',
    description: ''
  });

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchWalletHistory = async () => {
    try {
      const response = await axios.get(`${API_URL}/wallet/history`);
      setWalletHistory(response.data.history || []);
    } catch (error) {
      console.error('Error fetching wallet history:', error);
      setWalletHistory([]);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [doctorsRes, patientsRes, appointmentsRes] = await Promise.all([
        axios.get(`${API_URL}/doctors`),
        axios.get(`${API_URL}/patients`),
        axios.get(`${API_URL}/appointments`)
      ]);
      
      setDoctors(doctorsRes.data.doctors || []);
      setPatients(patientsRes.data.patients || []);
      
      const sortedAppointments = (appointmentsRes.data.appointments || []).sort((a, b) => {
        const dateA = new Date(a.date + ' ' + a.time);
        const dateB = new Date(b.date + ' ' + b.time);
        return dateA - dateB;
      });
      setAppointments(sortedAppointments);

      if (activeTab === 'wallets') {
        await fetchWalletHistory();
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddDoctor = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/doctors`, doctorForm);
      setShowAddModal(false);
      setDoctorForm({
        name: '',
        email: '',
        password: '',
        department: '',
        specialization: '',
        experience: 0
      });
      fetchData();
      alert('Doctor added successfully!');
    } catch (error) {
      alert('Error adding doctor: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleAddPatient = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/patients`, patientForm);
      setShowAddModal(false);
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
      alert('Patient added successfully!');
    } catch (error) {
      alert('Error adding patient: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleDeleteDoctor = async (id) => {
    if (window.confirm('Are you sure you want to delete this doctor?')) {
      try {
        await axios.delete(`${API_URL}/doctors/${id}`);
        fetchData();
        alert('Doctor deleted successfully!');
      } catch (error) {
        alert('Error deleting doctor: ' + (error.response?.data?.error || error.message));
      }
    }
  };

  const handleDeletePatient = async (id) => {
    if (window.confirm('Are you sure you want to delete this patient?')) {
      try {
        await axios.delete(`${API_URL}/patients/${id}`);
        fetchData();
        alert('Patient deleted successfully!');
      } catch (error) {
        alert('Error deleting patient: ' + (error.response?.data?.error || error.message));
      }
    }
  };

  const handleUpdateWallet = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API_URL}/wallet`, walletForm);
      setWalletForm({
        userId: '',
        amount: 0,
        type: 'credit',
        description: ''
      });
      alert(`Wallet updated successfully!\n${response.data.dsaUsed || 'HashMap + Stack used'}`);
      await fetchWalletHistory();
    } catch (error) {
      alert('Error updating wallet: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleUndoWallet = async () => {
    if (window.confirm('Are you sure you want to undo the last wallet operation?')) {
      try {
        const response = await axios.post(`${API_URL}/wallet/undo`);
        alert(`Undo successful!\nUser: ${response.data.userId}\nReverted to: $${response.data.revertedBalance}\nDSA: ${response.data.dsaUsed}`);
        await fetchWalletHistory();
      } catch (error) {
        alert('Error undoing wallet update: ' + (error.response?.data?.error || error.message));
      }
    }
  };

  const formatDoctorName = (name) => {
    if (name.startsWith('Dr. ')) {
      return name.substring(4);
    }
    return name;
  };

  const filteredDoctors = searchTerm 
    ? doctors.filter(doctor =>
        doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doctor.department.toLowerCase().includes(searchTerm.toLowerCase()))
    : doctors;

  const filteredPatients = searchTerm
    ? patients.filter(patient =>
        patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.email.toLowerCase().includes(searchTerm.toLowerCase()))
    : patients;

  const getTodayAppointments = () => {
    const today = new Date().toISOString().split('T')[0];
    return appointments.filter(apt => apt.patientName && apt.doctorName && apt.date === today);
  };

  const getPendingAppointments = () => {
    return appointments.filter(apt => apt.patientName && apt.doctorName && apt.status === 'pending');
  };

  const getValidAppointments = () => {
    return appointments.filter(apt => 
      apt.patientName && 
      apt.doctorName && 
      apt.patientName !== 'Unknown' && 
      apt.doctorName !== 'Unknown'
    );
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Admin Dashboard</h1>
        <div className="header-actions">
          <span>Welcome, {user.name}</span>
          <button onClick={onLogout} className="btn-logout">Logout</button>
        </div>
      </div>

      <div className="dashboard-tabs">
        <button 
          className={activeTab === 'overview' ? 'active' : ''} 
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button 
          className={activeTab === 'doctors' ? 'active' : ''} 
          onClick={() => setActiveTab('doctors')}
        >
          Doctors
        </button>
        <button 
          className={activeTab === 'patients' ? 'active' : ''} 
          onClick={() => setActiveTab('patients')}
        >
          Patients
        </button>
        <button 
          className={activeTab === 'appointments' ? 'active' : ''} 
          onClick={() => setActiveTab('appointments')}
        >
          Appointments
        </button>
        <button 
          className={activeTab === 'wallets' ? 'active' : ''} 
          onClick={() => setActiveTab('wallets')}
        >
          Wallets
        </button>
      </div>

      <div className="dashboard-content">
        {loading ? (
          <div className="loading">Loading...</div>
        ) : (
          <>
            {activeTab === 'overview' && (
              <div className="overview-view">
                <div className="stats-grid">
                  <div className="stat-card">
                    <h3>Total Doctors</h3>
                    <div className="stat-value">{doctors.length}</div>
                    <small style={{ color: 'rgba(255,255,255,0.6)' }}></small>
                  </div>
                  <div className="stat-card">
                    <h3>Total Patients</h3>
                    <div className="stat-value">{patients.length}</div>
                    <small style={{ color: 'rgba(255,255,255,0.6)' }}></small>
                  </div>
                  <div className="stat-card">
                    <h3>Today's Appointments</h3>
                    <div className="stat-value">{getTodayAppointments().length}</div>
                    <small style={{ color: 'rgba(255,255,255,0.6)' }}></small>
                  </div>
                  <div className="stat-card">
                    <h3>Pending Approvals</h3>
                    <div className="stat-value">{getPendingAppointments().length}</div>
                    <small style={{ color: 'rgba(255,255,255,0.6)' }}></small>
                  </div>
                </div>

                <div className="section">
                  <h3>Recent Appointments</h3>
                  <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px', marginBottom: '15px' }}>
                     Sorted using MergeSort algorithm by date and time
                  </p>
                  {getValidAppointments().length === 0 ? (
                    <div className="empty-state">No appointments yet</div>
                  ) : (
                    <div className="data-table">
                      <table>
                        <thead>
                          <tr>
                            <th>Patient</th>
                            <th>Doctor</th>
                            <th>Date</th>
                            <th>Time</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {getValidAppointments()
                            .slice(0, 10)
                            .map(appointment => (
                            <tr key={appointment.id}>
                              <td>{appointment.patientName}</td>
                              <td>Dr. {formatDoctorName(appointment.doctorName)}</td>
                              <td>{appointment.date}</td>
                              <td>{appointment.time}</td>
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

            {activeTab === 'doctors' && (
              <div>
                <div style={{
                  padding: '15px',
                  background: 'rgba(102, 126, 234, 0.1)',
                  borderRadius: '8px',
                  marginBottom: '20px',
                  border: '1px solid rgba(102, 126, 234, 0.2)'
                }}>
                  <p style={{ color: 'rgba(255,255,255,0.9)', margin: 0, fontSize: '14px' }}>
                     <strong>DSA Used:</strong> QuickSort for alphabetical sorting
                  </p>
                </div>
                <div className="toolbar">
                  <input
                    type="text"
                    placeholder="Search doctors..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                  />
                  <button onClick={() => setShowAddModal(true)} className="btn-primary">
                    Add Doctor
                  </button>
                </div>
                {filteredDoctors.length === 0 ? (
                  <div className="empty-state">No doctors found</div>
                ) : (
                  <div className="data-table">
                    <table>
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Department</th>
                          <th>Specialization</th>
                          <th>Experience</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredDoctors.map(doctor => (
                          <tr key={doctor.id}>
                            <td>Dr. {formatDoctorName(doctor.name)}</td>
                            <td>{doctor.email}</td>
                            <td>{doctor.department}</td>
                            <td>{doctor.specialization}</td>
                            <td>{doctor.experience} years</td>
                            <td>
                              <button 
                                onClick={() => handleDeleteDoctor(doctor.id)} 
                                className="btn-danger"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'patients' && (
              <div>
                <div style={{
                  padding: '15px',
                  background: 'rgba(102, 126, 234, 0.1)',
                  borderRadius: '8px',
                  marginBottom: '20px',
                  border: '1px solid rgba(102, 126, 234, 0.2)'
                }}>
                  <p style={{ color: 'rgba(255,255,255,0.9)', margin: 0, fontSize: '14px' }}>
                    
                    <strong>DSA Used:</strong> Linked List for patient management
                  </p>
                </div>
                <div className="toolbar">
                  <input
                    type="text"
                    placeholder="🔍 Search patients..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                  />
                  <button onClick={() => setShowAddModal(true)} className="btn-primary">
                    Add Patient
                  </button>
                </div>
                {filteredPatients.length === 0 ? (
                  <div className="empty-state">No patients found</div>
                ) : (
                  <div className="data-table">
                    <table>
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Age</th>
                          <th>Gender</th>
                          <th>Phone</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredPatients.map(patient => (
                          <tr key={patient.id}>
                            <td>{patient.name}</td>
                            <td>{patient.email}</td>
                            <td>{patient.age}</td>
                            <td>{patient.gender}</td>
                            <td>{patient.phone}</td>
                            <td>
                              <button 
                                onClick={() => handleDeletePatient(patient.id)} 
                                className="btn-danger"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'appointments' && (
              <div>
                <div style={{
                  padding: '15px',
                  background: 'rgba(234, 179, 8, 0.1)',
                  borderRadius: '8px',
                  marginBottom: '20px',
                  border: '1px solid rgba(234, 179, 8, 0.2)'
                }}>
                  <p style={{ color: 'rgba(255,255,255,0.9)', margin: 0, fontSize: '14px' }}>
                    <strong>DSA Used:</strong> MergeSort for chronological sorting + Queue (FIFO) + Linked List
                  </p>
                </div>
                <div className="toolbar">
                  <h3>All Appointments ({getValidAppointments().length})</h3>
                </div>
                {getValidAppointments().length === 0 ? (
                  <div className="empty-state">No appointments found</div>
                ) : (
                  <div className="data-table">
                    <table>
                      <thead>
                        <tr>
                          <th>Patient</th>
                          <th>Doctor</th>
                          <th>Date</th>
                          <th>Time</th>
                          <th>Reason</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {getValidAppointments().map(appointment => (
                          <tr key={appointment.id}>
                            <td>{appointment.patientName}</td>
                            <td>Dr. {formatDoctorName(appointment.doctorName)}</td>
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
            )}

            {activeTab === 'wallets' && (
              <div>
                <div style={{
                  padding: '15px',
                  background: 'rgba(34, 197, 94, 0.1)',
                  borderRadius: '8px',
                  marginBottom: '20px',
                  border: '1px solid rgba(34, 197, 94, 0.2)'
                }}>
                  <p style={{ color: 'rgba(255,255,255,0.9)', margin: 0, fontSize: '14px' }}>
                    <strong>DSA Used:</strong> HashMap (O(1) lookup) + Stack (LIFO) for undo operations
                  </p>
                </div>

                {/* Users List with IDs */}
                <div className="section">
                  <h3>All Users - Click to Copy ID</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px', marginBottom: '30px' }}>
                    {doctors.map(doctor => (
                      <div key={doctor.userId} 
                        onClick={() => {
                          navigator.clipboard.writeText(doctor.userId);
                          alert(`Copied Doctor ID: ${doctor.userId}`);
                          setWalletForm({...walletForm, userId: doctor.userId});
                        }}
                        style={{
                          background: 'rgba(102, 126, 234, 0.15)',
                          border: '1px solid rgba(102, 126, 234, 0.3)',
                          borderRadius: '8px',
                          padding: '10px 12px',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(102, 126, 234, 0.25)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(102, 126, 234, 0.15)'}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '6px' }}>
                          <span style={{ fontSize: '16px', marginRight: '6px' }}></span>
                          <strong style={{ color: 'white', fontSize: '14px' }}>Dr. {formatDoctorName(doctor.name)}</strong>
                        </div>
                        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', marginBottom: '4px' }}>
                          {doctor.department}
                        </div>
                        <div style={{ 
                          fontSize: '10px', 
                          color: '#667eea',
                          background: 'rgba(102, 126, 234, 0.2)',
                          padding: '3px 6px',
                          borderRadius: '4px',
                          fontFamily: 'monospace',
                          wordBreak: 'break-all'
                        }}>
                          {doctor.userId}
                        </div>
                      </div>
                    ))}
                    
                    {patients.map(patient => (
                      <div key={patient.userId}
                        onClick={() => {
                          navigator.clipboard.writeText(patient.userId);
                          alert(`Copied Patient ID: ${patient.userId}`);
                          setWalletForm({...walletForm, userId: patient.userId});
                        }}
                        style={{
                          background: 'rgba(34, 197, 94, 0.15)',
                          border: '1px solid rgba(34, 197, 94, 0.3)',
                          borderRadius: '8px',
                          padding: '10px 12px',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(34, 197, 94, 0.25)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(34, 197, 94, 0.15)'}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '6px' }}>
                          <span style={{ fontSize: '16px', marginRight: '6px' }}></span>
                          <strong style={{ color: 'white', fontSize: '14px' }}>{patient.name}</strong>
                        </div>
                        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', marginBottom: '4px' }}>
                          {patient.age} years • {patient.gender}
                        </div>
                        <div style={{ 
                          fontSize: '10px', 
                          color: '#22c55e',
                          background: 'rgba(34, 197, 94, 0.2)',
                          padding: '3px 6px',
                          borderRadius: '4px',
                          fontFamily: 'monospace',
                          wordBreak: 'break-all'
                        }}>
                          {patient.userId}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="wallet-manager">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h3>Manage User Wallets</h3>
                    {walletHistory.length > 0 && (
                      <button onClick={handleUndoWallet} className="btn-secondary">
                        ⏮️ Undo Last Operation (Stack Pop)
                      </button>
                    )}
                  </div>

                  {walletHistory.length > 0 && (
                    <div style={{
                      background: 'rgba(234, 179, 8, 0.1)',
                      padding: '15px',
                      borderRadius: '8px',
                      marginBottom: '20px',
                      border: '1px solid rgba(234, 179, 8, 0.2)'
                    }}>
                      <h4 style={{ color: 'white', marginBottom: '10px' }}>Recent Operations (Stack):</h4>
                      <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                        {walletHistory.slice(0, 5).map((op, idx) => (
                          <div key={idx} style={{
                            padding: '8px',
                            background: 'rgba(255,255,255,0.05)',
                            borderRadius: '4px',
                            marginBottom: '5px',
                            fontSize: '13px'
                          }}>
                            <strong>{op.operation}</strong> - ${op.oldBalance} → ${op.newBalance}
                            <br />
                            <small style={{ color: 'rgba(255,255,255,0.6)' }}>{op.timestamp}</small>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <form onSubmit={handleUpdateWallet} className="form">
                    <div className="form-row">
                      <div className="form-group">
                        <label>User ID * (Click user card above)</label>
                        <input
                          type="text"
                          value={walletForm.userId}
                          onChange={(e) => setWalletForm({...walletForm, userId: e.target.value})}
                          required
                          placeholder="Click user card above to auto-fill"
                        />
                      </div>
                      <div className="form-group">
                        <label>Amount *</label>
                        <input
                          type="number"
                          value={walletForm.amount}
                          onChange={(e) => setWalletForm({...walletForm, amount: parseFloat(e.target.value)})}
                          required
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Transaction Type *</label>
                        <select 
                          value={walletForm.type}
                          onChange={(e) => setWalletForm({...walletForm, type: e.target.value})}
                        >
                          <option value="credit">Credit (Add Money)</option>
                          <option value="debit">Debit (Deduct Money)</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Description *</label>
                        <input
                          type="text"
                          value={walletForm.description}
                          onChange={(e) => setWalletForm({...walletForm, description: e.target.value})}
                          required
                          placeholder="Transaction description"
                        />
                      </div>
                    </div>
                    <button type="submit" className="btn-primary">
                      Update Wallet (Push to Stack)
                    </button>
                  </form>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Add Doctor Modal */}
      {showAddModal && activeTab === 'doctors' && (
        <div className="modal">
          <div className="modal-content">
            <h2>Add New Doctor</h2>
            <form onSubmit={handleAddDoctor} className="form">
              <div className="form-row">
                <div className="form-group">
                  <label>Full Name * (without Dr. prefix)</label>
                  <input
                    type="text"
                    value={doctorForm.name}
                    onChange={(e) => setDoctorForm({...doctorForm, name: e.target.value})}
                    required
                    placeholder="John Doe"
                  />
                </div>
                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    value={doctorForm.email}
                    onChange={(e) => setDoctorForm({...doctorForm, email: e.target.value})}
                    required
                    placeholder="doctor@hospital.com"
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Password *</label>
                <input
                  type="password"
                  value={doctorForm.password}
                  onChange={(e) => setDoctorForm({...doctorForm, password: e.target.value})}
                  required
                  placeholder="Secure password"
                  minLength="6"
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Department *</label>
                  <input
                    type="text"
                    value={doctorForm.department}
                    onChange={(e) => setDoctorForm({...doctorForm, department: e.target.value})}
                    required
                    placeholder="Cardiology"
                  />
                </div>
                <div className="form-group">
                  <label>Specialization *</label>
                  <input
                    type="text"
                    value={doctorForm.specialization}
                    onChange={(e) => setDoctorForm({...doctorForm, specialization: e.target.value})}
                    required
                    placeholder="Heart Specialist"
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Experience (years) *</label>
                <input
                  type="number"
                  value={doctorForm.experience}
                  onChange={(e) => setDoctorForm({...doctorForm, experience: parseInt(e.target.value)})}
                  required
                  min="0"
                  placeholder="5"
                />
              </div>
              <div className="modal-actions">
                <button type="submit" className="btn-primary">Add Doctor</button>
                <button type="button" onClick={() => setShowAddModal(false)} className="btn-secondary">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Patient Modal */}
      {showAddModal && activeTab === 'patients' && (
        <div className="modal">
          <div className="modal-content">
            <h2>Add New Patient</h2>
            <form onSubmit={handleAddPatient} className="form">
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
                <label>Phone *</label>
                <input
                  type="tel"
                  value={patientForm.phone}
                  onChange={(e) => setPatientForm({...patientForm, phone: e.target.value})}
                  required
                  placeholder="+1 234 567 8900"
                />
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
              <div className="modal-actions">
                <button type="submit" className="btn-primary">Add Patient</button>
                <button type="button" onClick={() => setShowAddModal(false)} className="btn-secondary">
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

export default AdminDashboard;