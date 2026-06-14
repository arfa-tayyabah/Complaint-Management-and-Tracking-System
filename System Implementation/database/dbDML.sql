USE complaint_db;

INSERT INTO Department (name, description, is_active) VALUES
('Boys Hostel', 'Accommodation and facilities for male students', TRUE),
('Business Studies', 'Management sciences and commerce department', TRUE),
('Campus Site', 'Overall campus infrastructure and grounds', TRUE),
('Computer Science', 'CS and IT academic department', TRUE),
('Electrical Engineering', 'Electrical engineering department', TRUE),
('Exams', 'Examination office and scheduling', TRUE),
('Faculty/Staff Houses', 'Residences for university employees', TRUE),
('Finance', 'Fee, budget, and financial matters', TRUE),
('Food Services', 'Cafeterias, mess, and food quality', TRUE),
('Girls Hostel', 'Accommodation for female students', TRUE),
('Human Resources', 'Staff recruitment, benefits, and records', TRUE),
('IT Services', 'Network, software, hardware support', TRUE),
('Library', 'Library resources and facilities', TRUE),
('Mathematics', 'Mathematics department', TRUE),
('Registrar Secretariat', 'Registration, degrees, transcripts', TRUE),
('Transport', 'University buses and shuttle service', TRUE);

INSERT INTO Tracker (department_id, name, is_active) VALUES
((SELECT department_id FROM Department WHERE name='Boys Hostel'), 'Accommodation', TRUE),
((SELECT department_id FROM Department WHERE name='Boys Hostel'), 'Cleaning', TRUE),
((SELECT department_id FROM Department WHERE name='Boys Hostel'), 'Electrical', TRUE),
((SELECT department_id FROM Department WHERE name='Boys Hostel'), 'Plumbing', TRUE),
((SELECT department_id FROM Department WHERE name='Boys Hostel'), 'Carpentry', TRUE),
((SELECT department_id FROM Department WHERE name='Boys Hostel'), 'UPS', TRUE),
((SELECT department_id FROM Department WHERE name='Boys Hostel'), 'Lost and Found', TRUE),
((SELECT department_id FROM Department WHERE name='Business Studies'), 'Help Desk', TRUE),
((SELECT department_id FROM Department WHERE name='Business Studies'), 'Student Letters', TRUE),
((SELECT department_id FROM Department WHERE name='Business Studies'), 'Transcript', TRUE),
((SELECT department_id FROM Department WHERE name='Business Studies'), 'Degree', TRUE),
((SELECT department_id FROM Department WHERE name='Business Studies'), 'Results', TRUE),
((SELECT department_id FROM Department WHERE name='Campus Site'), 'Cleaning', TRUE),
((SELECT department_id FROM Department WHERE name='Campus Site'), 'Electrical', TRUE),
((SELECT department_id FROM Department WHERE name='Campus Site'), 'Plumbing', TRUE),
((SELECT department_id FROM Department WHERE name='Campus Site'), 'Carpentry', TRUE),
((SELECT department_id FROM Department WHERE name='Computer Science'), 'Hardware Issues', TRUE),
((SELECT department_id FROM Department WHERE name='Computer Science'), 'Software Issues', TRUE),
((SELECT department_id FROM Department WHERE name='Computer Science'), 'Printer Issues', TRUE),
((SELECT department_id FROM Department WHERE name='Computer Science'), 'Network Issues', TRUE),
((SELECT department_id FROM Department WHERE name='Computer Science'), 'Seats Issues', TRUE),
((SELECT department_id FROM Department WHERE name='Electrical Engineering'), 'Electrical', TRUE),
((SELECT department_id FROM Department WHERE name='Electrical Engineering'), 'Hardware Issues', TRUE),
((SELECT department_id FROM Department WHERE name='Electrical Engineering'), 'UPS', TRUE),
((SELECT department_id FROM Department WHERE name='Exams'), 'Results', TRUE),
((SELECT department_id FROM Department WHERE name='Exams'), 'Seats Issues', TRUE),
((SELECT department_id FROM Department WHERE name='Exams'), 'Transcript', TRUE),
((SELECT department_id FROM Department WHERE name='Faculty/Staff Houses'), 'Accommodation', TRUE),
((SELECT department_id FROM Department WHERE name='Faculty/Staff Houses'), 'Electrical', TRUE),
((SELECT department_id FROM Department WHERE name='Faculty/Staff Houses'), 'Plumbing', TRUE),
((SELECT department_id FROM Department WHERE name='Finance'), 'Salary', TRUE),
((SELECT department_id FROM Department WHERE name='Finance'), 'Medical Insurance', TRUE),
((SELECT department_id FROM Department WHERE name='Finance'), 'Life Insurance', TRUE),
((SELECT department_id FROM Department WHERE name='Food Services'), 'Food Quality', TRUE),
((SELECT department_id FROM Department WHERE name='Food Services'), 'Food Price', TRUE),
((SELECT department_id FROM Department WHERE name='Food Services'), 'Menu', TRUE),
((SELECT department_id FROM Department WHERE name='Food Services'), 'Timing', TRUE),
((SELECT department_id FROM Department WHERE name='Girls Hostel'), 'Accommodation', TRUE),
((SELECT department_id FROM Department WHERE name='Girls Hostel'), 'Cleaning', TRUE),
((SELECT department_id FROM Department WHERE name='Girls Hostel'), 'Electrical', TRUE),
((SELECT department_id FROM Department WHERE name='Girls Hostel'), 'Plumbing', TRUE),
((SELECT department_id FROM Department WHERE name='Girls Hostel'), 'Hostel Request', TRUE),
((SELECT department_id FROM Department WHERE name='Human Resources'), 'Salary', TRUE),
((SELECT department_id FROM Department WHERE name='Human Resources'), 'Employee Letter', TRUE),
((SELECT department_id FROM Department WHERE name='Human Resources'), 'Employee Cards', TRUE),
((SELECT department_id FROM Department WHERE name='Human Resources'), 'HR Operations', TRUE),
((SELECT department_id FROM Department WHERE name='Human Resources'), 'Medical Insurance', TRUE),
((SELECT department_id FROM Department WHERE name='Human Resources'), 'Life Insurance', TRUE),
((SELECT department_id FROM Department WHERE name='IT Services'), 'Hardware Issues', TRUE),
((SELECT department_id FROM Department WHERE name='IT Services'), 'Software Issues', TRUE),
((SELECT department_id FROM Department WHERE name='IT Services'), 'Network Issues', TRUE),
((SELECT department_id FROM Department WHERE name='IT Services'), 'Printer Issues', TRUE),
((SELECT department_id FROM Department WHERE name='IT Services'), 'UPS', TRUE),
((SELECT department_id FROM Department WHERE name='Library'), 'Seats Issues', TRUE),
((SELECT department_id FROM Department WHERE name='Library'), 'Hardware Issues', TRUE),
((SELECT department_id FROM Department WHERE name='Library'), 'Software Issues', TRUE),
((SELECT department_id FROM Department WHERE name='Library'), 'Network Issues', TRUE),
((SELECT department_id FROM Department WHERE name='Mathematics'), 'Seats Issues', TRUE),
((SELECT department_id FROM Department WHERE name='Mathematics'), 'Hardware Issues', TRUE),
((SELECT department_id FROM Department WHERE name='Mathematics'), 'Software Issues', TRUE),
((SELECT department_id FROM Department WHERE name='Registrar Secretariat'), 'Transcript', TRUE),
((SELECT department_id FROM Department WHERE name='Registrar Secretariat'), 'Degree', TRUE),
((SELECT department_id FROM Department WHERE name='Registrar Secretariat'), 'Results', TRUE),
((SELECT department_id FROM Department WHERE name='Registrar Secretariat'), 'Student Letters', TRUE),
((SELECT department_id FROM Department WHERE name='Transport'), 'Timing', TRUE),
((SELECT department_id FROM Department WHERE name='Transport'), 'Lost and Found', TRUE),
((SELECT department_id FROM Department WHERE name='Transport'), 'Other', TRUE);

