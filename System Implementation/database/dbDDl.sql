DROP DATABASE IF EXISTS complaint_db;
CREATE DATABASE complaint_db;
USE complaint_db;

CREATE TABLE Department (
    department_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) UNIQUE NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE Tracker (
    tracker_id INT AUTO_INCREMENT PRIMARY KEY,
    department_id INT NOT NULL,
    name VARCHAR(150) NOT NULL,
    description TEXT, 
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (department_id) REFERENCES Department(department_id)
);

CREATE TABLE `User` (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    department_id INT NULL,
    account_status ENUM('Active', 'Locked', 'Inactive') DEFAULT 'Active',
    failed_login_count INT DEFAULT 0,
    device_token VARCHAR(512) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_student BOOLEAN DEFAULT FALSE,
    is_faculty BOOLEAN DEFAULT FALSE,
    is_staff BOOLEAN DEFAULT FALSE,
    is_complaint_handler BOOLEAN DEFAULT FALSE,
    role ENUM('complainant', 'junior_handler', 'senior_handler', 'software_operator') NOT NULL,
    FOREIGN KEY (department_id) REFERENCES Department(department_id)
        ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT chk_user_subtype CHECK (
        (is_student = TRUE AND is_faculty = FALSE AND is_staff = FALSE) OR
        (is_student = FALSE AND is_faculty = TRUE AND is_staff = FALSE) OR
        (is_student = FALSE AND is_faculty = FALSE AND is_staff = TRUE)
    )
);

ALTER TABLE `User` ADD COLUMN senior_handler_active_flag VARCHAR(20) AS (
    CASE 
        WHEN role = 'senior_handler' AND account_status = 'Active' 
        THEN 'active_senior' 
        ELSE NULL 
    END
) STORED;
CREATE UNIQUE INDEX uq_active_senior_handler ON `User`(senior_handler_active_flag);

