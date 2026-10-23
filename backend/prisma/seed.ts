import { PrismaClient, Role, EmploymentType, EmployeeStatus, AttendanceStatus, LeaveType, LeaveStatus, PayrollStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
import process from 'node:process';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Enterprise EMS Database Seeding...');

  // Clear existing records in proper order
  await prisma.activityLog.deleteMany();
  await prisma.payrollRecord.deleteMany();
  await prisma.salaryStructure.deleteMany();
  await prisma.leave.deleteMany();
  await prisma.leaveBalance.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.department.deleteMany();
  await prisma.companySetting.deleteMany();
  await prisma.user.deleteMany();

  // 1. Company Settings
  console.log('Creating Company Settings...');
  const company = await prisma.companySetting.create({
    data: {
      companyName: 'Nexus Global Enterprises',
      companyEmail: 'contact@nexusglobal.io',
      companyPhone: '+1 (800) 555-0199',
      companyAddress: '500 Silicon Vista Way, Suite 700, San Francisco, CA 94107',
      currency: '$',
      timezone: 'America/Los_Angeles',
      workingHoursPerDay: 8.0,
      leavePolicy: 'Standard corporate policy: 15 Annual, 10 Sick, 10 Casual. Manager approval required.'
    }
  });

  // 2. Departments
  console.log('Creating Departments...');
  const engineering = await prisma.department.create({
    data: {
      name: 'Engineering',
      code: 'ENG',
      description: 'Software development, cloud infrastructure, and technical architecture.',
      budget: 450000
    }
  });

  const hrDept = await prisma.department.create({
    data: {
      name: 'Human Resources',
      code: 'HR',
      description: 'Talent acquisition, employee welfare, compliance, and workplace culture.',
      budget: 120000
    }
  });

  const finance = await prisma.department.create({
    data: {
      name: 'Finance & Accounting',
      code: 'FIN',
      description: 'Financial planning, audits, accounts payable/receivable, and payroll.',
      budget: 180000
    }
  });

  const marketing = await prisma.department.create({
    data: {
      name: 'Marketing & Sales',
      code: 'MKT',
      description: 'Product marketing, brand strategy, lead generation, and client partnerships.',
      budget: 220000
    }
  });

  const product = await prisma.department.create({
    data: {
      name: 'Product & Design',
      code: 'PRD',
      description: 'User experience research, UI design, and product roadmap execution.',
      budget: 160000
    }
  });

  // 3. User Accounts with hashed passwords
  const passwordAdmin = await bcrypt.hash('Admin@123', 10);
  const passwordHR = await bcrypt.hash('Hr@123', 10);
  const passwordEmp = await bcrypt.hash('Emp@123', 10);

  console.log('Creating Core Users & Employees...');

  // Admin User & Employee Profile
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@enterprise-ems.com',
      passwordHash: passwordAdmin,
      role: Role.ADMIN,
      isActive: true
    }
  });

  const adminEmployee = await prisma.employee.create({
    data: {
      employeeCode: 'EMP-001',
      firstName: 'Victoria',
      lastName: 'Sterling',
      email: 'admin@enterprise-ems.com',
      phone: '+1 (555) 100-0001',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
      gender: 'Female',
      designation: 'Chief Executive Officer',
      departmentId: engineering.id,
      joiningDate: new Date('2021-01-15'),
      employmentType: EmploymentType.FULL_TIME,
      status: EmployeeStatus.ACTIVE,
      userId: adminUser.id,
      address: '742 Evergreen Terrace, San Francisco, CA'
    }
  });

  // Set engineering head
  await prisma.department.update({
    where: { id: engineering.id },
    data: { headId: adminEmployee.id }
  });

  // HR Manager User & Employee Profile
  const hrUser = await prisma.user.create({
    data: {
      email: 'hr@enterprise-ems.com',
      passwordHash: passwordHR,
      role: Role.HR,
      isActive: true
    }
  });

  const hrEmployee = await prisma.employee.create({
    data: {
      employeeCode: 'EMP-002',
      firstName: 'Marcus',
      lastName: 'Vance',
      email: 'hr@enterprise-ems.com',
      phone: '+1 (555) 100-0002',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      gender: 'Male',
      designation: 'Director of People & Culture',
      departmentId: hrDept.id,
      joiningDate: new Date('2021-06-01'),
      employmentType: EmploymentType.FULL_TIME,
      status: EmployeeStatus.ACTIVE,
      userId: hrUser.id,
      address: '120 Market St, San Francisco, CA'
    }
  });

  await prisma.department.update({
    where: { id: hrDept.id },
    data: { headId: hrEmployee.id }
  });

  // Regular Employee (John Doe)
  const empUser = await prisma.user.create({
    data: {
      email: 'john.doe@enterprise-ems.com',
      passwordHash: passwordEmp,
      role: Role.EMPLOYEE,
      isActive: true
    }
  });

  const johnDoe = await prisma.employee.create({
    data: {
      employeeCode: 'EMP-003',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@enterprise-ems.com',
      phone: '+1 (555) 100-0003',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      gender: 'Male',
      designation: 'Senior Full Stack Engineer',
      departmentId: engineering.id,
      joiningDate: new Date('2022-03-10'),
      employmentType: EmploymentType.FULL_TIME,
      status: EmployeeStatus.ACTIVE,
      userId: empUser.id,
      address: '45 Mission District, San Francisco, CA'
    }
  });

  // Additional 8 Employees for rich realistic data
  const extraStaff = [
    {
      code: 'EMP-004',
      first: 'Sophia',
      last: 'Chen',
      email: 'sophia.chen@enterprise-ems.com',
      phone: '+1 (555) 100-0004',
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150',
      gender: 'Female',
      designation: 'Lead UI/UX Designer',
      departmentId: product.id,
      joiningDate: new Date('2022-07-15'),
      type: EmploymentType.FULL_TIME,
      status: EmployeeStatus.ACTIVE,
      salary: 95000,
      address: '22 Ocean Ave, San Francisco, CA'
    },
    {
      code: 'EMP-005',
      first: 'David',
      last: 'Kim',
      email: 'david.kim@enterprise-ems.com',
      phone: '+1 (555) 100-0005',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
      gender: 'Male',
      designation: 'DevOps & Cloud Architect',
      departmentId: engineering.id,
      joiningDate: new Date('2023-01-20'),
      type: EmploymentType.FULL_TIME,
      status: EmployeeStatus.ACTIVE,
      salary: 110000,
      address: '88 Geary Blvd, San Francisco, CA'
    },
    {
      code: 'EMP-006',
      first: 'Elena',
      last: 'Rostova',
      email: 'elena.rostova@enterprise-ems.com',
      phone: '+1 (555) 100-0006',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
      gender: 'Female',
      designation: 'Financial Controller',
      departmentId: finance.id,
      joiningDate: new Date('2022-11-05'),
      type: EmploymentType.FULL_TIME,
      status: EmployeeStatus.ACTIVE,
      salary: 105000,
      address: '310 Pine Street, San Francisco, CA'
    },
    {
      code: 'EMP-007',
      first: 'Alexander',
      last: 'Wright',
      email: 'alex.wright@enterprise-ems.com',
      phone: '+1 (555) 100-0007',
      avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150',
      gender: 'Male',
      designation: 'VP of Growth & Marketing',
      departmentId: marketing.id,
      joiningDate: new Date('2023-04-12'),
      type: EmploymentType.FULL_TIME,
      status: EmployeeStatus.ACTIVE,
      salary: 115000,
      address: '612 Howard St, San Francisco, CA'
    },
    {
      code: 'EMP-008',
      first: 'Amina',
      last: 'Diallo',
      email: 'amina.diallo@enterprise-ems.com',
      phone: '+1 (555) 100-0008',
      avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=150',
      gender: 'Female',
      designation: 'HR Talent Specialist',
      departmentId: hrDept.id,
      joiningDate: new Date('2023-09-01'),
      type: EmploymentType.FULL_TIME,
      status: EmployeeStatus.ACTIVE,
      salary: 72000,
      address: '150 Folsom St, San Francisco, CA'
    },
    {
      code: 'EMP-009',
      first: 'Lucas',
      last: 'Moretti',
      email: 'lucas.moretti@enterprise-ems.com',
      phone: '+1 (555) 100-0009',
      avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150',
      gender: 'Male',
      designation: 'Frontend Engineer',
      departmentId: engineering.id,
      joiningDate: new Date('2024-02-15'),
      type: EmploymentType.FULL_TIME,
      status: EmployeeStatus.ACTIVE,
      salary: 88000,
      address: '777 Valencia St, San Francisco, CA'
    },
    {
      code: 'EMP-010',
      first: 'Chloe',
      last: 'Dupont',
      email: 'chloe.dupont@enterprise-ems.com',
      phone: '+1 (555) 100-0010',
      avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150',
      gender: 'Female',
      designation: 'Product Manager',
      departmentId: product.id,
      joiningDate: new Date('2023-08-10'),
      type: EmploymentType.FULL_TIME,
      status: EmployeeStatus.ON_LEAVE,
      salary: 102000,
      address: '900 Columbus Ave, San Francisco, CA'
    },
    {
      code: 'EMP-011',
      first: 'Rohan',
      last: 'Mehta',
      email: 'rohan.mehta@enterprise-ems.com',
      phone: '+1 (555) 100-0011',
      avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150',
      gender: 'Male',
      designation: 'Marketing Associate',
      departmentId: marketing.id,
      joiningDate: new Date('2024-05-01'),
      type: EmploymentType.CONTRACT,
      status: EmployeeStatus.ACTIVE,
      salary: 62000,
      address: '333 Bush St, San Francisco, CA'
    }
  ];

  const allEmployees = [adminEmployee, hrEmployee, johnDoe];

  for (const s of extraStaff) {
    const user = await prisma.user.create({
      data: {
        email: s.email,
        passwordHash: passwordEmp,
        role: Role.EMPLOYEE,
        isActive: true
      }
    });

    const emp = await prisma.employee.create({
      data: {
        employeeCode: s.code,
        firstName: s.first,
        lastName: s.last,
        email: s.email,
        phone: s.phone,
        avatar: s.avatar,
        gender: s.gender,
        designation: s.designation,
        departmentId: s.departmentId,
        joiningDate: s.joiningDate,
        employmentType: s.type,
        status: s.status,
        userId: user.id,
        address: s.address
      }
    });

    allEmployees.push(emp);
  }

  // 4. Create Salary Structures & Leave Balances for all employees
  console.log('Creating Salary Structures & Leave Balances...');
  const baseSalaries = [150000, 95000, 105000, 95000, 110000, 105000, 115000, 72000, 88000, 102000, 62000];

  for (let i = 0; i < allEmployees.length; i++) {
    const emp = allEmployees[i];
    const annualBase = baseSalaries[i] || 85000;
    const monthlyBasic = Math.round(annualBase / 12 * 0.5);
    const hra = Math.round(monthlyBasic * 0.4);
    const conveyance = 400;
    const medical = 300;
    const special = Math.round(monthlyBasic * 0.2);
    const pf = Math.round(monthlyBasic * 0.12);
    const tax = Math.round((monthlyBasic + hra + special) * 0.15);
    const otherDeductions = 100;
    const totalAllowances = hra + conveyance + medical + special;
    const totalDeductions = pf + tax + otherDeductions;
    const net = (monthlyBasic + totalAllowances) - totalDeductions;

    await prisma.salaryStructure.create({
      data: {
        employeeId: emp.id,
        basicSalary: monthlyBasic,
        hra,
        conveyance,
        medicalAllowance: medical,
        specialAllowance: special,
        pfDeduction: pf,
        taxDeduction: tax,
        otherDeductions,
        netSalary: net
      }
    });

    // Leave Balances for 2026
    await prisma.leaveBalance.create({
      data: {
        employeeId: emp.id,
        year: 2026,
        annualTotal: 15,
        annualUsed: i % 3 === 0 ? 3 : (i % 2 === 0 ? 1 : 0),
        sickTotal: 10,
        sickUsed: i === 2 ? 2 : 0,
        casualTotal: 10,
        casualUsed: i === 1 ? 1 : 0
      }
    });

    // Recent Monthly Payrolls (September 2026, October 2026)
    await prisma.payrollRecord.create({
      data: {
        employeeId: emp.id,
        month: 9,
        year: 2026,
        basicSalary: monthlyBasic,
        totalAllowances,
        totalDeductions,
        netSalary: net,
        paymentStatus: PayrollStatus.PAID,
        paymentDate: new Date('2026-09-30'),
        notes: 'September 2026 Salary credited via direct deposit.'
      }
    });

    await prisma.payrollRecord.create({
      data: {
        employeeId: emp.id,
        month: 10,
        year: 2026,
        basicSalary: monthlyBasic,
        totalAllowances,
        totalDeductions,
        netSalary: net,
        paymentStatus: i < 6 ? PayrollStatus.PROCESSED : PayrollStatus.DRAFT,
        paymentDate: i < 6 ? new Date('2026-10-31') : null,
        notes: 'October 2026 Payroll'
      }
    });
  }

  // 5. Create Attendance for the past 14 days for all employees
  console.log('Generating Realistic Attendance Records...');
  const today = new Date();
  for (let d = 13; d >= 0; d--) {
    const dayDate = new Date(today);
    dayDate.setDate(today.getDate() - d);
    dayDate.setHours(0, 0, 0, 0);

    const isWeekend = dayDate.getDay() === 0 || dayDate.getDay() === 6;
    if (isWeekend) continue;

    for (let i = 0; i < allEmployees.length; i++) {
      const emp = allEmployees[i];

      // John Doe or Chloe Dupont special status
      if (emp.employeeCode === 'EMP-010' && d < 5) {
        // Chloe on maternity/medical leave
        continue;
      }

      // Mix status
      let status: AttendanceStatus = AttendanceStatus.PRESENT;
      let checkInHour = 9;
      let checkInMin = Math.floor(Math.random() * 20); // 9:00 - 9:20
      let workHours = 8.5;

      if ((d + i) % 11 === 0) {
        status = AttendanceStatus.LATE;
        checkInHour = 10;
        checkInMin = 15;
        workHours = 7.2;
      } else if ((d + i) % 17 === 0) {
        status = AttendanceStatus.HALF_DAY;
        checkInHour = 9;
        checkInMin = 10;
        workHours = 4.5;
      } else if ((d + i) % 23 === 0) {
        status = AttendanceStatus.ABSENT;
        await prisma.attendance.create({
          data: {
            employeeId: emp.id,
            date: dayDate,
            checkIn: null,
            checkOut: null,
            workHours: 0,
            status: AttendanceStatus.ABSENT,
            notes: 'Unexcused absence / sick report'
          }
        });
        continue;
      }

      const checkInTime = new Date(dayDate);
      checkInTime.setHours(checkInHour, checkInMin, 0);

      const checkOutTime = new Date(dayDate);
      checkOutTime.setHours(checkInHour + Math.floor(workHours), checkInMin + Math.round((workHours % 1) * 60), 0);

      await prisma.attendance.create({
        data: {
          employeeId: emp.id,
          date: dayDate,
          checkIn: checkInTime,
          checkOut: checkOutTime,
          workHours,
          status,
          notes: status === AttendanceStatus.LATE ? 'Transit delay reported' : null
        }
      });
    }
  }

  // 6. Create Realistic Leave Applications
  console.log('Creating Leave Applications...');
  // Pending leave requests (for dashboard and leave approval workflow testing)
  await prisma.leave.create({
    data: {
      employeeId: johnDoe.id,
      leaveType: LeaveType.ANNUAL,
      startDate: new Date('2026-11-10'),
      endDate: new Date('2026-11-14'),
      totalDays: 5,
      reason: 'Attending family reunion and annual vacation in Colorado.',
      status: LeaveStatus.PENDING,
      appliedAt: new Date('2026-10-20')
    }
  });

  await prisma.leave.create({
    data: {
      employeeId: allEmployees[3].id, // Sophia Chen
      leaveType: LeaveType.CASUAL,
      startDate: new Date('2026-10-28'),
      endDate: new Date('2026-10-29'),
      totalDays: 2,
      reason: 'Personal family commitments and appointment.',
      status: LeaveStatus.PENDING,
      appliedAt: new Date('2026-10-21')
    }
  });

  await prisma.leave.create({
    data: {
      employeeId: allEmployees[4].id, // David Kim
      leaveType: LeaveType.SICK,
      startDate: new Date('2026-10-15'),
      endDate: new Date('2026-10-16'),
      totalDays: 2,
      reason: 'Viral fever and physician recommended rest.',
      status: LeaveStatus.APPROVED,
      reviewedBy: 'Marcus Vance (HR)',
      appliedAt: new Date('2026-10-14'),
      reviewedAt: new Date('2026-10-14')
    }
  });

  await prisma.leave.create({
    data: {
      employeeId: allEmployees[6].id, // Alex Wright
      leaveType: LeaveType.CASUAL,
      startDate: new Date('2026-10-05'),
      endDate: new Date('2026-10-06'),
      totalDays: 2,
      reason: 'Conference personal trip extension.',
      status: LeaveStatus.REJECTED,
      reviewedBy: 'Marcus Vance (HR)',
      rejectionReason: 'High priority Q4 product launch sprint during these dates.',
      appliedAt: new Date('2026-10-02'),
      reviewedAt: new Date('2026-10-03')
    }
  });

  // 7. Activity Logs
  console.log('Creating Activity Logs...');
  await prisma.activityLog.createMany({
    data: [
      {
        actorName: 'Victoria Sterling',
        action: 'System Initialized',
        module: 'Settings',
        details: 'Enterprise EMS instance deployed with core departments.'
      },
      {
        actorName: 'Marcus Vance',
        action: 'New Hire Added',
        module: 'Employees',
        details: 'Onboarded Chloe Dupont as Product Manager.'
      },
      {
        actorName: 'Marcus Vance',
        action: 'Leave Approved',
        module: 'Leaves',
        details: 'Approved 2 days sick leave for David Kim.'
      },
      {
        actorName: 'Elena Rostova',
        action: 'Payroll Generated',
        module: 'Payroll',
        details: 'Processed September 2026 batch payroll disbursement.'
      }
    ]
  });

  console.log('✅ Seeding completed successfully!');
  console.log('Default credentials for testing:');
  console.log(' - Admin: admin@enterprise-ems.com / Admin@123');
  console.log(' - HR: hr@enterprise-ems.com / Hr@123');
  console.log(' - Employee: john.doe@enterprise-ems.com / Emp@123');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