INSERT INTO User (full_name, email, password_hash, department_id, is_student, is_faculty, is_staff, is_complaint_handler, role, account_status) VALUES
('Ahmed Raza', 'ahmed.raza@students.namal.edu', 'hash_ahmed', (SELECT department_id FROM Department WHERE name='Computer Science'), TRUE, FALSE, FALSE, FALSE, 'complainant', 'Active'),
('Bilal Tariq', 'bilal.tariq@students.namal.edu', 'hash_bilal', (SELECT department_id FROM Department WHERE name='Electrical Engineering'), TRUE, FALSE, FALSE, FALSE, 'complainant', 'Active'),
('Fatima Zafar', 'fatima.zafar@students.namal.edu', 'hash_fatima', (SELECT department_id FROM Department WHERE name='Business Studies'), TRUE, FALSE, FALSE, FALSE, 'complainant', 'Active'),
('Hassan Ali', 'hassan.ali@students.namal.edu', 'hash_hassan', (SELECT department_id FROM Department WHERE name='Mathematics'), TRUE, FALSE, FALSE, FALSE, 'complainant', 'Active'),
('Iqra Naeem', 'iqra.naeem@students.namal.edu', 'hash_iqra', (SELECT department_id FROM Department WHERE name='Girls Hostel'), TRUE, FALSE, FALSE, FALSE, 'complainant', 'Active'),
('Junaid Akhtar', 'junaid.akhtar@students.namal.edu', 'hash_junaid', (SELECT department_id FROM Department WHERE name='Boys Hostel'), TRUE, FALSE, FALSE, FALSE, 'complainant', 'Active'),
('Kiran Aslam', 'kiran.aslam@students.namal.edu', 'hash_kiran', (SELECT department_id FROM Department WHERE name='Library'), TRUE, FALSE, FALSE, FALSE, 'complainant', 'Active'),
('Muneeb Ahmed', 'muneeb.ahmed@students.namal.edu', 'hash_muneeb', (SELECT department_id FROM Department WHERE name='Transport'), TRUE, FALSE, FALSE, FALSE, 'complainant', 'Active'),
('Nida Shahzad', 'nida.shahzad@students.namal.edu', 'hash_nida', (SELECT department_id FROM Department WHERE name='Food Services'), TRUE, FALSE, FALSE, FALSE, 'complainant', 'Active'),
('Osman Khalid', 'osman.khalid@students.namal.edu', 'hash_osman', (SELECT department_id FROM Department WHERE name='Exams'), TRUE, FALSE, FALSE, FALSE, 'complainant', 'Active'),
('Rabia Sajjad', 'rabia.sajjad@students.namal.edu', 'hash_rabia', (SELECT department_id FROM Department WHERE name='Registrar Secretariat'), TRUE, FALSE, FALSE, FALSE, 'complainant', 'Active'),
('Sana Asghar', 'sana.asghar@students.namal.edu', 'hash_sana', (SELECT department_id FROM Department WHERE name='IT Services'), TRUE, FALSE, FALSE, FALSE, 'complainant', 'Active'),
('Taimoor Shah', 'taimoor.shah@students.namal.edu', 'hash_taimoor', (SELECT department_id FROM Department WHERE name='Campus Site'), TRUE, FALSE, FALSE, FALSE, 'complainant', 'Active'),
('Uzma Pervez', 'uzma.pervez@students.namal.edu', 'hash_uzma', (SELECT department_id FROM Department WHERE name='Finance'), TRUE, FALSE, FALSE, FALSE, 'complainant', 'Active'),
('Waqas Haider', 'waqas.haider@students.namal.edu', 'hash_waqas', (SELECT department_id FROM Department WHERE name='Faculty/Staff Houses'), TRUE, FALSE, FALSE, FALSE, 'complainant', 'Active'),
('Zara Ahmed', 'zara.ahmed@students.namal.edu', 'hash_zara', (SELECT department_id FROM Department WHERE name='Human Resources'), TRUE, FALSE, FALSE, FALSE, 'complainant', 'Active'),
('Adeel Riaz', 'adeel.riaz@namal.edu', 'hash_adeel', (SELECT department_id FROM Department WHERE name='Computer Science'), FALSE, TRUE, FALSE, TRUE, 'junior_handler', 'Active'),
('Beenish Malik', 'beenish.malik@namal.edu', 'hash_beenish', (SELECT department_id FROM Department WHERE name='IT Services'), FALSE, TRUE, FALSE, TRUE, 'junior_handler', 'Active'),
('Chaudhry Naveed', 'ch.naveed@namal.edu', 'hash_naveed', (SELECT department_id FROM Department WHERE name='Electrical Engineering'), FALSE, TRUE, FALSE, TRUE, 'junior_handler', 'Active'),
('Dr. Farhat Abbas', 'farhat.abbas@namal.edu', 'hash_farhat', (SELECT department_id FROM Department WHERE name='Mathematics'), FALSE, TRUE, FALSE, TRUE, 'junior_handler', 'Active'),
('Ghulam Mustafa', 'ghulam.mustafa@namal.edu', 'hash_ghulam', (SELECT department_id FROM Department WHERE name='Exams'), FALSE, TRUE, FALSE, FALSE, 'complainant', 'Active'),
('Hina Akram', 'hina.akram@namal.edu', 'hash_hina', (SELECT department_id FROM Department WHERE name='Business Studies'), FALSE, TRUE, FALSE, FALSE, 'complainant', 'Active'),
('Irfan Siddiqui', 'irfan.siddiqui@namal.edu', 'hash_irfan', (SELECT department_id FROM Department WHERE name='Registrar Secretariat'), FALSE, TRUE, FALSE, FALSE, 'complainant', 'Active'),
('Javeria Altaf', 'javeria.altaf@namal.edu', 'hash_javeria', (SELECT department_id FROM Department WHERE name='Human Resources'), FALSE, TRUE, FALSE, FALSE, 'complainant', 'Active'),
('Khalid Mahmood', 'khalid.mahmood@namal.edu', 'hash_khalid', (SELECT department_id FROM Department WHERE name='Campus Site'), FALSE, FALSE, TRUE, TRUE, 'junior_handler', 'Active'),
('Latif ur Rehman', 'latif.rehman@namal.edu', 'hash_latif', (SELECT department_id FROM Department WHERE name='Boys Hostel'), FALSE, FALSE, TRUE, TRUE, 'junior_handler', 'Active'),
('Mariam Tariq', 'mariam.tariq@namal.edu', 'hash_mariam', (SELECT department_id FROM Department WHERE name='Girls Hostel'), FALSE, FALSE, TRUE, TRUE, 'junior_handler', 'Active'),
('Naeem Akhtar', 'naeem.akhtar@namal.edu', 'hash_naeem', (SELECT department_id FROM Department WHERE name='Food Services'), FALSE, FALSE, TRUE, FALSE, 'complainant', 'Active'),
('Obaidullah Khan', 'obaid.khan@namal.edu', 'hash_obaid', (SELECT department_id FROM Department WHERE name='Finance'), FALSE, FALSE, TRUE, FALSE, 'complainant', 'Active'),
('Parvez Iqbal', 'parvez.iqbal@namal.edu', 'hash_parvez', (SELECT department_id FROM Department WHERE name='Transport'), FALSE, FALSE, TRUE, TRUE, 'junior_handler', 'Active'),
('Quratulain Arshad', 'quratulain.arshad@namal.edu', 'hash_qurat', (SELECT department_id FROM Department WHERE name='Library'), FALSE, FALSE, TRUE, FALSE, 'complainant', 'Active'),
('Rizwan Ali', 'rizwan.ali@namal.edu', 'hash_rizwan', (SELECT department_id FROM Department WHERE name='Faculty/Staff Houses'), FALSE, FALSE, TRUE, TRUE, 'junior_handler', 'Active'),
('Salman Akhtar', 'salman.akhtar@namal.edu', 'hash_salman', (SELECT department_id FROM Department WHERE name='IT Services'), FALSE, FALSE, TRUE, TRUE, 'junior_handler', 'Active'),
('Tahira Batool', 'tahira.batool@namal.edu', 'hash_tahira', (SELECT department_id FROM Department WHERE name='Campus Site'), FALSE, FALSE, TRUE, FALSE, 'complainant', 'Active'),
('Umar Farooq', 'umar.farooq@namal.edu', 'hash_umar', (SELECT department_id FROM Department WHERE name='Human Resources'), FALSE, FALSE, TRUE, FALSE, 'complainant', 'Active'),
('Waseem Abbas', 'waseem.abbas@namal.edu', 'hash_waseem', (SELECT department_id FROM Department WHERE name='Electrical Engineering'), FALSE, FALSE, TRUE, TRUE, 'junior_handler', 'Active'),
('Yasmeen Bibi', 'yasmeen.bibi@namal.edu', 'hash_yasmeen', (SELECT department_id FROM Department WHERE name='Food Services'), FALSE, FALSE, TRUE, FALSE, 'complainant', 'Active'),
('Zubair Ahmed', 'zubair.ahmed@namal.edu', 'hash_zubair', (SELECT department_id FROM Department WHERE name='Campus Site'), FALSE, FALSE, TRUE, FALSE, 'complainant', 'Active'),
('SoftwareAdmin', 'admin@namal.edu', 'hash_admin', NULL, FALSE, FALSE, TRUE, FALSE, 'software_operator', 'Active'),
('SeniorHandler', 'senior.handler@namal.edu', 'hash_senior', (SELECT department_id FROM Department WHERE name='Computer Science'), FALSE, TRUE, FALSE, TRUE, 'senior_handler', 'Active'),
('Ayesha Malik', 'ayesha.malik@students.namal.edu', 'hash_ayesha_m', (SELECT department_id FROM Department WHERE name='Computer Science'), TRUE, FALSE, FALSE, FALSE, 'complainant', 'Active'),
('Hamza Ali', 'hamza.ali@students.namal.edu', 'hash_hamza', (SELECT department_id FROM Department WHERE name='Electrical Engineering'), TRUE, FALSE, FALSE, FALSE, 'complainant', 'Active'),
('Laiba Khan', 'laiba.khan@students.namal.edu', 'hash_laiba', (SELECT department_id FROM Department WHERE name='Business Studies'), TRUE, FALSE, FALSE, FALSE, 'complainant', 'Active'),
('Omar Farooq', 'omar.farooq@students.namal.edu', 'hash_omar', (SELECT department_id FROM Department WHERE name='Mathematics'), TRUE, FALSE, FALSE, FALSE, 'complainant', 'Active'),
('Dr. Sohail Ahmed', 'sohail.ahmed@namal.edu', 'hash_sohail', (SELECT department_id FROM Department WHERE name='Computer Science'), FALSE, TRUE, FALSE, TRUE, 'junior_handler', 'Active'),
('Dr. Nadia Aslam', 'nadia.aslam@namal.edu', 'hash_nadia_f', (SELECT department_id FROM Department WHERE name='Electrical Engineering'), FALSE, TRUE, FALSE, TRUE, 'junior_handler', 'Active'),
('Prof. Shahid Mehmood', 'shahid.mehmood@namal.edu', 'hash_shahid_f', (SELECT department_id FROM Department WHERE name='Business Studies'), FALSE, TRUE, FALSE, TRUE, 'junior_handler', 'Active'),
('Dr. Rabia Zafar', 'rabia.zafar@namal.edu', 'hash_rabia_f2', (SELECT department_id FROM Department WHERE name='Mathematics'), FALSE, TRUE, FALSE, TRUE, 'junior_handler', 'Active'),
('Dr. Imran Ali', 'imran.ali@namal.edu', 'hash_imran_f', (SELECT department_id FROM Department WHERE name='IT Services'), FALSE, TRUE, FALSE, TRUE, 'junior_handler', 'Active'),
('Dr. Sana Tariq', 'sana.tariq@namal.edu', 'hash_sana_f', (SELECT department_id FROM Department WHERE name='Exams'), FALSE, TRUE, FALSE, TRUE, 'junior_handler', 'Active'),
('Prof. Asad Raza', 'asad.raza@namal.edu', 'hash_asad', (SELECT department_id FROM Department WHERE name='Library'), FALSE, TRUE, FALSE, TRUE, 'junior_handler', 'Active'),
('Dr. Farah Khan', 'farah.khan@namal.edu', 'hash_farah', (SELECT department_id FROM Department WHERE name='Registrar Secretariat'), FALSE, TRUE, FALSE, TRUE, 'junior_handler', 'Active'),
('Dr. Tariq Mehmood', 'tariq.mehmood@namal.edu', 'hash_tariq_f', (SELECT department_id FROM Department WHERE name='Human Resources'), FALSE, TRUE, FALSE, FALSE, 'complainant', 'Active'),
('Dr. Saima Ashraf', 'saima.ashraf@namal.edu', 'hash_saima', (SELECT department_id FROM Department WHERE name='Finance'), FALSE, TRUE, FALSE, FALSE, 'complainant', 'Active'),
('Prof. Naveed Akhtar', 'naveed.akhtar@namal.edu', 'hash_naveed_f', (SELECT department_id FROM Department WHERE name='Campus Site'), FALSE, TRUE, FALSE, FALSE, 'complainant', 'Active'),
('Arshad Mahmood', 'arshad.mahmood@namal.edu', 'hash_arshad', (SELECT department_id FROM Department WHERE name='IT Services'), FALSE, FALSE, TRUE, FALSE, 'complainant', 'Active'),
('Sadia Khan', 'sadia.khan@namal.edu', 'hash_sadia_s', (SELECT department_id FROM Department WHERE name='Finance'), FALSE, FALSE, TRUE, FALSE, 'complainant', 'Active'),
('Rashid Ali', 'rashid.ali@namal.edu', 'hash_rashid_s', (SELECT department_id FROM Department WHERE name='Transport'), FALSE, FALSE, TRUE, FALSE, 'complainant', 'Active'),
('Shamim Akhtar', 'shamim.akhtar@namal.edu', 'hash_shamim', (SELECT department_id FROM Department WHERE name='Boys Hostel'), FALSE, FALSE, TRUE, FALSE, 'complainant', 'Active'),
('Nargis Bibi', 'nargis.bibi@namal.edu', 'hash_nargis', (SELECT department_id FROM Department WHERE name='Girls Hostel'), FALSE, FALSE, TRUE, FALSE, 'complainant', 'Active');

