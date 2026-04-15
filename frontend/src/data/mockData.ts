export const mockClients = [
  { id: 'client_001', name: 'SecureGuard India' },
  { id: 'client_002', name: 'Sapphire Security' },
  { id: 'client_003', name: 'RapidShield Corp' },
];

export const mockSites = [
  { id: 'site_1', name: 'Mumbai HQ', clientId: 'client_001' },
  { id: 'site_2', name: 'Delhi Office', clientId: 'client_001' },
  { id: 'site_3', name: 'Pune Campus', clientId: 'client_002' },
  { id: 'site_4', name: 'Bangalore Tech Park', clientId: 'client_003' },
  { id: 'site_5', name: 'Hyderabad Zone', clientId: 'client_002' },
];

export const mockDepartments = [
  'Security', 'Housekeeping', 'Facility Management', 'IT', 'Maintenance'
];

export const mockTrainingModules = [
  'PSARA Foundation Course',
  'Emergency Response Protocol',
  'Fire Safety & Evacuation',
  'Access Control Procedures',
  'Customer Service Excellence',
  'Digital Security Awareness',
  'First Aid & CPR Certification',
  'CCTV Operations Mastery',
  'Crowd Management Techniques',
  'Workplace Harassment Prevention'
];

export const mockTrainers = [
  { id: 'TRN-001', name: 'Rajesh Kumar' },
  { id: 'TRN-002', name: 'Priya Sharma' },
  { id: 'TRN-003', name: 'Amit Patel' },
  { id: 'TRN-004', name: 'Sunita Rao' },
];

function randomDate(start: Date, end: Date) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())).toISOString();
}

const generateMockRecords = () => {
  const records = [];
  const guards = [];
  
  for (let i = 1; i <= 60; i++) {
    const employeeId = `EMP-${10000 + i}`;
    const name = `Employee ${i}`;
    const clientId = mockClients[Math.floor(Math.random() * mockClients.length)].id;
    const site = mockSites.find(s => s.clientId === clientId) || mockSites[0];
    const dept = mockDepartments[Math.floor(Math.random() * mockDepartments.length)];
    
    // PSARA validity
    const daysUntilExpiry = Math.floor(Math.random() * 60) - 10; // -10 to 50 days
    const isPsaraValid = daysUntilExpiry > 0;
    const psaraExpiryDate = new Date();
    psaraExpiryDate.setDate(psaraExpiryDate.getDate() + daysUntilExpiry);
    
    let psaraStatus = 'compliant';
    if (daysUntilExpiry <= 0) psaraStatus = 'expired';
    else if (daysUntilExpiry <= 30) psaraStatus = 'expiring';

    guards.push({
      id: `G-${i}`,
      name,
      employeeId,
      psaraStatus,
      lastTrainingDate: randomDate(new Date(2025, 0, 1), new Date()),
      psaraExpiryDate: psaraExpiryDate.toISOString(),
      daysUntilExpiry,
      siteId: site.id,
      siteName: site.name
    });

    const numRecords = Math.floor(Math.random() * 3) + 1; // 1-3 records per employee
    for (let j = 0; j < numRecords; j++) {
      const score = Math.floor(Math.random() * 40) + 60; // 60-100
      let status = 'passed';
      if (score < 60) status = 'failed';
      // 10% chance in-progress
      if (Math.random() > 0.9) status = 'in-progress';
      // 5% expired
      if (Math.random() > 0.95) status = 'expired';

      records.push({
        id: `REC-${i}-${j}`,
        employeeId,
        employeeName: name, 
        department: dept,
        designation: 'Guard',
        clientId,
        siteId: site.id,
        siteName: site.name,
        moduleName: mockTrainingModules[Math.floor(Math.random() * mockTrainingModules.length)],
        trainingType: ['classroom', 'virtual', 'self-paced'][Math.floor(Math.random() * 3)],
        sessionDate: randomDate(new Date(2025, 0, 1), new Date()),
        durationMinutes: [60, 120, 240, 480][Math.floor(Math.random() * 4)],
        score: status === 'in-progress' ? null : score,
        status,
        psaraValid: isPsaraValid,
        psaraExpiryDate: psaraExpiryDate.toISOString(),
        trainerId: mockTrainers[Math.floor(Math.random() * mockTrainers.length)].id,
        trainerName: mockTrainers[Math.floor(Math.random() * mockTrainers.length)].name,
      });
    }
  }
  return { records, guards };
};

const generated = generateMockRecords();
export const mockTrainingRecords = generated.records;
export const mockGuards = generated.guards;

export const dashboardCards = {
  totalTrained: { value: 1284, trend: '+12%', trendUp: true },
  avgScore: { value: 88.5, trend: '+2.4%', trendUp: true },
  complianceRate: { value: 94.2, trend: '+0.8%', trendUp: true },
  pendingCerts: { value: 12, trend: '-5%', trendUp: false }
};

export const upcomingSessions = [
  { id: 1, type: 'virtual', topic: 'PSARA Foundation Course', date: 'Today, 2:00 PM', trainerName: 'Rajesh Kumar', attendeeCount: 45 },
  { id: 2, type: 'classroom', topic: 'Fire Safety & Evacuation', date: 'Tomorrow, 9:00 AM', trainerName: 'Priya Sharma', attendeeCount: 20 },
  { id: 3, type: 'classroom', topic: 'Customer Service Excellence', date: 'April 16, 11:00 AM', trainerName: 'Amit Patel', attendeeCount: 30 }
];

export const complianceAlerts = [
  { id: 1, dept: 'Housekeeping - Mumbai HQ', behind: 14 },
  { id: 2, dept: 'Security - Pune Campus', behind: 8 },
  { id: 3, dept: 'IT - Delhi Office', behind: 3 }
];
