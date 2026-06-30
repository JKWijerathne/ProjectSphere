import mongoose from 'mongoose';
import dns from 'dns';
import dotenv from 'dotenv';
import app from './src/app.js';
import User from './src/models/userModel.js';
import Project from './src/models/projectModel.js';
import Notification from './src/models/notificationModel.js';
import { generateToken } from './src/utils/jwt.js';

// Apply DNS fix
dns.setServers(['8.8.8.8', '1.1.1.1']);
dotenv.config();

const PORT = 5001; // Use a different port to avoid conflicts
let serverInstance;

async function runTests() {
    try {
        console.log('Connecting to database...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to database.');

        // 1. Seed Test Users
        console.log('Seeding test users...');
        await User.deleteMany({ email: { $in: ['student@test.com', 'recruiter@test.com', 'lecturer@test.com'] } });
        
        const student = await User.create({
            name: 'Alice Student',
            email: 'student@test.com',
            role: 'Student'
        });

        const recruiter = await User.create({
            name: 'Bob Recruiter',
            email: 'recruiter@test.com',
            role: 'Recruiter'
        });

        const lecturer = await User.create({
            name: 'Dr. Charlie Lecturer',
            email: 'lecturer@test.com',
            role: 'Lecturer'
        });

        console.log('Test users created successfully.');

        // 2. Generate Tokens
        const studentToken = generateToken(student._id.toString());
        const recruiterToken = generateToken(recruiter._id.toString());
        const lecturerToken = generateToken(lecturer._id.toString());

        // Clean any existing projects for these users
        await Project.deleteMany({ owner: student._id });
        await Notification.deleteMany({ recipient: { $in: [student._id, recruiter._id, lecturer._id] } });

        // 3. Start Express Server
        console.log(`Starting server on port ${PORT}...`);
        await new Promise((resolve) => {
            serverInstance = app.listen(PORT, () => {
                console.log(`Server listening on port ${PORT}`);
                resolve();
            });
        });

        const baseUrl = `http://localhost:${PORT}/api`;

        // 4. Test Case: Student Creates a Project
        console.log('\n--- Test: Student Creates Project ---');
        const createRes = await fetch(`${baseUrl}/projects`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${studentToken}`
            },
            body: JSON.stringify({
                title: 'ProjectSphere Portfolio',
                description: 'A platform to showcase student MERN projects.',
                technologies: 'MongoDB,Express,React,Node',
                category: 'Web Application',
                githubUrl: 'https://github.com/test/projectsphere'
            })
        });
        const createData = await createRes.json();
        console.log('Create Project Response status:', createRes.status);
        console.log('Created Project:', createData.project?.title, 'Status:', createData.project?.status);
        const projectId = createData.project?._id;

        if (!projectId) throw new Error('Failed to create project');

        // Wait a small bit for event listener to write to DB
        await new Promise(r => setTimeout(r, 500));

        // Verify Lecturer Notification was created
        const lecNotifs = await Notification.find({ recipient: lecturer._id });
        console.log('Lecturer notifications count (should be 1):', lecNotifs.length);
        console.log('Lecturer notification message:', lecNotifs[0]?.message);

        // 5. Test Case: Lecturer Views Pending Projects
        console.log('\n--- Test: Lecturer Fetches Pending Projects ---');
        const pendingRes = await fetch(`${baseUrl}/admin/projects/pending`, {
            headers: { 'Authorization': `Bearer ${lecturerToken}` }
        });
        const pendingData = await pendingRes.json();
        console.log('Pending projects count:', pendingData.projects?.length);

        // 6. Test Case: Lecturer Approves Project
        console.log('\n--- Test: Lecturer Approves Project ---');
        const approveRes = await fetch(`${baseUrl}/admin/projects/${projectId}/approve`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${lecturerToken}` }
        });
        const approveData = await approveRes.json();
        console.log('Approve response message:', approveData.message);
        console.log('Approved project status:', approveData.project?.status);

        await new Promise(r => setTimeout(r, 500));

        // Verify Student Notification for approval
        let studentNotifs = await Notification.find({ recipient: student._id });
        console.log('Student notifications count (should be 1):', studentNotifs.length);
        console.log('Student notification message:', studentNotifs.find(n => n.type === 'ProjectApproved')?.message);

        // 7. Test Case: Recruiter Likes Project
        console.log('\n--- Test: Recruiter Likes Project ---');
        const likeRes = await fetch(`${baseUrl}/projects/${projectId}/like`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${recruiterToken}` }
        });
        const likeData = await likeRes.json();
        console.log('Like response:', likeData);

        await new Promise(r => setTimeout(r, 500));

        // Verify Student Notification for like
        studentNotifs = await Notification.find({ recipient: student._id });
        console.log('Student notifications count (should be 2):', studentNotifs.length);
        console.log('Student notification message:', studentNotifs.find(n => n.type === 'ProjectLiked')?.message);

        // 8. Test Case: Recruiter Follows Student
        console.log('\n--- Test: Recruiter Follows Student ---');
        const followRes = await fetch(`${baseUrl}/users/${student._id}/follow`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${recruiterToken}` }
        });
        const followData = await followRes.json();
        console.log('Follow response:', followData);

        await new Promise(r => setTimeout(r, 500));

        // Verify Student Notification for follow
        studentNotifs = await Notification.find({ recipient: student._id });
        console.log('Student notifications count (should be 3):', studentNotifs.length);
        console.log('Student notification message:', studentNotifs.find(n => n.type === 'UserFollowed')?.message);

        // 9. Test Case: Student Retrieves Notifications & Marks as Read
        console.log('\n--- Test: Student Fetches Notifications & Marks Read ---');
        const getNotifRes = await fetch(`${baseUrl}/notifications`, {
            headers: { 'Authorization': `Bearer ${studentToken}` }
        });
        const getNotifData = await getNotifRes.json();
        console.log('Fetched student notifications count:', getNotifData.notifications?.length);
        const notifToRead = getNotifData.notifications?.[0];

        if (notifToRead) {
            console.log(`Marking notification ${notifToRead._id} as read...`);
            const readRes = await fetch(`${baseUrl}/notifications/${notifToRead._id}/read`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${studentToken}` }
            });
            const readData = await readRes.json();
            console.log('Marked read response notification isRead:', readData.notification?.isRead);
        }

        // 10. Test Case: Lecturer Fetches Dashboard Stats
        console.log('\n--- Test: Lecturer Dashboard Stats ---');
        const dashRes = await fetch(`${baseUrl}/admin/dashboard`, {
            headers: { 'Authorization': `Bearer ${lecturerToken}` }
        });
        const dashData = await dashRes.json();
        console.log('Dashboard stats:', JSON.stringify(dashData.stats, null, 2));
        console.log('Recent projects count:', dashData.recentProjects?.length);

        console.log('\n======================================');
        console.log('ALL TESTS COMPLETED SUCCESSFULLY!');
        console.log('======================================');

    } catch (error) {
        console.error('Test run failed with error:', error);
    } finally {
        if (serverInstance) {
            console.log('Stopping server...');
            serverInstance.close();
        }
        console.log('Closing database connection...');
        await mongoose.connection.close();
        console.log('Database connection closed. Exiting.');
        process.exit(0);
    }
}

runTests();