INSERT INTO Student (user_id, reg_number, program, semester, enrollment_date)
SELECT user_id, CONCAT('2024-', CASE WHEN is_student THEN LPAD(user_id,3,'0') ELSE NULL END), 
CASE WHEN department_id = (SELECT department_id FROM Department WHERE name='Computer Science') THEN 'BS Computer Science'
WHEN department_id = (SELECT department_id FROM Department WHERE name='Electrical Engineering') THEN 'BS Electrical Engineering'
WHEN department_id = (SELECT department_id FROM Department WHERE name='Business Studies') THEN 'BBA'
WHEN department_id = (SELECT department_id FROM Department WHERE name='Mathematics') THEN 'BS Mathematics'
ELSE 'BS Other' END, FLOOR(2 + RAND()*4), '2024-09-01'
FROM User WHERE is_student = TRUE;

INSERT INTO Faculty (user_id, designation, office_number)
SELECT user_id, 
       CASE WHEN role = 'senior_handler' THEN 'Professor & Senior Complaint Handler'
            WHEN is_faculty = 1 THEN 'Assistant Professor'
            ELSE 'Unknown'
       END AS designation,
       CONCAT('Block ', CHAR(65 + FLOOR(RAND()*5)), '-', FLOOR(100 + RAND()*400)) AS office_number