CREATE TABLE Student (
    user_id INT PRIMARY KEY,
    reg_number VARCHAR(30) UNIQUE NOT NULL,
    program VARCHAR(100) NOT NULL,
    semester TINYINT,
    enrollment_date DATE NOT NULL,
    FOREIGN KEY (user_id) REFERENCES `User`(user_id)
        ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE Faculty (
    user_id INT PRIMARY KEY,
    designation VARCHAR(100) NOT NULL,
    office_number VARCHAR(10),
    FOREIGN KEY (user_id) REFERENCES `User`(user_id)
        ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE Staff (
    user_id INT PRIMARY KEY,
    position VARCHAR(100) NOT NULL,
    staff_type ENUM('Administrative', 'Technical'),
    FOREIGN KEY (user_id) REFERENCES `User`(user_id)
        ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE Complaint_Handler (
    user_id INT PRIMARY KEY,
    handler_level ENUM('senior', 'junior') NOT NULL,
    manager_id INT,
    FOREIGN KEY (user_id) REFERENCES `User`(user_id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (manager_id) REFERENCES Complaint_Handler(user_id)
        ON UPDATE CASCADE ON DELETE SET NULL
);

CREATE TABLE Complaint (
    complaint_id INT AUTO_INCREMENT PRIMARY KEY,
    complainant_id INT NOT NULL,
    tracker_id INT NOT NULL,
    handler_id INT,
    status ENUM('New', 'Under Review', 'Assigned', 'In Progress', 'Resolved', 'Rejected', 'Closed') DEFAULT 'New',
    priority ENUM('Low', 'Medium', 'High', 'Critical') NOT NULL,
    subject VARCHAR(200) NOT NULL,
    description VARCHAR(2000) NOT NULL,
    location VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (complainant_id) REFERENCES `User`(user_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    FOREIGN KEY (tracker_id) REFERENCES Tracker(tracker_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    FOREIGN KEY (handler_id) REFERENCES `User`(user_id)
        ON UPDATE CASCADE ON DELETE SET NULL
);

CREATE TABLE Attachment (
    attachment_id INT AUTO_INCREMENT PRIMARY KEY,
    complaint_id INT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_type ENUM('JPG', 'PNG') NOT NULL,
    file_size_kb INT NOT NULL CHECK (file_size_kb BETWEEN 1 AND 2048),
    storage_path VARCHAR(512) NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (complaint_id) REFERENCES Complaint(complaint_id)
        ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE Status_History (
    history_id INT AUTO_INCREMENT PRIMARY KEY,
    complaint_id INT NOT NULL,
    changed_by INT NOT NULL,
    old_status ENUM('New', 'Under Review', 'Assigned', 'In Progress', 'Resolved', 'Rejected', 'Closed'),
    new_status ENUM('New', 'Under Review', 'Assigned', 'In Progress', 'Resolved', 'Rejected', 'Closed') NOT NULL,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    remarks VARCHAR(500),
    FOREIGN KEY (complaint_id) REFERENCES Complaint(complaint_id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (changed_by) REFERENCES `User`(user_id)
        ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE TABLE Feedback (
    feedback_id INT AUTO_INCREMENT PRIMARY KEY,
    complaint_id INT UNIQUE NOT NULL,
    overall_rating TINYINT NOT NULL CHECK (overall_rating BETWEEN 1 AND 5),
    response_time_rating TINYINT CHECK (response_time_rating BETWEEN 1 AND 5),
    communication_rating TINYINT CHECK (communication_rating BETWEEN 1 AND 5),
    resolution_rating TINYINT CHECK (resolution_rating BETWEEN 1 AND 5),
    text_comment VARCHAR(500) NULL,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (complaint_id) REFERENCES Complaint(complaint_id)
        ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE Audit_Log (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    complaint_id INT,
    action_type ENUM(
        'Login', 'Login_Failed', 'Account_Locked', 'Complaint_Submitted',
        'Status_Changed', 'Complaint_Assigned', 'Feedback_Submitted',
        'Attachment_Uploaded', 'User_Created', 'User_Updated'
    ) NOT NULL,
    description TEXT,
    ip_address VARCHAR(45),
    occurred_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES `User`(user_id)
        ON UPDATE CASCADE ON DELETE SET NULL,
    FOREIGN KEY (complaint_id) REFERENCES Complaint(complaint_id)
        ON UPDATE CASCADE ON DELETE SET NULL
);

DELIMITER //

CREATE TRIGGER trg_complaint_after_insert
AFTER INSERT ON Complaint
FOR EACH ROW
BEGIN
    INSERT INTO Status_History (complaint_id, changed_by, old_status, new_status, remarks)
    VALUES (NEW.complaint_id, NEW.complainant_id, NULL, NEW.status, 'Initial submission');
    INSERT INTO Audit_Log (user_id, complaint_id, action_type, description)
    VALUES (NEW.complainant_id, NEW.complaint_id, 'Complaint_Submitted',
            CONCAT('New complaint submitted: ', NEW.subject));
END//

CREATE TRIGGER trg_complaint_status_change
AFTER UPDATE ON Complaint
FOR EACH ROW
BEGIN
    IF OLD.status != NEW.status THEN
        INSERT INTO Status_History (complaint_id, changed_by, old_status, new_status, remarks)
        VALUES (NEW.complaint_id,
                IFNULL(NEW.handler_id, NEW.complainant_id),
                OLD.status, NEW.status, 'Status updated');
        INSERT INTO Audit_Log (user_id, complaint_id, action_type, description)
        VALUES (IFNULL(NEW.handler_id, NEW.complainant_id), NEW.complaint_id, 'Status_Changed',
                CONCAT('Status changed from ', OLD.status, ' to ', NEW.status));
    END IF;
    IF (OLD.handler_id IS NULL AND NEW.handler_id IS NOT NULL) THEN
        INSERT INTO Audit_Log (user_id, complaint_id, action_type, description)
        VALUES (NEW.handler_id, NEW.complaint_id, 'Complaint_Assigned',
                'Complaint assigned to handler');
    END IF;
END//

CREATE TRIGGER trg_feedback_after_insert
AFTER INSERT ON Feedback
FOR EACH ROW
BEGIN
    DECLARE new_comp_status ENUM('New', 'Under Review', 'Assigned', 'In Progress', 'Resolved', 'Rejected', 'Closed');
    IF NEW.overall_rating > 3 THEN
        SET new_comp_status = 'Closed';
    ELSE
        SET new_comp_status = 'Under Review';
    END IF;
    UPDATE Complaint SET status = new_comp_status
    WHERE complaint_id = NEW.complaint_id;
    INSERT INTO Audit_Log (user_id, complaint_id, action_type, description)
    VALUES ((SELECT complainant_id FROM Complaint WHERE complaint_id = NEW.complaint_id),
            NEW.complaint_id, 'Feedback_Submitted',
            CONCAT('Feedback submitted with rating: ', NEW.overall_rating));
END//

CREATE TRIGGER trg_feedback_before_insert
BEFORE INSERT ON Feedback
FOR EACH ROW
BEGIN
    DECLARE comp_status VARCHAR(20);
    SELECT status INTO comp_status FROM Complaint WHERE complaint_id = NEW.complaint_id;
    IF comp_status IS NULL OR comp_status != 'Resolved' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Feedback can only be submitted when complaint status is Resolved';
    END IF;
END//

CREATE TRIGGER trg_user_login_failed
BEFORE UPDATE ON `User`
FOR EACH ROW
BEGIN
    IF NEW.failed_login_count >= 5 AND OLD.account_status = 'Active' THEN
        SET NEW.account_status = 'Locked';
        INSERT INTO Audit_Log (user_id, action_type, description)
        VALUES (NEW.user_id, 'Account_Locked', 'Account locked due to multiple failed logins');
    END IF;
END//

CREATE TRIGGER trg_attachment_after_insert
AFTER INSERT ON Attachment
FOR EACH ROW
BEGIN
    INSERT INTO Audit_Log (user_id, complaint_id, action_type, description)
    VALUES ((SELECT complainant_id FROM Complaint WHERE complaint_id = NEW.complaint_id),
            NEW.complaint_id, 'Attachment_Uploaded',
            CONCAT('Attachment uploaded: ', NEW.file_name));
END//

CREATE TRIGGER trg_attachment_limit
BEFORE INSERT ON Attachment
FOR EACH ROW
BEGIN
    DECLARE attachment_count INT;
    SELECT COUNT(*) INTO attachment_count
    FROM Attachment WHERE complaint_id = NEW.complaint_id;
    IF attachment_count >= 5 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Maximum 5 attachments per complaint';
    END IF;
END//

CREATE TRIGGER trg_user_after_insert
AFTER INSERT ON `User`
FOR EACH ROW
BEGIN
    INSERT INTO Audit_Log (user_id, action_type, description)
    VALUES (NEW.user_id, 'User_Created',
            CONCAT('New user created: ', NEW.email, ' (', NEW.role, ')'));
END//

CREATE PROCEDURE sp_assign_complaint(
    IN p_complaint_id INT,
    IN p_handler_id INT,
    IN p_caller_id INT
)
BEGIN
    DECLARE handler_exists INT;
    DECLARE caller_role VARCHAR(50);
    SELECT role INTO caller_role FROM `User` WHERE user_id = p_caller_id;
    IF caller_role != 'senior_handler' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Only senior handlers can assign complaints';
    END IF;
    SELECT COUNT(*) INTO handler_exists
    FROM Complaint_Handler WHERE user_id = p_handler_id;
    IF handler_exists = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid handler';
    END IF;
    UPDATE Complaint
    SET handler_id = p_handler_id,
        status = 'Assigned'
    WHERE complaint_id = p_complaint_id;
END//

CREATE PROCEDURE sp_update_status(
    IN p_complaint_id INT,
    IN p_new_status VARCHAR(20),
    IN p_caller_id INT,
    IN p_remarks VARCHAR(500)
)
BEGIN
    DECLARE caller_role VARCHAR(50);
    DECLARE complaint_handler INT;
    IF p_new_status NOT IN ('New','Under Review','Assigned','In Progress','Resolved','Rejected','Closed') THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid status value';
    END IF;
    SELECT role INTO caller_role FROM `User` WHERE user_id = p_caller_id;
    IF caller_role NOT IN ('senior_handler', 'junior_handler') THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Only complaint handlers can change status';
    END IF;
    IF caller_role = 'junior_handler' THEN
        SELECT handler_id INTO complaint_handler
        FROM Complaint WHERE complaint_id = p_complaint_id;
        IF complaint_handler != p_caller_id THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Junior handlers can only update their own complaints';
        END IF;
    END IF;
    UPDATE Complaint
    SET status = p_new_status
    WHERE complaint_id = p_complaint_id;
END//

CREATE PROCEDURE sp_set_account_status(
    IN p_user_id INT,
    IN p_new_status VARCHAR(20),
    IN p_caller_id INT
)
BEGIN
    DECLARE caller_role VARCHAR(50);
    IF p_new_status NOT IN ('Active','Locked','Inactive') THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid account status';
    END IF;
    SELECT role INTO caller_role FROM `User` WHERE user_id = p_caller_id;
    IF caller_role != 'software_operator' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Only software operator can manage accounts';
    END IF;
    UPDATE `User`
    SET account_status = p_new_status,
        failed_login_count = 0
    WHERE user_id = p_user_id;
    INSERT INTO Audit_Log (user_id, action_type, description)
    VALUES (p_user_id, 'User_Updated',
            CONCAT('Account status changed to ', p_new_status));
END//

CREATE FUNCTION fn_handler_open_count(p_handler_id INT)
RETURNS INT
DETERMINISTIC
BEGIN
    RETURN (
        SELECT COUNT(*) FROM Complaint
        WHERE handler_id = p_handler_id
        AND status NOT IN ('Resolved', 'Closed', 'Rejected')
    );
END//

CREATE FUNCTION fn_dept_avg_rating(p_department_id INT)
RETURNS DECIMAL(4,2)
DETERMINISTIC
BEGIN
    RETURN (
        SELECT AVG(f.overall_rating)
        FROM Feedback f
        JOIN Complaint c ON f.complaint_id = c.complaint_id
        JOIN Tracker t ON c.tracker_id = t.tracker_id
        WHERE t.department_id = p_department_id
    );
END//

CREATE PROCEDURE sp_create_user(
    IN p_full_name VARCHAR(150),
    IN p_email VARCHAR(255),
    IN p_password_hash VARCHAR(255),
    IN p_role VARCHAR(30),
    IN p_is_student BOOLEAN,
    IN p_is_faculty BOOLEAN,
    IN p_is_staff BOOLEAN,
    IN p_department_id INT,
    IN p_reg_number VARCHAR(30),
    IN p_program VARCHAR(100),
    IN p_semester TINYINT,
    IN p_enrollment_date DATE,
    IN p_designation VARCHAR(100),
    IN p_office_number VARCHAR(10),
    IN p_position VARCHAR(100),
    IN p_staff_type VARCHAR(20),
    IN p_manager_id INT
)
BEGIN
    DECLARE v_user_id INT;
    IF p_role NOT IN ('complainant','junior_handler','senior_handler','software_operator') THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid role';
    END IF;
    IF p_staff_type IS NOT NULL AND p_staff_type NOT IN ('Administrative','Technical') THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid staff_type';
    END IF;
    IF (p_is_student AND p_is_faculty) OR (p_is_student AND p_is_staff) OR (p_is_faculty AND p_is_staff) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'A user can have only one subtype: student, faculty, or staff';
    END IF;
    START TRANSACTION;
    INSERT INTO `User` (full_name, email, password_hash, role, is_student, is_faculty, is_staff, department_id, account_status)
    VALUES (p_full_name, p_email, p_password_hash, p_role, p_is_student, p_is_faculty, p_is_staff, p_department_id, 'Active');
    SET v_user_id = LAST_INSERT_ID();
    IF p_is_student THEN
        INSERT INTO Student (user_id, reg_number, program, semester, enrollment_date)
        VALUES (v_user_id, p_reg_number, p_program, p_semester, COALESCE(p_enrollment_date, CURDATE()));
    END IF;
    IF p_is_faculty THEN
        INSERT INTO Faculty (user_id, designation, office_number)
        VALUES (v_user_id, p_designation, p_office_number);
    END IF;
    IF p_is_staff THEN
        INSERT INTO Staff (user_id, position, staff_type)
        VALUES (v_user_id, p_position, p_staff_type);
    END IF;
    IF p_role IN ('junior_handler', 'senior_handler') THEN
        INSERT INTO Complaint_Handler (user_id, handler_level, manager_id)
        VALUES (v_user_id, IF(p_role = 'senior_handler', 'senior', 'junior'), p_manager_id);
    END IF;
    COMMIT;
END//

DELIMITER ;

CREATE VIEW vw_software_operator_complaints AS
SELECT * FROM Complaint;

ALTER TABLE Faculty MODIFY office_number VARCHAR(20);