FROM User 
WHERE is_faculty = TRUE;

INSERT INTO Staff (user_id, position, staff_type)
SELECT user_id,
       CASE WHEN role = 'software_operator' THEN 'System Administrator'
            WHEN is_staff = 1 THEN 'Technical Staff'
            ELSE 'Other'
       END AS position,
       CASE WHEN department_id = (SELECT department_id FROM Department WHERE name='IT Services') THEN 'Technical'
            WHEN department_id IN (SELECT department_id FROM Department WHERE name='Finance','Human Resources') THEN 'Administrative'
            ELSE 'Technical'
       END AS staff_type
FROM User 
WHERE is_staff = TRUE;

INSERT INTO Complaint_Handler (user_id, handler_level, manager_id)
SELECT user_id, 
CASE WHEN role = 'senior_handler' THEN 'senior' ELSE 'junior' END,
CASE WHEN role = 'senior_handler' THEN NULL ELSE (SELECT user_id FROM User WHERE role = 'senior_handler') END
FROM User WHERE is_complaint_handler = TRUE;

INSERT INTO Complaint (complainant_id, tracker_id, handler_id, status, priority, subject, description, location) VALUES
(1, (SELECT tracker_id FROM Tracker WHERE name='Software Issues' AND department_id=(SELECT department_id FROM Department WHERE name='Computer Science')), NULL, 'New', 'High', 'VS Code crashing frequently', 'Visual Studio Code crashes every time I open a Python file', 'CS Lab 1'),
(2, (SELECT tracker_id FROM Tracker WHERE name='Electrical' AND department_id=(SELECT department_id FROM Department WHERE name='Electrical Engineering')), NULL, 'New', 'Critical', 'Power fluctuation in lab', 'Voltage drops causing equipment to restart', 'EE Lab 3'),
(3, (SELECT tracker_id FROM Tracker WHERE name='Results' AND department_id=(SELECT department_id FROM Department WHERE name='Business Studies')), NULL, 'New', 'High', 'Missing result for Marketing course', 'My result for MKT301 not showing on portal', 'Department Office'),
(4, (SELECT tracker_id FROM Tracker WHERE name='Seats Issues' AND department_id=(SELECT department_id FROM Department WHERE name='Mathematics')), NULL, 'New', 'Medium', 'Not enough chairs in classroom', 'Room M-101 has 30 chairs but 45 students', 'M Block Room 101'),
(5, (SELECT tracker_id FROM Tracker WHERE name='Accommodation' AND department_id=(SELECT department_id FROM Department WHERE name='Girls Hostel')), NULL, 'New', 'High', 'No vacant room allocated', 'Applied for hostel 2 months ago but no response', 'Girls Hostel Office'),
(6, (SELECT tracker_id FROM Tracker WHERE name='Plumbing' AND department_id=(SELECT department_id FROM Department WHERE name='Boys Hostel')), NULL, 'New', 'Critical', 'Sewage water overflow', 'Toilet blockage on floor 2 causing overflow', 'Boys Hostel Block B'),
(7, (SELECT tracker_id FROM Tracker WHERE name='Network Issues' AND department_id=(SELECT department_id FROM Department WHERE name='Library')), NULL, 'New', 'Medium', 'WiFi not working in library', 'No internet connectivity on first floor', 'Library Reading Hall'),
(8, (SELECT tracker_id FROM Tracker WHERE name='Timing' AND department_id=(SELECT department_id FROM Department WHERE name='Transport')), NULL, 'New', 'Low', 'Late bus from campus', 'Evening bus to city leaves 30 minutes late', 'Main Bus Stop'),
(9, (SELECT tracker_id FROM Tracker WHERE name='Food Price' AND department_id=(SELECT department_id FROM Department WHERE name='Food Services')), NULL, 'New', 'Medium', 'Samosa price increased without notice', 'Price raised from Rs30 to Rs50 without any notification', 'Student Cafeteria'),
(10, (SELECT tracker_id FROM Tracker WHERE name='Transcript' AND department_id=(SELECT department_id FROM Department WHERE name='Exams')), NULL, 'New', 'High', 'Transcript has wrong CGPA', 'My transcript shows 2.9 but actual is 3.2', 'Exams Department'),
(11, (SELECT tracker_id FROM Tracker WHERE name='Degree' AND department_id=(SELECT department_id FROM Department WHERE name='Registrar Secretariat')), NULL, 'New', 'High', 'Degree not issued after 6 months', 'Graduated in Dec 2025, still no degree', 'Registrar Office'),
(12, (SELECT tracker_id FROM Tracker WHERE name='Printer Issues' AND department_id=(SELECT department_id FROM Department WHERE name='IT Services')), NULL, 'New', 'Medium', 'Printer not printing in color', 'Network printer only prints black and white', 'IT Center'),
(13, (SELECT tracker_id FROM Tracker WHERE name='Cleaning' AND department_id=(SELECT department_id FROM Department WHERE name='Campus Site')), NULL, 'New', 'Low', 'Trash bins overflowing near admin block', 'Bins not emptied for three days', 'Outside Admin Building'),
(14, (SELECT tracker_id FROM Tracker WHERE name='Salary' AND department_id=(SELECT department_id FROM Department WHERE name='Finance')), NULL, 'New', 'Critical', 'Salary not credited for May', 'No salary received for May 2026', 'Finance Office'),
(15, (SELECT tracker_id FROM Tracker WHERE name='Electrical' AND department_id=(SELECT department_id FROM Department WHERE name='Faculty/Staff Houses')), NULL, 'New', 'High', 'Frequent tripping in staff colony', 'Main circuit breaker trips several times a day', 'Staff Colony House 12'),
(16, (SELECT tracker_id FROM Tracker WHERE name='Employee Letter' AND department_id=(SELECT department_id FROM Department WHERE name='Human Resources')), NULL, 'New', 'Medium', 'Need experience letter urgently', 'Applying for new job need letter by tomorrow', 'HR Office'),
(17, (SELECT tracker_id FROM Tracker WHERE name='Hardware Issues' AND department_id=(SELECT department_id FROM Department WHERE name='Computer Science')), (SELECT user_id FROM User WHERE full_name='Adeel Riaz'), 'Assigned', 'High', 'Lab PC motherboard dead', 'PC in CS Lab 2 does not power on', 'CS Lab 2'),
(18, (SELECT tracker_id FROM Tracker WHERE name='UPS' AND department_id=(SELECT department_id FROM Department WHERE name='Boys Hostel')), (SELECT user_id FROM User WHERE full_name='Latif ur Rehman'), 'In Progress', 'High', 'UPS not providing backup', 'Hostel UPS only works for 5 minutes on battery', 'Boys Hostel Block A'),
(19, (SELECT tracker_id FROM Tracker WHERE name='Food Quality' AND department_id=(SELECT department_id FROM Department WHERE name='Food Services')), NULL, 'New', 'High', 'Found insect in daal', 'Dead cockroach in lunch daal today', 'Main Mess'),
(20, (SELECT tracker_id FROM Tracker WHERE name='Network Issues' AND department_id=(SELECT department_id FROM Department WHERE name='IT Services')), (SELECT user_id FROM User WHERE full_name='Salman Akhtar'), 'Resolved', 'Medium', 'Ethernet port dead in room 206', 'No wired internet in faculty office', 'Admin Block Room 206'),
(21, (SELECT tracker_id FROM Tracker WHERE name='Student Letters' AND department_id=(SELECT department_id FROM Department WHERE name='Registrar Secretariat')), NULL, 'New', 'Medium', 'Need bonafide certificate', 'For visa application need certificate on letterhead', 'Registrar Office'),
(22, (SELECT tracker_id FROM Tracker WHERE name='Lost and Found' AND department_id=(SELECT department_id FROM Department WHERE name='Transport')), (SELECT user_id FROM User WHERE full_name='Parvez Iqbal'), 'Assigned', 'Low', 'Lost wallet in bus', 'Wallet fell from pocket in university bus number 5', 'Transport Office'),
(23, (SELECT tracker_id FROM Tracker WHERE name='HR Operations' AND department_id=(SELECT department_id FROM Department WHERE name='Human Resources')), NULL, 'New', 'Low', 'Update personal information', 'Changed address need to update in records', 'HR Portal'),
(24, (SELECT tracker_id FROM Tracker WHERE name='Medical Insurance' AND department_id=(SELECT department_id FROM Department WHERE name='Human Resources')), NULL, 'New', 'High', 'Insurance claim not processed', 'Submitted medical claim 3 weeks ago no response', 'HR Office'),
(25, (SELECT tracker_id FROM Tracker WHERE name='Degree' AND department_id=(SELECT department_id FROM Department WHERE name='Registrar Secretariat')), NULL, 'New', 'Critical', 'Degree has wrong spelling of name', 'Name spelled "Ahmed" instead of "Ahmad"', 'Registrar Office');

UPDATE Complaint SET status = 'Under Review' WHERE complaint_id = 1;
UPDATE Complaint SET status = 'Assigned' WHERE complaint_id = 1;
UPDATE Complaint SET handler_id = (SELECT user_id FROM User WHERE full_name='Adeel Riaz'), status = 'In Progress' WHERE complaint_id = 1;
UPDATE Complaint SET status = 'Resolved' WHERE complaint_id = 1;
UPDATE Complaint SET handler_id = (SELECT user_id FROM User WHERE full_name='Chaudhry Naveed'), status = 'Assigned' WHERE complaint_id = 2;
UPDATE Complaint SET status = 'In Progress' WHERE complaint_id = 2;
UPDATE Complaint SET status = 'Resolved' WHERE complaint_id = 2;
UPDATE Complaint SET handler_id = (SELECT user_id FROM User WHERE full_name='Ghulam Mustafa'), status = 'Assigned' WHERE complaint_id = 3;
UPDATE Complaint SET status = 'Rejected' WHERE complaint_id = 3;
UPDATE Complaint SET handler_id = (SELECT user_id FROM User WHERE full_name='Dr. Farhat Abbas'), status = 'Assigned' WHERE complaint_id = 4;
UPDATE Complaint SET status = 'In Progress' WHERE complaint_id = 4;
UPDATE Complaint SET handler_id = (SELECT user_id FROM User WHERE full_name='Mariam Tariq'), status = 'Assigned' WHERE complaint_id = 5;
UPDATE Complaint SET status = 'Resolved' WHERE complaint_id = 5;
UPDATE Complaint SET handler_id = (SELECT user_id FROM User WHERE full_name='Latif ur Rehman'), status = 'Assigned' WHERE complaint_id = 6;
UPDATE Complaint SET status = 'In Progress' WHERE complaint_id = 6;
UPDATE Complaint SET handler_id = (SELECT user_id FROM User WHERE full_name='Salman Akhtar'), status = 'Resolved' WHERE complaint_id = 7;
UPDATE Complaint SET handler_id = (SELECT user_id FROM User WHERE full_name='Parvez Iqbal'), status = 'Assigned' WHERE complaint_id = 8;
UPDATE Complaint SET status = 'Rejected' WHERE complaint_id = 8;
UPDATE Complaint SET handler_id = (SELECT user_id FROM User WHERE full_name='Naeem Akhtar'), status = 'Assigned' WHERE complaint_id = 9;
UPDATE Complaint SET status = 'In Progress' WHERE complaint_id = 9;
UPDATE Complaint SET handler_id = (SELECT user_id FROM User WHERE full_name='Irfan Siddiqui'), status = 'Assigned' WHERE complaint_id = 10;
UPDATE Complaint SET status = 'Resolved' WHERE complaint_id = 10;
UPDATE Complaint SET handler_id = (SELECT user_id FROM User WHERE full_name='Irfan Siddiqui'), status = 'Assigned' WHERE complaint_id = 11;
UPDATE Complaint SET status = 'In Progress' WHERE complaint_id = 11;
UPDATE Complaint SET handler_id = (SELECT user_id FROM User WHERE full_name='Salman Akhtar'), status = 'Resolved' WHERE complaint_id = 12;
UPDATE Complaint SET handler_id = (SELECT user_id FROM User WHERE full_name='Khalid Mahmood'), status = 'Assigned' WHERE complaint_id = 13;
UPDATE Complaint SET status = 'Resolved' WHERE complaint_id = 13;
UPDATE Complaint SET handler_id = (SELECT user_id FROM User WHERE full_name='Obaidullah Khan'), status = 'Assigned' WHERE complaint_id = 14;
UPDATE Complaint SET status = 'In Progress' WHERE complaint_id = 14;
UPDATE Complaint SET handler_id = (SELECT user_id FROM User WHERE full_name='Rizwan Ali'), status = 'Assigned' WHERE complaint_id = 15;
UPDATE Complaint SET status = 'Resolved' WHERE complaint_id = 15;
UPDATE Complaint SET handler_id = (SELECT user_id FROM User WHERE full_name='Javeria Altaf'), status = 'Assigned' WHERE complaint_id = 16;
UPDATE Complaint SET status = 'In Progress' WHERE complaint_id = 16;

INSERT INTO Attachment (complaint_id, file_name, file_type, file_size_kb, storage_path) VALUES
(1, 'vscode_crash_screenshot.png', 'PNG', 180, '/uploads/comp1_crash.png'),
(1, 'error_log.txt_converted.jpg', 'JPG', 95, '/uploads/comp1_log.jpg'),
(2, 'voltage_meter_reading.jpg', 'JPG', 210, '/uploads/comp2_voltage.jpg'),
(3, 'missing_result_screenshot.png', 'PNG', 120, '/uploads/comp3_result.png'),
(4, 'classroom_overcrowded.jpg', 'JPG', 320, '/uploads/comp4_chairs.jpg'),
(5, 'hostel_application_receipt.png', 'PNG', 70, '/uploads/comp5_application.png'),
(6, 'sewage_leak.jpg', 'JPG', 450, '/uploads/comp6_sewage.jpg'),
(7, 'wifi_signal_issue.png', 'PNG', 140, '/uploads/comp7_wifi.png'),
(8, 'bus_timetable.jpg', 'JPG', 85, '/uploads/comp8_timetable.jpg'),
(9, 'samosa_price_tag.jpg', 'JPG', 110, '/uploads/comp9_price.jpg'),
(10, 'transcript_cgpa_error.png', 'PNG', 200, '/uploads/comp10_transcript.png'),
(11, 'degree_request_form.jpg', 'JPG', 150, '/uploads/comp11_degree.jpg'),
(12, 'printer_settings.png', 'PNG', 90, '/uploads/comp12_printer.png'),
(13, 'overflowing_bins.jpg', 'JPG', 280, '/uploads/comp13_bins.jpg'),
(14, 'salary_slip_may.jpg', 'JPG', 105, '/uploads/comp14_salary.jpg'),
(15, 'circuit_breaker_trip.jpg', 'JPG', 190, '/uploads/comp15_breaker.jpg'),
(16, 'experience_letter_request.png', 'PNG', 60, '/uploads/comp16_letter.png'),
(17, 'motherboard_burn.jpg', 'JPG', 340, '/uploads/comp17_motherboard.jpg'),
(18, 'ups_battery_test.png', 'PNG', 170, '/uploads/comp18_ups.png'),
(19, 'insect_in_food.jpg', 'JPG', 420, '/uploads/comp19_insect.jpg'),
(20, 'ethernet_port_damage.jpg', 'JPG', 130, '/uploads/comp20_ethernet.jpg');


SELECT complaint_id INTO @cid1 FROM Complaint WHERE subject = 'Printer driver missing' AND complainant_id = 1 ORDER BY complaint_id DESC LIMIT 1;
SELECT complaint_id INTO @cid2 FROM Complaint WHERE subject = 'Fan not working in lab' AND complainant_id = 2 ORDER BY complaint_id DESC LIMIT 1;
SELECT complaint_id INTO @cid3 FROM Complaint WHERE subject = 'Incorrect grade in transcript' AND complainant_id = 3 ORDER BY complaint_id DESC LIMIT 1;
SELECT complaint_id INTO @cid4 FROM Complaint WHERE subject = 'Whiteboard marker missing' AND complainant_id = 4 ORDER BY complaint_id DESC LIMIT 1;
SELECT complaint_id INTO @cid5 FROM Complaint WHERE subject = 'Washroom not cleaned' AND complainant_id = 5 ORDER BY complaint_id DESC LIMIT 1;
SELECT complaint_id INTO @cid6 FROM Complaint WHERE subject = 'Leaking tap in common area' AND complainant_id = 6 ORDER BY complaint_id DESC LIMIT 1;
SELECT complaint_id INTO @cid7 FROM Complaint WHERE subject = 'Slow internet in reference section' AND complainant_id = 7 ORDER BY complaint_id DESC LIMIT 1;
SELECT complaint_id INTO @cid8 FROM Complaint WHERE subject = 'Morning bus always late' AND complainant_id = 8 ORDER BY complaint_id DESC LIMIT 1;
SELECT complaint_id INTO @cid9 FROM Complaint WHERE subject = 'Rotten fruit served' AND complainant_id = 9 ORDER BY complaint_id DESC LIMIT 1;
SELECT complaint_id INTO @cid10 FROM Complaint WHERE subject = 'Salary shortfall for May' AND complainant_id = 10 ORDER BY complaint_id DESC LIMIT 1;


INSERT INTO Feedback (complaint_id, overall_rating, response_time_rating, communication_rating, resolution_rating, text_comment) VALUES
(@cid1, 5, 5, 5, 5, 'Driver installed quickly. Working perfectly.'),
(@cid2, 4, 4, 4, 4, 'Fan replaced within a day. Good service.'),
(@cid3, 5, 5, 5, 5, 'Grade corrected immediately. Very helpful.'),
(@cid4, 3, 4, 3, 2, 'Markers provided but took 3 days.'),
(@cid5, 5, 5, 5, 5, 'Cleaned same day. Excellent response.'),
(@cid6, 4, 4, 5, 4, 'Tap fixed but water pressure now low.'),
(@cid7, 5, 5, 5, 5, 'Speed improved significantly. Great work.'),
(@cid8, 4, 3, 4, 4, 'Bus now on time most days. Good improvement.'),
(@cid9, 5, 5, 5, 5, 'Food quality has improved after complaint.'),
(@cid10, 5, 5, 5, 5, 'Shortfall credited within 24 hours. Thank you.');

INSERT INTO Audit_Log (user_id, complaint_id, action_type, description, ip_address) VALUES
(1, NULL, 'Login', 'Student login from hostel', '10.20.30.41'),
(2, NULL, 'Login_Failed', 'Failed login attempt for bilal.tariq', '10.20.30.42'),
(17, 1, 'Status_Changed', 'Changed status from New to Under Review', '172.16.1.10'),
(40, 1, 'Complaint_Assigned', 'Assigned complaint 1 to Adeel Riaz', '172.16.1.1'),
(17, 1, 'Status_Changed', 'Changed status to In Progress', '172.16.1.10'),
(17, 1, 'Status_Changed', 'Changed status to Resolved', '172.16.1.10'),
(19, 2, 'Complaint_Assigned', 'Assigned complaint 2 to Chaudhry Naveed', '172.16.1.1'),
(40, 3, 'Complaint_Assigned', 'Assigned complaint 3 to Ghulam Mustafa', '172.16.1.1'),
(21, 3, 'Status_Changed', 'Changed status to Rejected', '172.16.1.15'),
(40, 4, 'Complaint_Assigned', 'Assigned complaint 4 to Dr. Farhat Abbas', '172.16.1.1'),
(40, 5, 'Complaint_Assigned', 'Assigned complaint 5 to Mariam Tariq', '172.16.1.1'),
(27, 5, 'Status_Changed', 'Changed status to Resolved', '10.20.30.50'),
(40, 6, 'Complaint_Assigned', 'Assigned complaint 6 to Latif ur Rehman', '172.16.1.1'),
(40, 7, 'Complaint_Assigned', 'Assigned complaint 7 to Salman Akhtar', '172.16.1.1'),
(33, 7, 'Status_Changed', 'Changed status to Resolved', '10.20.30.55'),
(40, 8, 'Complaint_Assigned', 'Assigned complaint 8 to Parvez Iqbal', '172.16.1.1'),
(30, 8, 'Status_Changed', 'Changed status to Rejected', '10.20.30.60'),
(40, 9, 'Complaint_Assigned', 'Assigned complaint 9 to Naeem Akhtar', '172.16.1.1'),
(40, 10, 'Complaint_Assigned', 'Assigned complaint 10 to Irfan Siddiqui', '172.16.1.1'),
(23, 10, 'Status_Changed', 'Changed status to Resolved', '172.16.1.20'),
(40, 11, 'Complaint_Assigned', 'Assigned complaint 11 to Irfan Siddiqui', '172.16.1.1'),
(40, 12, 'Complaint_Assigned', 'Assigned complaint 12 to Salman Akhtar', '172.16.1.1'),
(33, 12, 'Status_Changed', 'Changed status to Resolved', '10.20.30.55'),
(40, 13, 'Complaint_Assigned', 'Assigned complaint 13 to Khalid Mahmood', '172.16.1.1'),
(25, 13, 'Status_Changed', 'Changed status to Resolved', '10.20.30.70'),
(40, 14, 'Complaint_Assigned', 'Assigned complaint 14 to Obaidullah Khan', '172.16.1.1'),
(40, 15, 'Complaint_Assigned', 'Assigned complaint 15 to Rizwan Ali', '172.16.1.1'),
(32, 15, 'Status_Changed', 'Changed status to Resolved', '10.20.30.75'),
(40, 16, 'Complaint_Assigned', 'Assigned complaint 16 to Javeria Altaf', '172.16.1.1'),
(39, NULL, 'Login', 'Software operator login', '127.0.0.1'),
(40, NULL, 'Login', 'Senior handler login', '172.16.1.1'),
(17, 1, 'Attachment_Uploaded', 'Attachment uploaded for complaint 1', '172.16.1.10'),
(2, 2, 'Attachment_Uploaded', 'Attachment uploaded for complaint 2', '10.20.30.42');


UPDATE User 
SET department_id = (SELECT department_id FROM Department WHERE name = 'Computer Science')
WHERE is_student = TRUE 
  AND department_id NOT IN (
    SELECT department_id FROM Department 
    WHERE name IN ('Computer Science', 'Electrical Engineering', 'Business Studies', 'Mathematics')
  );


UPDATE Complaint 
SET handler_id = NULL 
WHERE handler_id IN (
    SELECT user_id FROM User WHERE is_complaint_handler = FALSE
);

UPDATE Complaint SET handler_id = (SELECT user_id FROM User WHERE full_name = 'Adeel Riaz') 
WHERE complaint_id IN (3, 10, 11);
UPDATE Complaint SET handler_id = (SELECT user_id FROM User WHERE full_name = 'Salman Akhtar') 
WHERE complaint_id IN (8, 14);
UPDATE Complaint SET handler_id = (SELECT user_id FROM User WHERE full_name = 'Latif ur Rehman') 
WHERE complaint_id = 9;
UPDATE Complaint SET handler_id = (SELECT user_id FROM User WHERE full_name = 'Parvez Iqbal') 
WHERE complaint_id = 16;
UPDATE Complaint SET handler_id = (SELECT user_id FROM User WHERE full_name = 'Mariam Tariq') 
WHERE complaint_id = 6;
UPDATE Complaint SET handler_id = (SELECT user_id FROM User WHERE full_name = 'Dr. Farhat Abbas') 
WHERE complaint_id = 4;

DELETE FROM Feedback 
WHERE complaint_id IN (3,4,6,8,9,11,14,16,17,18,19);

INSERT INTO Complaint (complainant_id, tracker_id, handler_id, status, priority, subject, description, location) VALUES
(1, (SELECT tracker_id FROM Tracker WHERE name='Software Issues' AND department_id=(SELECT department_id FROM Department WHERE name='Computer Science')), (SELECT user_id FROM User WHERE full_name='Adeel Riaz'), 'Resolved', 'Medium', 'Printer driver missing', 'Unable to print from lab PC', 'CS Lab 3'),
(2, (SELECT tracker_id FROM Tracker WHERE name='Electrical' AND department_id=(SELECT department_id FROM Department WHERE name='Electrical Engineering')), (SELECT user_id FROM User WHERE full_name='Chaudhry Naveed'), 'Resolved', 'High', 'Fan not working in lab', 'Ceiling fan making noise and stopped', 'EE Lab 2'),
(3, (SELECT tracker_id FROM Tracker WHERE name='Results' AND department_id=(SELECT department_id FROM Department WHERE name='Business Studies')), (SELECT user_id FROM User WHERE full_name='Prof. Shahid Mehmood'), 'Resolved', 'Medium', 'Incorrect grade in transcript', 'Grade shown as C instead of B+', 'Exams Department'),
(4, (SELECT tracker_id FROM Tracker WHERE name='Seats Issues' AND department_id=(SELECT department_id FROM Department WHERE name='Mathematics')), (SELECT user_id FROM User WHERE full_name='Dr. Farhat Abbas'), 'Resolved', 'Low', 'Whiteboard marker missing', 'No markers in classroom for two days', 'M Block Room 205'),
(5, (SELECT tracker_id FROM Tracker WHERE name='Cleaning' AND department_id=(SELECT department_id FROM Department WHERE name='Girls Hostel')), (SELECT user_id FROM User WHERE full_name='Mariam Tariq'), 'Resolved', 'Low', 'Washroom not cleaned', 'Dirty washroom on floor 3 since yesterday', 'Girls Hostel Block C'),
(6, (SELECT tracker_id FROM Tracker WHERE name='Plumbing' AND department_id=(SELECT department_id FROM Department WHERE name='Boys Hostel')), (SELECT user_id FROM User WHERE full_name='Latif ur Rehman'), 'Resolved', 'High', 'Leaking tap in common area', 'Water tap leaks constantly, wasting water', 'Boys Hostel Block B'),
(7, (SELECT tracker_id FROM Tracker WHERE name='Network Issues' AND department_id=(SELECT department_id FROM Department WHERE name='Library')), (SELECT user_id FROM User WHERE full_name='Prof. Asad Raza'), 'Resolved', 'Medium', 'Slow internet in reference section', 'Download speed below 1 Mbps', 'Library 2nd Floor'),
(8, (SELECT tracker_id FROM Tracker WHERE name='Timing' AND department_id=(SELECT department_id FROM Department WHERE name='Transport')), (SELECT user_id FROM User WHERE full_name='Parvez Iqbal'), 'Resolved', 'Medium', 'Morning bus always late', 'Bus arrives 15-20 mins late daily', 'City Stop'),
(9, (SELECT tracker_id FROM Tracker WHERE name='Food Quality' AND department_id=(SELECT department_id FROM Department WHERE name='Food Services')), (SELECT user_id FROM User WHERE full_name='Salman Akhtar'), 'Resolved', 'High', 'Rotten fruit served', 'Apples in mess were spoiled', 'Main Mess'),
(10, (SELECT tracker_id FROM Tracker WHERE name='Salary' AND department_id=(SELECT department_id FROM Department WHERE name='Finance')), (SELECT user_id FROM User WHERE full_name='Waseem Abbas'), 'Resolved', 'Critical', 'Salary shortfall for May', 'Received only half of expected salary', 'Finance Office');


INSERT INTO Feedback (complaint_id, overall_rating, response_time_rating, communication_rating, resolution_rating, text_comment) VALUES
((SELECT complaint_id FROM Complaint WHERE subject='Printer driver missing' AND complainant_id=1), 5, 5, 5, 5, 'Driver installed quickly. Working perfectly.'),
((SELECT complaint_id FROM Complaint WHERE subject='Fan not working in lab' AND complainant_id=2), 4, 4, 4, 4, 'Fan replaced within a day. Good service.'),
((SELECT complaint_id FROM Complaint WHERE subject='Incorrect grade in transcript' AND complainant_id=3), 5, 5, 5, 5, 'Grade corrected immediately. Very helpful.'),
((SELECT complaint_id FROM Complaint WHERE subject='Whiteboard marker missing' AND complainant_id=4), 3, 4, 3, 2, 'Markers provided but took 3 days.'),
((SELECT complaint_id FROM Complaint WHERE subject='Washroom not cleaned' AND complainant_id=5), 5, 5, 5, 5, 'Cleaned same day. Excellent response.'),
((SELECT complaint_id FROM Complaint WHERE subject='Leaking tap in common area' AND complainant_id=6), 4, 4, 5, 4, 'Tap fixed but water pressure now low.'),
((SELECT complaint_id FROM Complaint WHERE subject='Slow internet in reference section' AND complainant_id=7), 5, 5, 5, 5, 'Speed improved significantly. Great work.'),
((SELECT complaint_id FROM Complaint WHERE subject='Morning bus always late' AND complainant_id=8), 4, 3, 4, 4, 'Bus now on time most days. Good improvement.'),
((SELECT complaint_id FROM Complaint WHERE subject='Rotten fruit served' AND complainant_id=9), 5, 5, 5, 5, 'Food quality has improved after complaint.'),
((SELECT complaint_id FROM Complaint WHERE subject='Salary shortfall for May' AND complainant_id=10), 5, 5, 5, 5, 'Shortfall credited within 24 hours. Thank you.');


UPDATE User SET is_complaint_handler = FALSE WHERE is_student = TRUE;
DELETE FROM Complaint_Handler WHERE user_id IN (SELECT user_id FROM User WHERE is_student = TRUE);